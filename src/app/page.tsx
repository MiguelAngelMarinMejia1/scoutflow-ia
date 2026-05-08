// Página principal de ScoutFlow IA.
// Actúa como controlador central — maneja el estado global de la app y decide qué componente mostrar según la acción del usuario.

'use client'

import { useState } from 'react'
import Header from '@/components/header'
import Formulario from '@/components/formulario'
import Diagnostico from '@/components/diagnostico'
import Historial from '@/components/historial'
import { Caso, CasoFormulario } from '@/types'

// Definimos las vistas posibles de la aplicación
type Vista = 'nueva' | 'diagnostico' | 'historial'

export default function Home() {
  // Vista activa — empieza mostrando el formulario
  const [vista, setVista] = useState<Vista>('nueva')

  // Estado de carga mientras la IA procesa el diagnóstico
  const [cargando, setCargando] = useState(false)

  // Caso actual — se llena cuando se genera un diagnóstico o se selecciona del historial
  const [casoActual, setCasoActual] = useState<Caso | null>(null)

  // Estado de error global
  const [error, setError] = useState<string | null>(null)

  // Función que se ejecuta cuando el usuario envía el formulario
  // Llama al API Route que procesa el diagnóstico con Gemini
  async function handleSubmitFormulario(formulario: CasoFormulario, areaNombre: string) {
    setCargando(true)
    setError(null)

    try {
      // Llamamos a nuestro API Route en el servidor
      const response = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulario, areaNombre })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar el diagnóstico')
      }

      const data = await response.json()

      // Guardamos el caso y mostramos el diagnóstico
      setCasoActual(data.caso)
      setVista('diagnostico')

    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al generar el diagnóstico. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  // Función para ver el detalle de un caso desde el historial
  function handleVerCaso(caso: Caso) {
    setCasoActual(caso)
    setVista('diagnostico')
  }

  // Función para volver al formulario limpio
  function handleNuevoAnalisis() {
    setCasoActual(null)
    setError(null)
    setVista('nueva')
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* Header con navegación */}
      <Header
        vistaActual={vista === 'diagnostico' ? 'nueva' : vista}
        onCambiarVista={(v) => {
          setError(null)
          setVista(v)
        }}
      />

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Mensaje de error global */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Vista: Formulario nueva consulta */}
        {vista === 'nueva' && (
          <Formulario
            onSubmit={handleSubmitFormulario}
            cargando={cargando}
          />
        )}

        {/* Vista: Diagnóstico generado */}
        {vista === 'diagnostico' && casoActual && (
          <Diagnostico
            caso={casoActual}
            onNuevoAnalisis={handleNuevoAnalisis}
          />
        )}

        {/* Vista: Historial de casos */}
        {vista === 'historial' && (
          <Historial onVerCaso={handleVerCaso} />
        )}

      </main>

    </div>
  )
}