// bot/src/services/webhook.ts
// Este archivo maneja la comunicacion entre el bot de Telegram y los servicios externos.
// Incluye la consulta de areas desde Supabase y el envio de datos a n8n.

import dotenv from 'dotenv'
import path from 'path'

// Cargamos el .env.local desde la raiz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

// Estructura de un area tal como viene de Supabase
export interface Area {
  id: string
  nombre: string
}

// Estructura de los datos que el bot recopila del usuario
export interface DatosFormulario {
  areaId: string
  areaNombre: string
  contexto: string
  impacto: string
  actores: string
  pasosManuales: string
  cuellosBottella: string
}

// Funcion que obtiene las areas activas directamente desde Supabase
// Asi si se agrega o elimina un area en la base de datos,
// el bot lo refleja automaticamente sin necesidad de tocar el codigo
export async function obtenerAreas(): Promise<Area[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables de entorno de Supabase no configuradas')
  }

  // Usamos la API REST de Supabase directamente con fetch
  // No necesitamos instalar el cliente de Supabase en el bot
  const response = await fetch(
    `${supabaseUrl}/rest/v1/areas?activa=eq.true&order=nombre`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Error al obtener areas desde Supabase')
  }

  return response.json() as Promise<Area[]>
}

// Funcion que envia los datos del formulario a n8n
export async function enviarAn8n(datos: DatosFormulario): Promise<any> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL no esta configurada en las variables de entorno')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formulario: {
        areaId: datos.areaId,
        contexto: datos.contexto,
        impacto: datos.impacto,
        actores: datos.actores,
        pasosManuales: datos.pasosManuales,
        cuellosBottella: datos.cuellosBottella
      },
      areaNombre: datos.areaNombre,
      fuente: 'telegram'
    })
  })

  if (!response.ok) {
    throw new Error(`Error al enviar datos a n8n: ${response.statusText}`)
  }

  return response.json()
}