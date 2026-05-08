// Componente que muestra el resultado del diagnóstico generado por la IA.
// Presenta el resumen, causas, severidad, oportunidades y propuesta de solución de forma visual y organizada.

'use client'

import { Caso } from '@/types'

// Props del componente
// caso: el caso completo con el diagnóstico generado
// onNuevoAnalisis: función para volver al formulario
interface DiagnosticoProps {
  caso: Caso
  onNuevoAnalisis: () => void
}

// Configuración visual del badge de severidad
// Cada nivel tiene su propio color de fondo y texto
const severidadConfig = {
  Alto: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Severidad Alta'
  },
  Medio: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    label: 'Severidad Media'
  },
  Bajo: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Severidad Baja'
  }
}

export default function Diagnostico({ caso, onNuevoAnalisis }: DiagnosticoProps) {
  // Obtenemos la configuración visual según la severidad del diagnóstico
  const severidad = severidadConfig[caso.diagnostico.severidad]

  // Formateamos la fecha para mostrarla de forma legible
  const fecha = new Date(caso.fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">

      {/* Encabezado del diagnóstico */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F2B5B] mb-1">
              Diagnóstico Generado
            </h2>
            <p className="text-gray-400 text-sm">{fecha}</p>
          </div>

          {/* Badge de severidad */}
          <div className={`px-4 py-2 rounded-full border font-semibold text-sm ${severidad.bg} ${severidad.text} ${severidad.border}`}>
            {severidad.label}
          </div>
        </div>

        {/* Resumen ejecutivo */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Resumen Ejecutivo
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {caso.diagnostico.resumen}
          </p>
        </div>
      </div>

      {/* Causas probables */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-[#0F2B5B] mb-4">
          Causas Probables
        </h3>
        <ul className="flex flex-col gap-3">
          {caso.diagnostico.causasProbables.map((causa, index) => (
            <li key={index} className="flex items-start gap-3">
              {/* Número de causa */}
              <span className="w-6 h-6 rounded-full bg-[#0F2B5B] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="text-gray-700 text-sm leading-relaxed">{causa}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Oportunidades de mejora */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-[#0F2B5B] mb-4">
          Oportunidades de Mejora
        </h3>
        <ul className="flex flex-col gap-3">
          {caso.diagnostico.oportunidades.map((oportunidad, index) => (
            <li key={index} className="flex items-start gap-3">
              {/* Ícono de check */}
              <span className="text-[#F5A623] font-bold flex-shrink-0 mt-0.5">✓</span>
              <span className="text-gray-700 text-sm leading-relaxed">{oportunidad}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Propuesta de solución digital */}
      <div className="bg-[#0F2B5B] rounded-xl shadow-md p-8">
        <h3 className="text-lg font-bold text-white mb-6">
          Propuesta de Solución Digital
        </h3>

        <div className="flex flex-col gap-6">

          {/* Tipo de solución */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-1">
              Tipo de Solución
            </p>
            <p className="text-white text-sm">
              {caso.diagnostico.propuesta.tipoSolucion}
            </p>
          </div>

          {/* Alcance del MVP */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-1">
              Alcance del MVP
            </p>
            <p className="text-white text-sm">
              {caso.diagnostico.propuesta.alcanceMvp}
            </p>
          </div>

          {/* Automatizaciones sugeridas */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-2">
              Automatizaciones Sugeridas
            </p>
            <ul className="flex flex-col gap-2">
              {caso.diagnostico.propuesta.automatizaciones.map((auto, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#F5A623] flex-shrink-0">→</span>
                  <span className="text-white/80 text-sm">{auto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Siguientes pasos */}
          <div>
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-2">
              Siguientes Pasos
            </p>
            <ol className="flex flex-col gap-2">
              {caso.diagnostico.propuesta.siguientesPasos.map((paso, index) => (
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

      {/* Botón para nuevo análisis */}
      <button
        onClick={onNuevoAnalisis}
        className="w-full py-3 bg-white border-2 border-[#0F2B5B] text-[#0F2B5B] rounded-xl font-semibold hover:bg-[#0F2B5B] hover:text-white transition-colors"
      >
        Nuevo Análisis
      </button>

    </div>
  )
}