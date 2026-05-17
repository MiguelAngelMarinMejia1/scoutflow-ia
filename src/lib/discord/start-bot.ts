import { config } from "dotenv";
import type { Message } from "discord.js";

import { discordClient } from "./client";
import { generarDiagnostico, responderConsultaDiscord } from "../gemini";
import { guardarCasoDiscord, obtenerAreaDiscord } from "../supabase.discord";
import { Caso, CasoFormulario, Diagnostico } from "../../types";

config({ path: ".env.local" });

const token = process.env.DISCORD_BOT_TOKEN;
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

if (!token) {
  throw new Error("Missing DISCORD_BOT_TOKEN in .env.local");
}

const areaOptions = [
  { id: "finanzas", nombre: "Finanzas" },
  { id: "logistica", nombre: "Logistica" },
  { id: "marketing", nombre: "Marketing" },
  { id: "operaciones", nombre: "Operaciones" },
  { id: "recursos-humanos", nombre: "Recursos Humanos" },
  { id: "tecnologia", nombre: "Tecnologia" },
  { id: "ventas", nombre: "Ventas" },
] as const;

type AreaOption = (typeof areaOptions)[number];
type ScouterField = keyof Pick<
  CasoFormulario,
  "contexto" | "impacto" | "actores" | "pasosManuales" | "cuellosBottella"
> | "area";

interface ScouterSession {
  currentStep: number;
  data: Partial<CasoFormulario> & {
    area?: AreaOption;
  };
}

const scouterSessions = new Map<string, ScouterSession>();

const scouterQuestions: Array<{
  field: ScouterField;
  question: string;
  normalize?: (value: string) => string | AreaOption | null;
}> = [
  {
    field: "area",
    question: [
      "1/6 Selecciona el area afectada respondiendo con el numero o el nombre:",
      formatAreaOptions(),
    ].join("\n"),
    normalize: normalizeArea,
  },
  {
    field: "contexto",
    question: "2/6 Contexto del problema: describe que esta pasando y que problema enfrenta el area.",
  },
  {
    field: "impacto",
    question: "3/6 Nivel de impacto: responde Alto, Medio o Bajo.",
    normalize: normalizeImpacto,
  },
  {
    field: "actores",
    question: "4/6 Actores involucrados: quienes participan en este proceso? Equipos, roles o personas.",
  },
  {
    field: "pasosManuales",
    question: "5/6 Pasos manuales actuales: que pasos hacen hoy de forma manual?",
  },
  {
    field: "cuellosBottella",
    question: "6/6 Cuellos de botella: donde aparecen demoras, errores u obstaculos?",
  },
];

discordClient.once("clientReady", () => {
  console.log(`Bot conectado como ${discordClient.user?.tag}`);
});

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log(`${message.author.username}: ${message.content}`);

  if (message.content === "!ping") {
    await message.reply("pong");
    return;
  }

  if (message.content === "!cancelar") {
    scouterSessions.delete(getSessionKey(message.channel.id, message.author.id));
    await message.reply("Listo, cancele el diagnostico en curso.");
    return;
  }

  if (message.content === "!scouter") {
    const sessionKey = getSessionKey(message.channel.id, message.author.id);
    scouterSessions.set(sessionKey, {
      currentStep: 0,
      data: {},
    });

    await message.reply(
      `Arranquemos el diagnostico. Puedes escribir \`!cancelar\` si quieres detenerlo.\n\n${scouterQuestions[0].question}`
    );
    return;
  }

  const activeSession = scouterSessions.get(getSessionKey(message.channel.id, message.author.id));

  if (activeSession) {
    await handleScouterAnswer(message, activeSession);
    return;
  }

  if (message.content.startsWith("!scout")) {
    const consulta = message.content.replace("!scout", "").trim();

    if (!consulta) {
      await message.reply("Escribeme una consulta despues de `!scout`.");
      return;
    }

    try {
      await sendTyping(message);
      const respuesta = await responderConsultaDiscord(consulta);
      await message.reply(respuesta.slice(0, 2000));
    } catch (error) {
      console.error("Error al responder con Gemini:", error);
      await message.reply(getUserErrorMessage(error));
    }
  }
});

discordClient.login(token);

function getSessionKey(channelId: string, userId: string) {
  return `${channelId}:${userId}`;
}

async function sendTyping(message: Message) {
  if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
    await message.channel.sendTyping();
  }
}

function formatAreaOptions() {
  return areaOptions
    .map((area, index) => `${index + 1}. ${area.nombre}`)
    .join("\n");
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeArea(value: string) {
  const normalized = normalizeText(value);
  const numericOption = Number(normalized);

  if (Number.isInteger(numericOption)) {
    return areaOptions[numericOption - 1] || null;
  }

  if (["rrhh", "recursos humanos", "talento humano"].includes(normalized)) {
    return areaOptions.find((area) => area.id === "recursos-humanos") || null;
  }

  return areaOptions.find((area) => normalizeText(area.nombre) === normalized) || null;
}

function normalizeImpacto(value: string) {
  const normalized = normalizeText(value);

  if (normalized === "alto") return "Alto";
  if (normalized === "medio") return "Medio";
  if (normalized === "bajo") return "Bajo";

  return null;
}

async function handleScouterAnswer(message: Message, session: ScouterSession) {
  const question = scouterQuestions[session.currentStep];
  const value = message.content.trim();

  if (!value) {
    await message.reply("Necesito una respuesta para continuar.");
    return;
  }

  const normalizedValue = question.normalize ? question.normalize(value) : value;

  if (!normalizedValue) {
    await message.reply(`No reconoci esa respuesta.\n\n${question.question}`);
    return;
  }

  if (question.field === "area") {
    session.data.area = normalizedValue as AreaOption;
  } else {
    session.data[question.field] = normalizedValue as string;
  }

  session.currentStep += 1;

  const nextQuestion = scouterQuestions[session.currentStep];

  if (nextQuestion) {
    await message.reply(nextQuestion.question);
    return;
  }

  await finishScouterDiagnosis(message, session);
}

async function finishScouterDiagnosis(message: Message, session: ScouterSession) {
  const sessionKey = getSessionKey(message.channel.id, message.author.id);

  try {
    await message.reply("Gracias. Estoy generando el diagnostico con Gemini...");
    await sendTyping(message);

    const areaOption = session.data.area || areaOptions[0];
    const area = await obtenerAreaDiscord(areaOption.nombre);
    const formulario: CasoFormulario = {
      areaId: area.id,
      contexto: session.data.contexto || "",
      impacto: session.data.impacto || "",
      actores: session.data.actores || "",
      pasosManuales: session.data.pasosManuales || "",
      cuellosBottella: session.data.cuellosBottella || "",
    };

    validateDiagnosisInput(formulario);

    const diagnostico = await generarDiagnostico(formulario, area.nombre);
    const caso = await guardarCasoDiscord(formulario, diagnostico);
    const n8nResult = await trySendDiagnosisToN8n({
      userId: message.author.id,
      username: message.author.username,
      channelId: message.channel.id,
      command: "!scouter",
      areaNombre: area.nombre,
      formulario,
      diagnostico,
      caso,
      notification: buildNotificationPayload(caso),
    });

    const responseMessage = n8nResult.reply || formatSavedDiagnosis(caso);
    const n8nWarning = n8nResult.sent
      ? ""
      : "\n\nAviso: el caso fue guardado, pero no pude enviar la notificacion a n8n/correo. Revisa el workflow o el webhook.";

    await message.reply(`${responseMessage}${n8nWarning}`.slice(0, 2000));
  } catch (error) {
    console.error("Error en el flujo !scouter:", error);
    await message.reply(getUserErrorMessage(error));
  } finally {
    scouterSessions.delete(sessionKey);
  }
}

async function trySendDiagnosisToN8n(payload: {
  userId: string;
  username: string;
  channelId: string;
  command: string;
  areaNombre: string;
  formulario: CasoFormulario;
  diagnostico: Diagnostico;
  caso: Caso;
  notification: {
    subject: string;
    text: string;
  };
}) {
  try {
    return {
      reply: await sendDiagnosisToN8n(payload),
      sent: true,
    };
  } catch (error) {
    console.error("No se pudo enviar el diagnostico a n8n:", error);
    return {
      reply: null,
      sent: false,
    };
  }
}

async function sendDiagnosisToN8n(payload: {
  userId: string;
  username: string;
  channelId: string;
  command: string;
  areaNombre: string;
  formulario: CasoFormulario;
  diagnostico: Diagnostico;
  caso: Caso;
  notification: {
    subject: string;
    text: string;
  };
}) {
  if (!n8nWebhookUrl) {
    throw new Error("Missing N8N_WEBHOOK_URL in .env.local");
  }

  const response = await fetch(n8nWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error conectando con n8n: ${response.status} ${response.statusText}`);
  }

  const data = await response.json().catch(() => null);

  return typeof data?.reply === "string" ? data.reply : null;
}

function formatSavedDiagnosis(caso: Caso) {
  const diagnostico = caso.diagnostico;

  return [
    "**Diagnostico generado y guardado en historial**",
    `**Caso:** ${caso.id}`,
    `**Area:** ${caso.areas?.nombre || "Area desconocida"}`,
    `**Severidad:** ${diagnostico.severidad}`,
    `**Resumen:** ${diagnostico.resumen}`,
    `**Causas probables:** ${diagnostico.causasProbables.join("; ")}`,
    `**Oportunidades:** ${diagnostico.oportunidades.join("; ")}`,
    `**Solucion sugerida:** ${diagnostico.propuesta.tipoSolucion}`,
    `**MVP:** ${diagnostico.propuesta.alcanceMvp}`,
    `**Siguientes pasos:** ${diagnostico.propuesta.siguientesPasos.join("; ")}`,
  ].join("\n");
}

function buildNotificationPayload(caso: Caso) {
  const diagnostico = caso.diagnostico;
  const areaNombre = caso.areas?.nombre || "Area desconocida";
  const subject = `Nuevo diagnostico ScoutFlow: ${areaNombre} (${diagnostico.severidad})`;
  const text = [
    `Se genero un nuevo caso desde Discord.`,
    ``,
    `Caso: ${caso.id}`,
    `Fecha: ${caso.fecha}`,
    `Area: ${areaNombre}`,
    `Impacto: ${caso.impacto}`,
    ``,
    `Contexto:`,
    caso.contexto,
    ``,
    `Actores involucrados:`,
    caso.actores,
    ``,
    `Pasos manuales actuales:`,
    caso.pasos_manuales,
    ``,
    `Cuellos de botella:`,
    caso.cuellos_botella,
    ``,
    `Resumen del diagnostico:`,
    diagnostico.resumen,
    ``,
    `Causas probables:`,
    diagnostico.causasProbables.map((item) => `- ${item}`).join("\n"),
    ``,
    `Oportunidades:`,
    diagnostico.oportunidades.map((item) => `- ${item}`).join("\n"),
    ``,
    `Solucion sugerida:`,
    diagnostico.propuesta.tipoSolucion,
    ``,
    `Alcance MVP:`,
    diagnostico.propuesta.alcanceMvp,
    ``,
    `Automatizaciones:`,
    diagnostico.propuesta.automatizaciones.map((item) => `- ${item}`).join("\n"),
    ``,
    `Siguientes pasos:`,
    diagnostico.propuesta.siguientesPasos.map((item) => `- ${item}`).join("\n"),
  ].join("\n");

  return { subject, text };
}

function validateDiagnosisInput(formulario: CasoFormulario) {
  const missingDetails: string[] = [];

  if (formulario.contexto.trim().length < 20) {
    missingDetails.push("contexto del problema");
  }

  if (formulario.actores.trim().length < 8) {
    missingDetails.push("actores involucrados");
  }

  if (formulario.pasosManuales.trim().length < 20) {
    missingDetails.push("pasos manuales actuales");
  }

  if (formulario.cuellosBottella.trim().length < 20) {
    missingDetails.push("cuellos de botella");
  }

  if (missingDetails.length > 0) {
    throw new Error(`Insufficient diagnosis context: ${missingDetails.join(", ")}`);
  }
}

function getUserErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Insufficient diagnosis context")) {
    const fields = message.split(":")[1]?.trim() || "informacion del caso";

    return [
      "Me falta informacion para generar un diagnostico confiable.",
      `Refuerza: ${fields}.`,
      "Vuelve a iniciar con `!scouter` y agrega mas detalle sobre que pasa, quienes participan, que pasos hacen y donde se rompe el flujo.",
    ].join("\n");
  }

  if (message.includes("GEMINI_API_KEY")) {
    return "Falta configurar GEMINI_API_KEY en .env.local.";
  }

  if (message.includes("Supabase env vars")) {
    return "Falta configurar NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.";
  }

  if (message.includes("No existe el area")) {
    return "El area seleccionada no existe en Supabase. Revisa que la tabla areas tenga las mismas opciones del panel.";
  }

  if (message.includes("violates foreign key") || message.includes("invalid input syntax")) {
    return "No pude guardar el caso en Supabase porque el area o algun dato no coincide con la base de datos. Revisa la tabla areas y vuelve a intentar.";
  }

  if (message.includes("Error al llamar Gemini")) {
    return "Gemini rechazo la solicitud. Revisa que GEMINI_API_KEY y GEMINI_MODEL esten correctos, o intenta de nuevo con mas contexto del problema.";
  }

  if (message.includes("Invalid Gemini JSON response") || message.includes("Invalid Gemini diagnosis shape") || message.includes("JSON")) {
    return [
      "Gemini respondio con un formato incompleto y no pude convertirlo en diagnostico.",
      "Intenta de nuevo con `!scouter` agregando mas contexto, especialmente pasos manuales y cuellos de botella.",
    ].join("\n");
  }

  return [
    "No pude completar el diagnostico.",
    "Puede ser un error temporal de Gemini, Supabase o la red. Revisa la consola del bot para ver el detalle tecnico.",
  ].join("\n");
}
