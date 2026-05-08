// Componente que muestra todos los casos guardados en Supabase.
// Presenta una tarjeta por caso con la información principal y permite ver el detalle de cada uno.

'use client'

import { useState, useEffect } from 'react'
import { Caso } from '@/types'
import { obtenerCasos } from '@/lib/supabase.service'

// Props del componente
// onVerCaso: función que se llama cuando el usuario quiere ver el detalle de un caso
interface HistorialProps {
  onVerCaso: (caso: Caso) => void
}

// Configuración visual del badge de severidad (igual que en Diagnostico.tsx)
const severidadConfig = {
  Alto: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  Medio: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  Bajo: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
}

export default function Historial({ onVerCaso }: HistorialProps) {
  // Estado de los casos cargados desde Supabase
  const [casos, setCasos] = useState<Caso[]>([])

  // Estado de carga
  const [cargando, setCargando] = useState(true)

  // Estado de error
  const [error, setError] = useState<string | null>(null)

  // Al montar el componente cargamos los casos desde Supabase
  useEffect(() => {
    async function cargarCasos() {
      try {
        const data = await obtenerCasos()
        setCasos(data)
      } catch (err) {
        setError('Error al cargar el historial de casos')
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargarCasos()
  }, [])

  // Formatea la fecha para mostrarla de forma legible
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0F2B5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando historial...</p>
        </div>
      </div>
    )
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  // Pantalla cuando no hay casos aún
  if (casos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <p className="text-4xl mb-4">📋</p>
        <h3 className="text-lg font-bold text-[#0F2B5B] mb-2">
          Sin casos registrados
        </h3>
        <p className="text-gray-400 text-sm">
          Aún no hay diagnósticos generados. Crea una nueva consulta para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">

      {/* Título del historial */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-[#0F2B5B]">
          Historial de Casos
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          {casos.length} {casos.length === 1 ? 'caso registrado' : 'casos registrados'}
        </p>
      </div>

      {/* Lista de tarjetas de casos */}
      {casos.map(caso => {
        const severidad = severidadConfig[caso.diagnostico.severidad]

        return (
          <div
            key={caso.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">

              {/* Información principal del caso */}
              <div className="flex-1">
                {/* Área y fecha */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">
                    {caso.areas?.nombre || 'Área desconocida'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-400">
                    {formatearFecha(caso.fecha)}
                  </span>
                </div>

                {/* Resumen del diagnóstico */}
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                  {caso.diagnostico.resumen}
                </p>
              </div>

              {/* Badge de severidad */}
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${severidad.bg} ${severidad.text} ${severidad.border}`}>
                {caso.diagnostico.severidad}
              </div>

            </div>

            {/* Botón para ver el detalle */}
            <button
              onClick={() => onVerCaso(caso)}
              className="mt-4 text-sm font-semibold text-[#0F2B5B] hover:text-[#F5A623] transition-colors"
            >
              Ver diagnóstico completo →
            </button>

          </div>
        )
      })}

    </div>
  )
}