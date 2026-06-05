// Punto de entrada del bot de Telegram.
// Aquí se inicializa el bot, se registran los middlewares, las escenas y los comandos disponibles.

import { Telegraf, Scenes, session } from 'telegraf'
import dotenv from 'dotenv'
import path from 'path'
import { scouterWizard } from './scenes/scouter'

// Cargamos las variables de entorno desde el .env.local de la raíz
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// Verificamos que el token del bot esté configurado
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno')
}

// Inicializamos el bot con el token
const bot = new Telegraf<Scenes.WizardContext<Scenes.WizardSessionData>>(token)

// Registramos el stage con las escenas disponibles
// El stage es el contenedor de todos los wizards del bot
const stage = new Scenes.Stage<Scenes.WizardContext<Scenes.WizardSessionData>>([scouterWizard as any])

// Registramos el middleware de sesión
// La sesión permite guardar datos entre mensajes del mismo usuario
bot.use(session())

// Registramos el middleware del stage
bot.use(stage.middleware())

// Comando de bienvenida
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Bienvenido a ScoutFlow IA\n\n' +
    'Soy el asistente de Lynx Retail Labs para el registro y analisis de problemas operativos.\n\n' +
    'Usa el comando /scouter para iniciar un nuevo diagnostico.'
  )
})

// Comando principal — inicia el wizard de registro de casos
bot.command('scouter', (ctx) => ctx.scene.enter('scouter-wizard'))

// Comando de ayuda
bot.command('help', async (ctx) => {
  await ctx.reply(
    'Comandos disponibles:\n\n' +
    '/scouter - Iniciar un nuevo diagnostico\n' +
    '/start - Mensaje de bienvenida\n' +
    '/help - Mostrar esta ayuda'
  )
})

// Iniciamos el bot en modo polling
// Polling significa que el bot consulta constantemente a Telegram
// si hay mensajes nuevos — es el modo mas simple para desarrollo y MVPs
bot.launch()

console.log('Bot de ScoutFlow IA iniciado correctamente')

// Manejamos el cierre graceful del bot
// Esto asegura que el bot se detenga correctamente cuando se cierra el proceso
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))