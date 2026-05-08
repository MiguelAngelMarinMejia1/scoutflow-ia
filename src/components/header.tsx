// Componente de encabezado principal de la aplicación.
// Muestra el branding de Lynx Retail Labs y la navegación entre las vistas principales de ScoutFlow IA.

'use client' // Este componente se ejecuta en el navegador

import { useState } from 'react'

// Definimos las props del componente
// vistaActual: qué pantalla está mostrando el usuario
// onCambiarVista: función para cambiar de pantalla
interface HeaderProps {
  vistaActual: 'nueva' | 'historial'
  onCambiarVista: (vista: 'nueva' | 'historial') => void
}

export default function Header({ vistaActual, onCambiarVista }: HeaderProps) {
  return (
    <header className="w-full bg-[#0F2B5B] shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo y nombre de la empresa */}
        <div className="flex items-center gap-3">
          {/* Logo y nombre de la empresa */}
            <div className="flex items-center gap-3">
                {/* Nombre y subtítulo */}
                <div>
                    <h1 className="text-white font-bold text-xl leading-none">
                        Lynx Retail Labs
                    </h1>
                    <p className="text-[#F5A623] text-xs font-medium tracking-widest uppercase">
                        ScoutFlow IA
                    </p>
                </div>
            </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex items-center gap-2">
          {/* Botón Nueva Consulta */}
          <button
            onClick={() => onCambiarVista('nueva')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaActual === 'nueva'
                ? 'bg-[#F5A623] text-[#0F2B5B]'  // Activo
                : 'text-white hover:bg-white/10'   // Inactivo
            }`}
          >
            Nueva Consulta
          </button>

          {/* Botón Historial */}
          <button
            onClick={() => onCambiarVista('historial')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaActual === 'historial'
                ? 'bg-[#F5A623] text-[#0F2B5B]'  // Activo
                : 'text-white hover:bg-white/10'   // Inactivo
            }`}
          >
            Historial
          </button>
        </nav>

      </div>
    </header>
  )
}