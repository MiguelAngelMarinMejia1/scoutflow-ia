// Este es un API Route de Next.js que actúa como intermediario seguro entre el frontend y la API de Gemini.
// La API Key de Gemini nunca se expone al navegador — solo existe en el servidor.

import { NextRequest, NextResponse } from 'next/server'
import { generarDiagnostico } from '@/lib/gemini'
import { guardarCaso } from '@/lib/supabase.service'
import { CasoFormulario } from '@/types'

// Maneja las peticiones POST que llegan a /api/diagnostico
export async function POST(request: NextRequest) {
  try {
    // Extraemos los datos del cuerpo de la petición
    const body = await request.json()
    const { formulario, areaNombre }: { formulario: CasoFormulario, areaNombre: string } = body

    // Validación básica — verificamos que vengan los datos necesarios
    if (!formulario || !areaNombre) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Llamamos a Gemini para generar el diagnóstico
    const diagnostico = await generarDiagnostico(formulario, areaNombre)

    // Guardamos el caso completo en Supabase
    const caso = await guardarCaso(formulario, diagnostico)

    // Notificamos a n8n con los datos del diagnóstico
    // Usamos un try/catch separado para que si n8n falla, no afecte la respuesta al usuario
    try {
      const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: areaNombre,
          severidad: diagnostico.severidad,
          resumen: diagnostico.resumen,
          tipoSolucion: diagnostico.propuesta.tipoSolucion,
          fecha: new Date().toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          url: process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : 'http://localhost:3000'
        })
      })
      console.log('n8n status:', n8nResponse.status)
      console.log('n8n URL:', process.env.N8N_WEBHOOK_URL)
    } catch (n8nError) {
      // Si n8n falla lo registramos pero no interrumpimos el flujo
      console.error('Error al notificar a n8n:', n8nError)
    }

    // Retornamos el caso guardado al frontend
    return NextResponse.json({ caso }, { status: 200 })

  } catch (error) {
    // Si algo falla, retornamos un error 500 con el mensaje
    console.error('Error en /api/diagnostico:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el diagnóstico' },
      { status: 500 }
    )
  }
}