// src/components/Dashboard.tsx
// Pantalla principal del gerente.
// Muestra todas las áreas con sus casos y permite generar diagnósticos globales.

'use client'

import { useState, useEffect } from 'react'
import { Area, Caso, DiagnosticoGlobal } from '@/types'
import { obtenerResumenPorAreas, obtenerCasosPorArea, obtenerDiagnosticosGlobalesPorArea } from '@/lib/supabase.service'

// Props del componente
interface DashboardProps {
  onVerDiagnosticoGlobal: (diagnosticoGlobal: DiagnosticoGlobal, areaNombre: string) => void
  onVerCaso: (caso: Caso) => void
}

// Configuración visual del badge de severidad
const severidadConfig = {
  Alto: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  Medio: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  Bajo: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
}

// Tipo para controlar qué sección está expandida en cada área
type SeccionExpandida = 'casos' | 'diagnosticosGlobales' | null

export default function Dashboard({ onVerDiagnosticoGlobal, onVerCaso }: DashboardProps) {
  const [resumen, setResumen] = useState<{ area: Area; totalCasos: number; ultimaFecha: string | null }[]>([])
  const [areaExpandida, setAreaExpandida] = useState<string | null>(null)
  const [seccionExpandida, setSeccionExpandida] = useState<SeccionExpandida>(null)
  const [casosArea, setCasosArea] = useState<Caso[]>([])
  const [diagnosticosGlobales, setDiagnosticosGlobales] = useState<DiagnosticoGlobal[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoSeccion, setCargandoSeccion] = useState(false)
  const [generandoGlobal, setGenerandoGlobal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await obtenerResumenPorAreas()
        setResumen(data)
      } catch (err) {
        setError('Error al cargar el dashboard')
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // Maneja la expansión de secciones dentro de una tarjeta
  async function handleExpandirSeccion(areaId: string, seccion: SeccionExpandida) {
    // Si ya está expandida la misma sección del mismo área, la cerramos
    if (areaExpandida === areaId && seccionExpandida === seccion) {
      setAreaExpandida(null)
      setSeccionExpandida(null)
      setCasosArea([])
      setDiagnosticosGlobales([])
      return
    }

    setAreaExpandida(areaId)
    setSeccionExpandida(seccion)
    setCargandoSeccion(true)

    try {
      if (seccion === 'casos') {
        const casos = await obtenerCasosPorArea(areaId)
        setCasosArea(casos)
        setDiagnosticosGlobales([])
      } else if (seccion === 'diagnosticosGlobales') {
        const diagnosticos = await obtenerDiagnosticosGlobalesPorArea(areaId)
        setDiagnosticosGlobales(diagnosticos)
        setCasosArea([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargandoSeccion(false)
    }
  }

  // Genera el diagnóstico global de un área
  async function handleGenerarGlobal(areaId: string, areaNombre: string) {
    setGenerandoGlobal(areaId)
    setError(null)

    try {
      const response = await fetch('/api/diagnostico-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaId, areaNombre })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar el diagnóstico global')
      }

      const data = await response.json()
      onVerDiagnosticoGlobal(data.diagnosticoGlobal, areaNombre)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el diagnóstico global')
    } finally {
      setGenerandoGlobal(null)
    }
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0F2B5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <div>
        <h2 className="text-2xl font-bold text-[#0F2B5B]">Dashboard Operativo</h2>
        <p className="text-gray-400 text-sm mt-1">
          Vista general de problemas por área — Lynx Retail Labs
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {resumen.map(({ area, totalCasos, ultimaFecha }) => (
          <div key={area.id} className="bg-white rounded-xl shadow-md overflow-hidden">

            {/* Cabecera de la tarjeta */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#0F2B5B]">{area.nombre}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">
                      {totalCasos} {totalCasos === 1 ? 'caso registrado' : 'casos registrados'}
                    </span>
                    {ultimaFecha && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-400">
                          Último: {formatearFecha(ultimaFecha)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => handleExpandirSeccion(area.id, 'casos')}
                    disabled={totalCasos === 0}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      areaExpandida === area.id && seccionExpandida === 'casos'
                        ? 'bg-[#0F2B5B] text-white border-[#0F2B5B]'
                        : 'border-[#0F2B5B] text-[#0F2B5B] hover:bg-[#0F2B5B]/5'
                    }`}
                  >
                    {areaExpandida === area.id && seccionExpandida === 'casos' ? 'Ocultar casos' : 'Ver casos'}
                  </button>

                  <button
                    onClick={() => handleExpandirSeccion(area.id, 'diagnosticosGlobales')}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      areaExpandida === area.id && seccionExpandida === 'diagnosticosGlobales'
                        ? 'bg-[#0F2B5B] text-white border-[#0F2B5B]'
                        : 'border-[#0F2B5B] text-[#0F2B5B] hover:bg-[#0F2B5B]/5'
                    }`}
                  >
                    {areaExpandida === area.id && seccionExpandida === 'diagnosticosGlobales' ? 'Ocultar historial' : 'Ver historial global'}
                  </button>

                  <button
                    onClick={() => handleGenerarGlobal(area.id, area.nombre)}
                    disabled={totalCasos === 0 || generandoGlobal === area.id}
                    className="px-4 py-2 bg-[#F5A623] text-[#0F2B5B] rounded-lg text-sm font-semibold hover:bg-[#e09415] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generandoGlobal === area.id ? 'Analizando...' : 'Diagnostico Global'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sección expandida */}
            {areaExpandida === area.id && (
              <div className="border-t border-gray-100 px-6 pb-6">
                {cargandoSeccion ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 border-2 border-[#0F2B5B] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <>
                    {/* Lista de casos */}
                    {seccionExpandida === 'casos' && (
                      <div className="flex flex-col gap-3 mt-4">
                        {casosArea.map(caso => {
                          const severidad = severidadConfig[caso.diagnostico.severidad]
                          return (
                            <div key={caso.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                  {caso.diagnostico.resumen}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{formatearFecha(caso.fecha)}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className={`px-2 py-1 rounded-full border text-xs font-semibold ${severidad.bg} ${severidad.text} ${severidad.border}`}>
                                  {caso.diagnostico.severidad}
                                </div>
                                <button
                                  onClick={() => onVerCaso(caso)}
                                  className="text-xs font-semibold text-[#0F2B5B] hover:text-[#F5A623] transition-colors"
                                >
                                  Ver
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Historial de diagnósticos globales */}
                    {seccionExpandida === 'diagnosticosGlobales' && (
                      <div className="flex flex-col gap-3 mt-4">
                        {diagnosticosGlobales.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No hay diagnósticos globales generados para esta área.
                          </p>
                        ) : (
                          diagnosticosGlobales.map(dg => {
                            const severidad = severidadConfig[dg.diagnostico.severidadGeneral]
                            return (
                              <div key={dg.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                    {dg.diagnostico.resumen}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatearFecha(dg.fecha)} — Basado en {dg.total_casos} casos
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className={`px-2 py-1 rounded-full border text-xs font-semibold ${severidad.bg} ${severidad.text} ${severidad.border}`}>
                                    {dg.diagnostico.severidadGeneral}
                                  </div>
                                  <button
                                    onClick={() => onVerDiagnosticoGlobal(dg, area.nombre)}
                                    className="text-xs font-semibold text-[#0F2B5B] hover:text-[#F5A623] transition-colors"
                                  >
                                    Ver
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  )
}