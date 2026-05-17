import { CasoFormulario, Diagnostico } from "../types";

type GeminiOptions = {
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
};

function getGeminiUrl() {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function generarTextoGemini(prompt: string, options: GeminiOptions = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { maxOutputTokens = 2048, responseMimeType } = options;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.local");
  }

  const response = await fetch(`${getGeminiUrl()}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens,
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error al llamar Gemini: ${response.statusText}`);
  }

  const data = await response.json();

  return data.candidates[0].content.parts[0].text;
}

function parseDiagnostico(texto: string): Diagnostico {
  const textoLimpio = texto.replace(/```json|```/g, "").trim();
  const inicioJson = textoLimpio.indexOf("{");
  const finJson = textoLimpio.lastIndexOf("}");

  if (inicioJson === -1 || finJson === -1) {
    throw new Error("Invalid Gemini JSON response");
  }

  const diagnostico = JSON.parse(textoLimpio.slice(inicioJson, finJson + 1)) as Diagnostico;

  if (
    !diagnostico.resumen ||
    !Array.isArray(diagnostico.causasProbables) ||
    !["Alto", "Medio", "Bajo"].includes(diagnostico.severidad) ||
    !Array.isArray(diagnostico.oportunidades) ||
    !diagnostico.propuesta ||
    !Array.isArray(diagnostico.propuesta.automatizaciones) ||
    !Array.isArray(diagnostico.propuesta.siguientesPasos)
  ) {
    throw new Error("Invalid Gemini diagnosis shape");
  }

  return diagnostico;
}

export async function generarDiagnostico(
  formulario: CasoFormulario,
  areaNombre: string
): Promise<Diagnostico> {
  const prompt = `
Eres un consultor experto en transformacion digital y optimizacion de procesos empresariales.
Analiza el siguiente problema operativo de la empresa Lynx Retail Labs y genera un diagnostico estructurado.

INFORMACION DEL PROBLEMA:
- Area afectada: ${areaNombre}
- Contexto del problema: ${formulario.contexto}
- Nivel de impacto: ${formulario.impacto}
- Actores involucrados: ${formulario.actores}
- Pasos manuales actuales: ${formulario.pasosManuales}
- Cuellos de botella identificados: ${formulario.cuellosBottella}

Responde UNICAMENTE con un objeto JSON valido, sin texto adicional, sin markdown y sin bloques de codigo.
Usa esta estructura exacta:
{
  "resumen": "Resumen ejecutivo del problema en 2-3 oraciones",
  "causasProbables": [
    "Causa 1",
    "Causa 2",
    "Causa 3"
  ],
  "severidad": "Medio",
  "oportunidades": [
    "Oportunidad de mejora 1",
    "Oportunidad de mejora 2"
  ],
  "propuesta": {
    "tipoSolucion": "Tipo de solucion recomendada",
    "alcanceMvp": "Descripcion del MVP sugerido",
    "automatizaciones": [
      "Automatizacion sugerida 1",
      "Automatizacion sugerida 2"
    ],
    "siguientesPasos": [
      "Paso 1",
      "Paso 2",
      "Paso 3"
    ]
  }
}

Responde todo en espanol.
El campo severidad debe ser exactamente uno de estos valores: Alto, Medio o Bajo.
`;

  const texto = await generarTextoGemini(prompt, {
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  });

  return parseDiagnostico(texto);
}

export async function responderConsultaDiscord(consulta: string): Promise<string> {
  const prompt = `
Eres ScoutFlow IA, un asistente experto en diagnostico operativo, automatizacion y transformacion digital.
Responde al siguiente mensaje de Discord de forma clara, accionable y en espanol.

MENSAJE:
${consulta}

Reglas:
- Si faltan datos, pide la informacion concreta que necesitas.
- Si puedes dar una recomendacion, incluye pasos practicos.
- Manten la respuesta breve para Discord.
`;

  return generarTextoGemini(prompt, { maxOutputTokens: 1024 });
}
