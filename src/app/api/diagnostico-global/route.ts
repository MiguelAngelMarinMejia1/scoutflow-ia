// API Route que genera un diagnóstico global para un área específica.
// Recibe el ID del área, obtiene todos sus casos, los analiza con Gemini y guarda el resultado en la tabla diagnosticos_globales de Supabase.

import { NextRequest, NextResponse } from 'next/server'
import { generarDiagnosticoGlobal } from '@/lib/gemini'
import { obtenerCasosPorArea, guardarDiagnosticoGlobal } from '@/lib/supabase.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { areaId, areaNombre }: { areaId: string; areaNombre: string } = body

    if (!areaId || !areaNombre) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtenemos todos los casos del área
    const casos = await obtenerCasosPorArea(areaId)

    // Verificamos que haya casos para analizar
    if (casos.length === 0) {
      return NextResponse.json(
        { error: 'No hay casos registrados para esta área' },
        { status: 400 }
      )
    }

    // Preparamos los casos para enviarlos a Gemini
    const casosParaAnalizar = casos.map(caso => ({
      contexto: caso.contexto,
      impacto: caso.impacto,
      actores: caso.actores,
      pasosManuales: caso.pasos_manuales,
      cuellosBottella: caso.cuellos_botella,
      diagnostico: caso.diagnostico
    }))

    // Generamos el diagnóstico global con Gemini
    const diagnostico = await generarDiagnosticoGlobal(areaNombre, casosParaAnalizar)

    // Guardamos el diagnóstico global en Supabase
    const diagnosticoGlobal = await guardarDiagnosticoGlobal(areaId, casos.length, diagnostico)

    return NextResponse.json({ diagnosticoGlobal }, { status: 200 })

  } catch (error) {
    console.error('Error en /api/diagnostico-global:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el diagnóstico global' },
      { status: 500 }
    )
  }
}