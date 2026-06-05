// Este archivo define el flujo conversacional del comando /scouter.
// Usa el concepto de "Scenes" de Telegraf — una secuencia de pasos donde el bot hace una pregunta, espera la respuesta y avanza al siguiente paso.

import { Scenes, Markup } from 'telegraf'
import { enviarAn8n, DatosFormulario } from '../services/webhook'

// Definimos el tipo de datos que se guardan durante la conversación
// WizardSessionData almacena las respuestas del usuario entre pasos
interface ScouterWizardSession extends Scenes.WizardSessionData {
  datosFormulario: Partial<DatosFormulario>
}

// Definimos el contexto del wizard con nuestros datos de sesión
type ScouterContext = Scenes.WizardContext<ScouterWizardSession>

// Lista de áreas disponibles — las mismas que están en Supabase
// En una versión más avanzada esto se podría consultar desde la base de datos
const AREAS = [
  { id: '1', nombre: 'Logística' },
  { id: '2', nombre: 'Ventas' },
  { id: '3', nombre: 'Recursos Humanos' },
  { id: '4', nombre: 'Tecnología' },
  { id: '5', nombre: 'Finanzas' },
  { id: '6', nombre: 'Operaciones' },
  { id: '7', nombre: 'Marketing' }
]

// Creamos el Wizard con un ID único y sus pasos en orden
export const scouterWizard = new Scenes.WizardScene<ScouterContext>(
  'scouter-wizard', // ID único del wizard

  // PASO 1 — Bienvenida y selección de área
  async (ctx) => {
    // Inicializamos el objeto que guardará los datos del formulario
    ctx.scene.session.datosFormulario = {}

    // Creamos los botones con las áreas disponibles
    const botones = AREAS.map(area =>
      [Markup.button.callback(area.nombre, `area_${area.id}_${area.nombre}`)]
    )

    await ctx.reply(
      '*Bienvenido a ScoutFlow IA*\n\nVoy a ayudarte a registrar y analizar un problema operativo.\n\n*¿Cuál es el área afectada?*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(botones)
      }
    )

    return ctx.wizard.next() // Avanza al siguiente paso
  },

  // PASO 2 — Recibe el área y pregunta por el contexto
  async (ctx) => {
    // Verificamos que el usuario haya seleccionado un área (callback_query)
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Por favor selecciona un área de la lista.')
      return
    }

    // Extraemos el ID y nombre del área del callback
    const data = ctx.callbackQuery.data // ej: "area_1_Logística"
    const partes = data.split('_')
    const areaId = partes[1]
    const areaNombre = partes.slice(2).join('_')

    // Guardamos el área en la sesión
    ctx.scene.session.datosFormulario.areaId = areaId
    ctx.scene.session.datosFormulario.areaNombre = areaNombre

    // Confirmamos la selección y pedimos el contexto
    await ctx.answerCbQuery() // Cierra el loading del botón
    await ctx.reply(`Área seleccionada: *${areaNombre}*\n\n*¿Cuál es el contexto del problema?*\n\nDescribe con detalle qué está pasando en esta área.`, {
      parse_mode: 'Markdown'
    })

    return ctx.wizard.next()
  },

  // PASO 3 — Recibe el contexto y pregunta por el impacto
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Por favor escribe el contexto del problema.')
      return
    }

    ctx.scene.session.datosFormulario.contexto = ctx.message.text

    await ctx.reply(
      'Contexto registrado.\n\n*¿Cuál es el nivel de impacto?*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('Alto', 'impacto_Alto'),
            Markup.button.callback('Medio', 'impacto_Medio'),
            Markup.button.callback('Bajo', 'impacto_Bajo')
          ]
        ])
      }
    )

    return ctx.wizard.next()
  },

  // PASO 4 — Recibe el impacto y pregunta por los actores
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Por favor selecciona el nivel de impacto.')
      return
    }

    const impacto = ctx.callbackQuery.data.split('_')[1] // "Alto", "Medio" o "Bajo"
    ctx.scene.session.datosFormulario.impacto = impacto

    await ctx.answerCbQuery()
    await ctx.reply(
      `Impacto: *${impacto}*\n\n*¿Quiénes son los actores involucrados?*\n\nMenciona los equipos, roles o personas que participan en este proceso.`,
      { parse_mode: 'Markdown' }
    )

    return ctx.wizard.next()
  },

  // PASO 5 — Recibe los actores y pregunta por los pasos manuales
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Por favor escribe los actores involucrados.')
      return
    }

    ctx.scene.session.datosFormulario.actores = ctx.message.text

    await ctx.reply(
      'Actores registrados.\n\n*¿Cuáles son los pasos manuales actuales?*\n\nDescribe cómo se hace el proceso hoy en día.',
      { parse_mode: 'Markdown' }
    )

    return ctx.wizard.next()
  },

  // PASO 6 — Recibe los pasos manuales y pregunta por los cuellos de botella
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Por favor describe los pasos manuales.')
      return
    }

    ctx.scene.session.datosFormulario.pasosManuales = ctx.message.text

    await ctx.reply(
      'Pasos manuales registrados.\n\n*¿Cuáles son los cuellos de botella?*\n\nIdentifica los obstáculos o demoras más importantes.',
      { parse_mode: 'Markdown' }
    )

    return ctx.wizard.next()
  },

  // PASO 7 — Recibe los cuellos de botella y envía los datos a n8n
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Por favor describe los cuellos de botella.')
      return
    }

    ctx.scene.session.datosFormulario.cuellosBottella = ctx.message.text

    // Avisamos al usuario que estamos procesando
    await ctx.reply('Procesando tu caso con IA... Esto puede tomar unos segundos.')

    try {
      // Enviamos todos los datos a n8n
      const resultado = await enviarAn8n(ctx.scene.session.datosFormulario as DatosFormulario)

      // Extraemos el diagnóstico del resultado
      const diagnostico = resultado?.caso?.diagnostico

      if (diagnostico) {
        // Formateamos y enviamos el diagnóstico al usuario
        await ctx.reply(
          `*Diagnóstico generado exitosamente*\n\n` +
          `*Severidad:* ${diagnostico.severidad}\n\n` +
          `*Resumen:*\n${diagnostico.resumen}\n\n` +
          `*Causas probables:*\n${diagnostico.causasProbables.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\n` +
          `*Tipo de solución:*\n${diagnostico.propuesta.tipoSolucion}\n\n` +
          `_El caso ha sido guardado en el sistema._`,
          { parse_mode: 'Markdown' }
        )
      } else {
        await ctx.reply('Caso registrado exitosamente en el sistema.')
      }

    } catch (error) {
      console.error('Error al procesar el caso:', error)
      await ctx.reply('Ocurrió un error al procesar el caso. Por favor intenta de nuevo con /scouter.')
    }

    // Terminamos el wizard
    return ctx.scene.leave()
  }
)