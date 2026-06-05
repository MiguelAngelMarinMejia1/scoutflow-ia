// bot/src/scenes/scouter.ts
// Define el flujo conversacional del comando /scouter.
// Usa Scenes de Telegraf para guiar al usuario paso a paso
// y obtiene las areas directamente desde Supabase.

import { Scenes, Markup } from 'telegraf'
import { enviarAn8n, obtenerAreas, DatosFormulario, Area } from '../services/webhook'

// Tipo de datos guardados durante la conversacion
interface ScouterWizardSession extends Scenes.WizardSessionData {
  datosFormulario: Partial<DatosFormulario>
  areas: Area[]
}

type ScouterContext = Scenes.WizardContext<ScouterWizardSession>

export const scouterWizard = new Scenes.WizardScene<ScouterContext>(
  'scouter-wizard',

  // PASO 1 — Bienvenida y seleccion de area
  async (ctx) => {
    ctx.scene.session.datosFormulario = {}

    try {
      // Consultamos las areas desde Supabase
      const areas = await obtenerAreas()

      // Guardamos las areas en la sesion para usarlas en el siguiente paso
      ctx.scene.session.areas = areas

      // Creamos los botones dinamicamente con las areas de Supabase
      const botones = areas.map(area =>
        [Markup.button.callback(area.nombre, `area_${area.id}`)]
      )

      await ctx.reply(
        'Bienvenido a ScoutFlow IA\n\nVoy a ayudarte a registrar y analizar un problema operativo.\n\nCual es el area afectada?',
        {
          ...Markup.inlineKeyboard(botones)
        }
      )
    } catch (error) {
      await ctx.reply('Error al cargar las areas. Por favor intenta de nuevo con /scouter.')
      return ctx.scene.leave()
    }

    return ctx.wizard.next()
  },

  // PASO 2 — Recibe el area y pregunta por el contexto
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Por favor selecciona un area de la lista.')
      return
    }

    const areaId = ctx.callbackQuery.data.replace('area_', '')

    // Buscamos el nombre del area en la sesion
    const area = ctx.scene.session.areas.find(a => a.id === areaId)
    const areaNombre = area?.nombre || 'Area desconocida'

    ctx.scene.session.datosFormulario.areaId = areaId
    ctx.scene.session.datosFormulario.areaNombre = areaNombre

    await ctx.answerCbQuery()
    await ctx.reply(
      `Area seleccionada: ${areaNombre}\n\nCual es el contexto del problema?\n\nDescribe con detalle que esta pasando en esta area.`
    )

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
      'Contexto registrado.\n\nCual es el nivel de impacto?',
      {
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

    const impacto = ctx.callbackQuery.data.split('_')[1]
    ctx.scene.session.datosFormulario.impacto = impacto

    await ctx.answerCbQuery()
    await ctx.reply(
      `Impacto: ${impacto}\n\nQuienes son los actores involucrados?\n\nMenciona los equipos, roles o personas que participan en este proceso.`
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
      'Actores registrados.\n\nCuales son los pasos manuales actuales?\n\nDescribe como se hace el proceso hoy en dia.'
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
      'Pasos manuales registrados.\n\nCuales son los cuellos de botella?\n\nIdentifica los obstaculos o demoras mas importantes.'
    )

    return ctx.wizard.next()
  },

  // PASO 7 — Recibe los cuellos de botella y envia los datos a n8n
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Por favor describe los cuellos de botella.')
      return
    }

    ctx.scene.session.datosFormulario.cuellosBottella = ctx.message.text

    await ctx.reply('Procesando tu caso con IA... Esto puede tomar unos segundos.')

    try {
      const resultado = await enviarAn8n(ctx.scene.session.datosFormulario as DatosFormulario)

      const diagnostico = resultado?.caso?.diagnostico

      if (diagnostico) {
        await ctx.reply(
          `Diagnostico generado exitosamente\n\n` +
          `Severidad: ${diagnostico.severidad}\n\n` +
          `Resumen:\n${diagnostico.resumen}\n\n` +
          `Causas probables:\n${diagnostico.causasProbables.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\n` +
          `Tipo de solucion:\n${diagnostico.propuesta.tipoSolucion}\n\n` +
          `El caso ha sido guardado en el sistema.`
        )
      } else {
        await ctx.reply('Caso registrado exitosamente en el sistema.')
      }

    } catch (error) {
      console.error('Error al procesar el caso:', error)
      await ctx.reply('Ocurrio un error al procesar el caso. Por favor intenta de nuevo con /scouter.')
    }

    return ctx.scene.leave()
  }
)