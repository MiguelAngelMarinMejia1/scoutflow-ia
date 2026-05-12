# ScoutFlow IA

Simulador de diagnóstico y propuesta digital para Lynx Retail Labs.
Permite registrar problemas operativos, analizarlos con IA y generar propuestas de solución digital.

## Tecnologías

- Next.js 15 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Gemini API

## Requisitos previos

- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Google AI Studio](https://aistudio.google.com/apikey)
- Cuenta en [n8n](https://n8n.io) con el workflow de notificación configurado

## Configuración

### 1. Clonar el repositorio

git clone https://github.com/tu-usuario/scoutflow-ia.git
cd scoutflow-ia

### 2. Instalar dependencias

npm install

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con estas variables:

GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
N8N_WEBHOOK_URL=tu_production_url_de_n8n

### 4. Configurar la base de datos

En el SQL Editor de Supabase ejecuta:

CREATE TABLE areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN DEFAULT true
);

INSERT INTO areas (nombre) VALUES
  ('Logística'),
  ('Ventas'),
  ('Recursos Humanos'),
  ('Tecnología'),
  ('Finanzas'),
  ('Operaciones'),
  ('Marketing');

CREATE TABLE casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT now(),
  area_id UUID REFERENCES areas(id),
  contexto TEXT,
  impacto TEXT,
  actores TEXT,
  pasos_manuales TEXT,
  cuellos_botella TEXT,
  diagnostico JSONB
);

GRANT SELECT ON areas TO anon;
GRANT SELECT, INSERT ON casos TO anon;

### 5. Ejecutar el proyecto

npm run dev

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.