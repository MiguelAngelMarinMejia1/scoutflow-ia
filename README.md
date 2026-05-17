# ScoutFlow IA

ScoutFlow IA permite registrar problemas operativos, generar diagnosticos con Gemini, guardar casos en Supabase y disparar notificaciones mediante n8n.

El sistema tiene dos entradas principales:

- Panel web en Next.js para crear consultas desde la interfaz.
- Bot de Discord para crear casos conversando con el comando `!scouter`.

## Tecnologias

- Next.js + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Gemini API
- Discord.js
- n8n para automatizaciones, email y notificaciones

## Requisitos

- Node.js 18 o superior
- pnpm
- Cuenta de Supabase
- API Key de Google AI Studio
- Aplicacion/bot en Discord Developer Portal
- Workflow de n8n con un Webhook node

## Variables De Entorno

Crea `.env.local` en la raiz del proyecto:

```env
GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_MODEL=gemini-2.5-flash

NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

DISCORD_BOT_TOKEN=tu_token_del_bot
N8N_WEBHOOK_URL=https://tu-instancia-n8n/webhook-test/tu-id
```

Notas:

- `.env.local` no se sube a GitHub.
- `.env.example` documenta las variables requeridas sin secretos.
- En n8n, durante pruebas usa `/webhook-test/...` con `Listen for test event` activo.
- En produccion usa `/webhook/...` y activa el workflow.

## Base De Datos

Ejecuta esto en el SQL Editor de Supabase:

```sql
CREATE TABLE areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN DEFAULT true
);

INSERT INTO areas (nombre) VALUES
  ('Logistica'),
  ('Ventas'),
  ('Recursos Humanos'),
  ('Tecnologia'),
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
```

Las areas de Supabase deben coincidir con las opciones que usa el bot:

- Finanzas
- Logistica
- Marketing
- Operaciones
- Recursos Humanos
- Tecnologia
- Ventas

## Instalacion

```bash
pnpm install
```

## Ejecutar La App Web

```bash
pnpm dev
```

Abre:

```txt
http://localhost:3000
```

## Ejecutar El Bot De Discord

```bash
pnpm discord
```

Comandos disponibles:

- `!ping`: valida que el bot responde.
- `!scout tu pregunta`: consulta libre a Gemini.
- `!scouter`: inicia el flujo guiado para generar un diagnostico.
- `!cancelar`: cancela un flujo `!scouter` en curso.

## Flujo De `!scouter`

El bot pregunta:

1. Area afectada
2. Contexto del problema
3. Nivel de impacto: Alto, Medio o Bajo
4. Actores involucrados
5. Pasos manuales actuales
6. Cuellos de botella

Al completar el flujo:

1. Gemini genera el diagnostico estructurado.
2. Supabase guarda el caso en `casos`.
3. El historial de la pagina principal muestra el nuevo caso al recargar.
4. n8n recibe el payload y puede mandar el correo/notificacion.

## Payload Para n8n

El Webhook de n8n recibe:

```txt
userId
username
channelId
command
areaNombre
formulario
diagnostico
caso
notification.subject
notification.text
```

Para enviar email desde n8n puedes usar:

```txt
Asunto: {{$json.notification.subject}}
Cuerpo: {{$json.notification.text}}
```

## Errores Del Bot

El bot intenta explicar fallos comunes:

- Falta de `GEMINI_API_KEY`.
- Falta de variables de Supabase.
- Area no encontrada en Supabase.
- Gemini rechazo la solicitud.
- Gemini respondio con formato invalido.
- Falta informacion suficiente para generar un diagnostico confiable.
- n8n no recibio el payload o el webhook no estaba escuchando.

Si n8n falla, el caso puede quedar guardado en Supabase de todas formas, pero Discord avisara que no se pudo enviar la notificacion/correo.

## Mantener El Bot Activo

El bot solo esta activo mientras el proceso `pnpm discord` siga corriendo.

Si cierras la terminal, apagas el computador, se reinicia el servidor o el proceso se cae, el bot se apaga. Para dejarlo siempre activo necesitas ejecutarlo en un servidor o usar un process manager como PM2, Docker, Railway, Render, Fly.io, VPS, o una maquina que permanezca encendida.
