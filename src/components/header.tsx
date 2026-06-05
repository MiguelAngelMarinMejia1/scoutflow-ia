// Componente de encabezado principal de la aplicación.
// Muestra el branding de Lynx Retail Labs.
// El header ya no tiene navegación ya que el dashboard es la única vista principal.

'use client'

export default function Header() {
  return (
    <header className="w-full bg-[#0F2B5B] shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

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
    </header>
  )
}