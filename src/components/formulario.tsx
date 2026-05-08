// Componente del formulario dividido en 2 secciones:
// Sección 1: Contexto del problema (área, descripción, impacto)
// Sección 2: Actores y operación (actores, pasos manuales, cuellos de botella)

'use client'

import { useState, useEffect } from 'react'
import { CasoFormulario, Area } from '@/types'
import { obtenerAreas } from '@/lib/supabase.service'

// Props del componente
// onSubmit: función que se llama cuando el usuario envía el formulario
// cargando: indica si la IA está procesando para deshabilitar el botón
interface FormularioProps {
  onSubmit: (formulario: CasoFormulario, areaNombre: string) => void
  cargando: boolean
}

export default function Formulario({ onSubmit, cargando }: FormularioProps) {
  // Estado de la sección activa (1 o 2)
  const [seccion, setSeccion] = useState<1 | 2>(1)

  // Estado de las áreas cargadas desde Supabase
  const [areas, setAreas] = useState<Area[]>([])

  // Estado de carga de las áreas
  const [cargandoAreas, setCargandoAreas] = useState(true)

  // Estado del formulario — todos los campos inicializados vacíos
  const [formulario, setFormulario] = useState<CasoFormulario>({
    areaId: '',
    contexto: '',
    impacto: '',
    actores: '',
    pasosManuales: '',
    cuellosBottella: '',
  })

  // Al montar el componente, cargamos las áreas desde Supabase
  useEffect(() => {
    async function cargarAreas() {
      try {
        const data = await obtenerAreas()
        setAreas(data)
      } catch (error) {
        console.error('Error al cargar áreas:', error)
      } finally {
        setCargandoAreas(false)
      }
    }
    cargarAreas()
  }, []) // El arreglo vacío significa que solo se ejecuta una vez al montar

  // Función genérica para actualizar cualquier campo del formulario
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormulario(prev => ({
      ...prev,                    // Mantenemos los valores anteriores
      [e.target.name]: e.target.value // Actualizamos solo el campo que cambió
    }))
  }

  // Valida que los campos de la sección 1 estén completos antes de avanzar
  function validarSeccion1(): boolean {
    return (
      formulario.areaId !== '' &&
      formulario.contexto.trim() !== '' &&
      formulario.impacto !== ''
    )
  }

  // Valida que los campos de la sección 2 estén completos antes de enviar
  function validarSeccion2(): boolean {
    return (
      formulario.actores.trim() !== '' &&
      formulario.pasosManuales.trim() !== '' &&
      formulario.cuellosBottella.trim() !== ''
    )
  }

  // Maneja el envío final del formulario
  function handleSubmit() {
    if (!validarSeccion2()) return

    // Buscamos el nombre del área seleccionada para enviárselo a Gemini
    const area = areas.find(a => a.id === formulario.areaId)
    const areaNombre = area?.nombre || 'Área desconocida'

    onSubmit(formulario, areaNombre)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">

      {/* Título del formulario */}
      <h2 className="text-2xl font-bold text-[#0F2B5B] mb-2">
        Nueva Consulta
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        Registra el problema operativo para generar un diagnóstico con IA.
      </p>

      {/* Indicador de progreso — muestra en qué sección está el usuario */}
      <div className="flex items-center gap-4 mb-8">
        {/* Sección 1 */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            seccion === 1 ? 'bg-[#0F2B5B] text-white' : 'bg-[#F5A623] text-[#0F2B5B]'
          }`}>
            {seccion === 2 ? '✓' : '1'}
          </div>
          <span className="text-sm font-medium text-[#0F2B5B]">Contexto</span>
        </div>

        {/* Línea separadora */}
        <div className="flex-1 h-px bg-gray-200" />

        {/* Sección 2 */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            seccion === 2 ? 'bg-[#0F2B5B] text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            2
          </div>
          <span className={`text-sm font-medium ${
            seccion === 2 ? 'text-[#0F2B5B]' : 'text-gray-400'
          }`}>
            Actores y Operación
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: Contexto del problema */}
      {seccion === 1 && (
        <div className="flex flex-col gap-6">

          {/* Campo: Área afectada */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Área afectada <span className="text-red-500">*</span>
            </label>
            <select
              name="areaId"
              value={formulario.areaId}
              onChange={handleChange}
              disabled={cargandoAreas}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] bg-white"
            >
              <option value="">
                {cargandoAreas ? 'Cargando áreas...' : 'Selecciona un área'}
              </option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Campo: Contexto del problema */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Contexto del problema <span className="text-red-500">*</span>
            </label>
            <textarea
              name="contexto"
              value={formulario.contexto}
              onChange={handleChange}
              rows={4}
              placeholder="Describe el problema que enfrenta el área..."
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] resize-none"
            />
          </div>

          {/* Campo: Nivel de impacto */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Nivel de impacto <span className="text-red-500">*</span>
            </label>
            <select
              name="impacto"
              value={formulario.impacto}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] bg-white"
            >
              <option value="">Selecciona el nivel de impacto</option>
              <option value="Alto">Alto</option>
              <option value="Medio">Medio</option>
              <option value="Bajo">Bajo</option>
            </select>
          </div>

          {/* Botón para avanzar a la sección 2 */}
          <button
            onClick={() => validarSeccion1() && setSeccion(2)}
            disabled={!validarSeccion1()}
            className="w-full py-3 bg-[#0F2B5B] text-white rounded-lg font-semibold text-sm hover:bg-[#0a1f42] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>

        </div>
      )}

      {/* SECCIÓN 2: Actores y operación */}
      {seccion === 2 && (
        <div className="flex flex-col gap-6">

          {/* Campo: Actores involucrados */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Actores involucrados <span className="text-red-500">*</span>
            </label>
            <textarea
              name="actores"
              value={formulario.actores}
              onChange={handleChange}
              rows={3}
              placeholder="¿Quiénes participan en este proceso? (equipos, roles, personas)"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] resize-none"
            />
          </div>

          {/* Campo: Pasos manuales */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Pasos manuales actuales <span className="text-red-500">*</span>
            </label>
            <textarea
              name="pasosManuales"
              value={formulario.pasosManuales}
              onChange={handleChange}
              rows={3}
              placeholder="Describe los pasos manuales que se realizan hoy..."
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] resize-none"
            />
          </div>

          {/* Campo: Cuellos de botella */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#0F2B5B]">
              Cuellos de botella <span className="text-red-500">*</span>
            </label>
            <textarea
              name="cuellosBottella"
              value={formulario.cuellosBottella}
              onChange={handleChange}
              rows={3}
              placeholder="¿Dónde se generan los mayores obstáculos o demoras?"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F2B5B] resize-none"
            />
          </div>

          {/* Botones de navegación */}
          <div className="flex gap-3">
            {/* Botón para volver a la sección 1 */}
            <button
              onClick={() => setSeccion(1)}
              className="flex-1 py-3 border border-[#0F2B5B] text-[#0F2B5B] rounded-lg font-semibold text-sm hover:bg-[#0F2B5B]/5 transition-colors"
            >
              Volver
            </button>

            {/* Botón para enviar el formulario */}
            <button
              onClick={handleSubmit}
              disabled={!validarSeccion2() || cargando}
              className="flex-2 flex-grow py-3 bg-[#F5A623] text-[#0F2B5B] rounded-lg font-semibold text-sm hover:bg-[#e09415] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Analizando...' : 'Generar Diagnóstico'}
            </button>
          </div>

        </div>
      )}

    </div>
  )
}