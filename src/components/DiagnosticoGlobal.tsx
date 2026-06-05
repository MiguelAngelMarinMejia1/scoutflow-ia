// Componente que muestra el diagnóstico global de un área.
// Presenta el análisis unificado de todos los casos del área incluyendo patrones recurrentes, severidad general y propuesta integral.

'use client'

import { DiagnosticoGlobal } from '@/types'

// Props del componente
interface DiagnosticoGlobalProps {
  diagnosticoGlobal: DiagnosticoGlobal
  areaNombre: string
  onVolver: () => void
}

// Configuración visual del badge de severidad
const severidadConfig = {
  Alto: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Severidad Alta' },
  Medio: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Severidad Media' },
  Bajo: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Severidad Baja' }
}

export default function DiagnosticoGlobalComp({ diagnosticoGlobal, areaNombre, onVolver }: DiagnosticoGlobalProps) {
  const severidad = severidadConfig[diagnosticoGlobal.diagnostico.severidadGeneral]

  const fecha = new Date(diagnosticoGlobal.fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">

      {/* Botón para volver */}
      <button
        onClick={onVolver}
        className="w-full py-3 bg-white border-2 border-[#0F2B5B] text-[#0F2B5B] rounded-xl font-semibold hover:bg-[#0F2B5B] hover:text-white transition-colors"
      >
        Volver al Dashboard
      </button>

      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F2B5B] mb-1">
              Diagnóstico Global — {areaNombre}
            </h2>
            <p className="text-gray-400 text-sm">{fecha}</p>
            <p className="text-gray-500 text-sm mt-1">
              Basado en {diagnosticoGlobal.total_casos} {diagnosticoGlobal.total_casos === 1 ? 'caso' : 'casos'} registrados
            </p>
          </div>

          {/* Badge de severidad general */}
          <div className={`px-4 py-2 rounded-full border font-semibold text-sm flex-shrink-0 ${severidad.bg} ${severidad.text} ${severidad.border}`}>
            {severidad.label}
          </div>
        </div>

        {/* Resumen ejecutivo */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Resumen Ejecutivo
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {diagnosticoGlobal.diagnostico.resumen}
          </p>
        </div>
      </div>

      {/* Patrones recurrentes */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-[#0F2B5B] mb-4">
          Patrones Recurrentes
        </h3>
        <ul className="flex flex-col gap-3">
          {diagnosticoGlobal.diagnostico.patronesRecurrentes.map((patron, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F2B5B] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="text-gray-700 text-sm leading-relaxed">{patron}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Áreas de oportunidad */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-[#0F2B5B] mb-4">
          Áreas de Oportunidad
        </h3>
        <ul className="flex flex-col gap-3">
          {diagnosticoGlobal.diagnostico.areasDeOportunidad.map((oportunidad, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-[#F5A623] font-bold flex-shrink-0 mt-0.5">✓</span>
              <span className="text-gray-700 text-sm leading-relaxed">{oportunidad}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Propuesta unificada */}
      <div className="bg-[#0F2B5B] rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-white mb-6">
          Propuesta de Mejora Integral
        </h3>

        <div className="flex flex-col gap-6">

          {/* Enfoque general */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-1">
              Enfoque General
            </p>
            <p className="text-white text-sm">
              {diagnosticoGlobal.diagnostico.propuestaUnificada.enfoque}
            </p>
          </div>

          {/* Iniciativas prioritarias */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-2">
              Iniciativas Prioritarias
            </p>
            <ul className="flex flex-col gap-2">
              {diagnosticoGlobal.diagnostico.propuestaUnificada.iniciativesPrioritarias.map((iniciativa, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#F5A623] flex-shrink-0">→</span>
                  <span className="text-white/80 text-sm">{iniciativa}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-2">
              Roadmap
            </p>
            <ol className="flex flex-col gap-2">
              {diagnosticoGlobal.diagnostico.propuestaUnificada.roadmap.map((paso, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#F5A623] font-bold flex-shrink-0 text-sm">
                    {index + 1}.
                  </span>
                  <span className="text-white/80 text-sm">{paso}</span>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>

    </div>
  )
}