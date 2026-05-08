// Este archivo centraliza todas las operaciones de base de datos.
// En lugar de escribir las consultas directamente en los componentes, las tenemos aquí organizadas como funciones reutilizables.

import { createClient } from '@/utils/supabase/client'
import { Area, Caso, CasoFormulario, Diagnostico } from '@/types'

// Obtiene todas las áreas activas de la base de datos
// Se usa para llenar el desplegable en el formulario
export async function obtenerAreas(): Promise<Area[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas')           // Selecciona la tabla 'areas'
    .select('*')             // Trae todas las columnas
    .eq('activa', true)      // Solo las áreas activas
    .order('nombre')         // Ordenadas alfabéticamente

  // Si hay un error lo lanzamos para manejarlo en el componente
  if (error) throw new Error(error.message)

  // Si no hay datos retornamos un arreglo vacío
  return data || []
}

// Guarda un caso nuevo en la base de datos
// Recibe el formulario y el diagnóstico generado por la IA
export async function guardarCaso(
  formulario: CasoFormulario,
  diagnostico: Diagnostico
): Promise<Caso> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('casos')
    .insert({
      area_id: formulario.areaId,
      contexto: formulario.contexto,
      impacto: formulario.impacto,
      actores: formulario.actores,
      pasos_manuales: formulario.pasosManuales,
      cuellos_botella: formulario.cuellosBottella,
      diagnostico: diagnostico        // Se guarda como JSONB en Supabase
    })
    .select()                         // Retorna el registro recién creado
    .single()                         // Esperamos un solo resultado

  if (error) throw new Error(error.message)

  return data
}

// Obtiene todos los casos guardados con el nombre del área relacionada
// Se usa para mostrar el historial de casos
export async function obtenerCasos(): Promise<Caso[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('casos')
    .select(`
      *,
      areas (
        id,
        nombre
      )
    `)                                // JOIN con la tabla areas para traer el nombre
    .order('fecha', { ascending: false }) // Los más recientes primero

  if (error) throw new Error(error.message)

  return data || []
}

// Obtiene un caso específico por su ID
// Se usa para ver el detalle de un caso en el historial
export async function obtenerCasoPorId(id: string): Promise<Caso> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('casos')
    .select(`
      *,
      areas (
        id,
        nombre
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  return data
}