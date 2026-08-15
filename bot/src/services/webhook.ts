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

// Función que envía los datos del formulario intentando primero n8n
// y si falla, llama directamente al API Route de Next.js
export async function enviarAn8n(datos: DatosFormulario): Promise<Record<string, unknown>> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const apiUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/diagnostico`
    : 'http://localhost:3000/api/diagnostico'

  const payload = {
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
  }

  // Intentamos primero con n8n si la URL está configurada
  if (webhookUrl) {
    try {
      console.log('Intentando enviar a n8n...')

      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
      })

      if (n8nResponse.ok) {
        console.log('n8n respondio correctamente')
        return n8nResponse.json() as Promise<Record<string, unknown>>
      }

      console.log(`n8n fallo con status ${n8nResponse.status}, usando fallback...`)
    } catch (error) {
      console.log('n8n no disponible, usando fallback al API Route...')
    }
  }

  // Fallback: llamamos directamente al API Route de Next.js
  console.log('Llamando directamente al API Route:', apiUrl)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Error al llamar al API Route: ${response.statusText}`)
  }

  return response.json() as Promise<Record<string, unknown>>
}