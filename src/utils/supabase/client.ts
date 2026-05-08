// Este archivo crea una instancia del cliente de Supabase para usarse en el navegador (componentes del lado del cliente).
// Se usa cuando necesitamos leer o escribir datos desde un componente React.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Crea y retorna un cliente de Supabase usando las variables de entorno
  // definidas en .env.local
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,    // URL del proyecto Supabase
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Llave pública de acceso
  )
}