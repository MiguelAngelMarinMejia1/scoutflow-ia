// src/app/page.tsx
// Página principal de ScoutFlow IA.
// El dashboard es la vista inicial donde el gerente puede ver
// los casos por área y generar diagnósticos globales.

'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import Diagnostico from '@/components/Diagnostico'
import DiagnosticoGlobalComp from '@/components/DiagnosticoGlobal'
import { Caso, DiagnosticoGlobal } from '@/types'

// Vistas posibles de la aplicación
type Vista = 'dashboard' | 'diagnostico' | 'diagnosticoGlobal'

export default function Home() {
  // Vista activa — empieza en el dashboard
  const [vista, setVista] = useState<Vista>('dashboard')

  // Caso actual para ver el diagnóstico individual
  const [casoActual, setCasoActual] = useState<Caso | null>(null)

  // Diagnóstico global actual
  const [diagnosticoGlobalActual, setDiagnosticoGlobalActual] = useState<DiagnosticoGlobal | null>(null)

  // Nombre del área del diagnóstico global
  const [areaNombreActual, setAreaNombreActual] = useState<string>('')

  // Función para ver el diagnóstico individual de un caso
  function handleVerCaso(caso: Caso) {
    setCasoActual(caso)
    setVista('diagnostico')
  }

  // Función para ver el diagnóstico global de un área
  function handleVerDiagnosticoGlobal(diagnosticoGlobal: DiagnosticoGlobal, areaNombre: string) {
  setDiagnosticoGlobalActual(diagnosticoGlobal)
  setAreaNombreActual(areaNombre)
  setVista('diagnosticoGlobal')
}

  // Función para volver al dashboard
  function handleVolver() {
    setCasoActual(null)
    setDiagnosticoGlobalActual(null)
    setAreaNombreActual('')
    setVista('dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* Header */}
      <Header />

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Vista: Dashboard */}
        {vista === 'dashboard' && (
          <Dashboard
            onVerDiagnosticoGlobal={handleVerDiagnosticoGlobal}
            onVerCaso={handleVerCaso}
          />
        )}

        {/* Vista: Diagnóstico individual */}
        {vista === 'diagnostico' && casoActual && (
          <Diagnostico
            caso={casoActual}
            onVolver={handleVolver}
          />
        )}

        {/* Vista: Diagnóstico global */}
        {vista === 'diagnosticoGlobal' && diagnosticoGlobalActual && (
          <DiagnosticoGlobalComp
            diagnosticoGlobal={diagnosticoGlobalActual}
            areaNombre={areaNombreActual}
            onVolver={handleVolver}
          />
        )}

      </main>

    </div>
  )
}