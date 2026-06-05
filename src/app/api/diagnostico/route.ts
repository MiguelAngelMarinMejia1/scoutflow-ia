// src/app/api/diagnostico/route.ts
// API Route que actua como intermediario seguro entre n8n y Gemini.
// Recibe los datos del formulario, genera el diagnostico con Gemini,
// guarda el caso en Supabase y retorna el resultado a n8n.

import { NextRequest, NextResponse } from 'next/server'
import { generarDiagnostico } from '@/lib/gemini'
import { guardarCaso } from '@/lib/supabase.service'
import { CasoFormulario } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formulario, areaNombre }: { formulario: CasoFormulario, areaNombre: string } = body

    if (!formulario || !areaNombre) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Generamos el diagnostico con Gemini
    const diagnostico = await generarDiagnostico(formulario, areaNombre)

    // Guardamos el caso en Supabase
    const caso = await guardarCaso(formulario, diagnostico)

    // Retornamos el caso completo a n8n
    // n8n se encargara de enviar el email con esta informacion
    return NextResponse.json({ caso, areaNombre }, { status: 200 })

  } catch (error) {
    console.error('Error en /api/diagnostico:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el diagnostico' },
      { status: 500 }
    )
  }
}