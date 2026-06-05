// Este archivo maneja la comunicación entre el bot de Telegram y n8n.
// Cuando el usuario termina de responder todas las preguntas, esta función envía los datos al webhook de n8n para que se procese el diagnóstico.

import dotenv from 'dotenv'
import path from 'path'

// Cargamos el .env.local desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

// Estructura de los datos que el bot recopila del usuario
export interface DatosFormulario {
  areaId: string        // ID del área seleccionada
  areaNombre: string    // Nombre del área (para enviárselo a Gemini)
  contexto: string      // Descripción del problema
  impacto: string       // Nivel de impacto (Alto, Medio, Bajo)
  actores: string       // Actores involucrados
  pasosManuales: string // Pasos manuales actuales
  cuellosBottella: string // Cuellos de botella
}

// Función que envía los datos del formulario al webhook de n8n
// n8n se encargará de reenviarlos al API Route de Next.js
export async function enviarAn8n(datos: DatosFormulario): Promise<any> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL no está configurada en las variables de entorno')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Enviamos los datos en el formato que espera el API Route
      formulario: {
        areaId: datos.areaId,
        contexto: datos.contexto,
        impacto: datos.impacto,
        actores: datos.actores,
        pasosManuales: datos.pasosManuales,
        cuellosBottella: datos.cuellosBottella
      },
      areaNombre: datos.areaNombre,
      // Indicamos que la fuente es el bot de Telegram
      fuente: 'telegram'
    })
  })

  if (!response.ok) {
    throw new Error(`Error al enviar datos a n8n: ${response.statusText}`)
  }

  return response.json()
}