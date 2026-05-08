// Este archivo crea una instancia del cliente de Supabase para usarse en el servidor (Server Components y API Routes de Next.js).
// A diferencia del cliente del navegador, este maneja cookies de forma segura para operaciones del lado del servidor.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Obtenemos el almacén de cookies del servidor
  const cookieStore = await cookies()

  // Crea y retorna un cliente de Supabase configurado para el servidor
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,     // URL del proyecto Supabase
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Llave pública de acceso
    {
      cookies: {
        // Método para leer todas las cookies activas
        getAll() {
          return cookieStore.getAll()
        },
        // Método para escribir cookies (solo funciona en Server Actions y Route Handlers)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Si falla, significa que estamos en un Server Component
            // donde no se pueden escribir cookies — se ignora el error
          }
        },
      },
    }
  )
}