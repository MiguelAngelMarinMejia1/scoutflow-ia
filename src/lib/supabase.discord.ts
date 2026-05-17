import { createClient } from "@supabase/supabase-js";

import { Area, Caso, CasoFormulario, Diagnostico } from "../types";

function createDiscordSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars in .env.local");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function obtenerAreaDiscord(areaNombre: string): Promise<Area> {
  const supabase = createDiscordSupabaseClient();
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("activa", true);

  if (error) {
    throw new Error(error.message);
  }

  const area = (data || []).find((item) => normalizeText(item.nombre) === normalizeText(areaNombre));

  if (!area) {
    throw new Error(`No existe el area "${areaNombre}" en Supabase`);
  }

  return area;
}

export async function guardarCasoDiscord(
  formulario: CasoFormulario,
  diagnostico: Diagnostico
): Promise<Caso> {
  const supabase = createDiscordSupabaseClient();
  const { data, error } = await supabase
    .from("casos")
    .insert({
      area_id: formulario.areaId,
      contexto: formulario.contexto,
      impacto: formulario.impacto,
      actores: formulario.actores,
      pasos_manuales: formulario.pasosManuales,
      cuellos_botella: formulario.cuellosBottella,
      diagnostico,
    })
    .select(
      `
      *,
      areas (
        id,
        nombre
      )
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
