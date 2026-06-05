// Este archivo maneja toda la comunicación con la API de Gemini.
// Arma el prompt con los datos del formulario, llama a la API y parsea la respuesta en un objeto Diagnostico estructurado.

import { CasoFormulario, Diagnostico, DiagnosticoGlobalResultado } from '@/types'

// URL base de la API de Gemini
// El modelo se lee desde las variables de entorno
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`

// Función principal que genera el diagnóstico
// Recibe los datos del formulario y retorna un Diagnostico completo
export async function generarDiagnostico(
  formulario: CasoFormulario,
  areaNombre: string
): Promise<Diagnostico> {

  // Armamos el prompt con los datos del formulario
  // Le indicamos a Gemini exactamente qué estructura JSON esperamos
  const prompt = `
Eres un consultor experto en transformación digital y optimización de procesos empresariales.
Analiza el siguiente problema operativo de la empresa Lynx Retail Labs y genera un diagnóstico estructurado.

INFORMACIÓN DEL PROBLEMA:
- Área afectada: ${areaNombre}
- Contexto del problema: ${formulario.contexto}
- Nivel de impacto: ${formulario.impacto}
- Actores involucrados: ${formulario.actores}
- Pasos manuales actuales: ${formulario.pasosManuales}
- Cuellos de botella identificados: ${formulario.cuellosBottella}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques de código:
{
  "resumen": "Resumen ejecutivo del problema en 2-3 oraciones",
  "causasProbables": [
    "Causa 1",
    "Causa 2",
    "Causa 3"
  ],
  "severidad": "Alto" | "Medio" | "Bajo",
  "oportunidades": [
    "Oportunidad de mejora 1",
    "Oportunidad de mejora 2"
  ],
  "propuesta": {
    "tipoSolucion": "Tipo de solución recomendada",
    "alcanceMvp": "Descripción del MVP sugerido",
    "automatizaciones": [
      "Automatización sugerida 1",
      "Automatización sugerida 2"
    ],
    "siguientesPasos": [
      "Paso 1",
      "Paso 2",
      "Paso 3"
    ]
  }
}

Responde todo en español.
`

  // Llamada a la API de Gemini
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt  // El prompt que armamos arriba
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,      // Controla la creatividad (0 = exacto, 1 = creativo)
        maxOutputTokens: 2048, // Máximo de tokens en la respuesta
      }
    })
  })

  // Si la API responde con error, lo lanzamos
  if (!response.ok) {
    throw new Error(`Error al llamar Gemini: ${response.statusText}`)
  }

  const data = await response.json()

  // Extraemos el texto de la respuesta de Gemini
  const texto = data.candidates[0].content.parts[0].text
  if (!texto) {
    throw new Error('Gemini no devolvió texto en la respuesta')
  }

  // Limpiamos el texto por si Gemini agrega bloques de código markdown
  const textoLimpio = texto.replace(/```json|```/g, '').trim()
  
  try {
  // Parseamos el JSON y lo retornamos como un objeto Diagnostico
    const diagnostico: Diagnostico = JSON.parse(textoLimpio)
    return diagnostico
  } catch (error) {
    console.error('Respuesta cruda de Gemini:', textoLimpio)
    throw new Error('Gemini devolvió un JSON inválido')
  }
}

// Función que genera un diagnóstico global para un área
// Recibe todos los casos del área y los analiza en conjunto
export async function generarDiagnosticoGlobal(
  areaNombre: string,
  casos: { contexto: string; impacto: string; actores: string; pasosManuales: string; cuellosBottella: string; diagnostico: Diagnostico }[]
): Promise<DiagnosticoGlobalResultado> {

  // Construimos un resumen de cada caso para incluirlo en el prompt
  const resumenCasos = casos.map((caso, index) => `
CASO ${index + 1}:
- Contexto: ${caso.contexto}
- Impacto: ${caso.impacto}
- Actores: ${caso.actores}
- Pasos manuales: ${caso.pasosManuales}
- Cuellos de botella: ${caso.cuellosBottella}
- Diagnóstico previo: ${caso.diagnostico.resumen}
- Severidad: ${caso.diagnostico.severidad}
  `).join('\n')

  const prompt = `
Eres un consultor experto en transformación digital y optimización de procesos empresariales.
Analiza el conjunto de problemas operativos del área de ${areaNombre} de la empresa Lynx Retail Labs.
Se te presentan ${casos.length} casos registrados. Tu tarea es generar un diagnóstico unificado que identifique patrones, problemas recurrentes y una propuesta de mejora integral para toda el área.

CASOS REGISTRADOS:
${resumenCasos}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques de código:
{
  "resumen": "Resumen ejecutivo unificado de todos los problemas del área en 3-4 oraciones",
  "patronesRecurrentes": [
    "Patrón o problema recurrente 1",
    "Patrón o problema recurrente 2"
  ],
  "severidadGeneral": "Alto" | "Medio" | "Bajo",
  "areasDeOportunidad": [
    "Oportunidad de mejora 1",
    "Oportunidad de mejora 2"
  ],
  "propuestaUnificada": {
    "enfoque": "Descripción del enfoque general de solución para toda el área",
    "iniciativesPrioritarias": [
      "Iniciativa prioritaria 1",
      "Iniciativa prioritaria 2"
    ],
    "roadmap": [
      "Paso 1 del roadmap",
      "Paso 2 del roadmap",
      "Paso 3 del roadmap"
    ]
  }
}

Responde todo en español.
`

  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Error al llamar Gemini: ${response.statusText}`)
  }

  const data = await response.json()

  const texto = data.candidates[0].content.parts[0].text
  if (!texto) {
    throw new Error('Gemini no devolvió texto en la respuesta')
  }

  const textoLimpio = texto.replace(/```json|```/g, '').trim()

  
  try {
  // Parseamos el JSON y lo retornamos como un objeto Diagnostico
    const diagnosticoGlobal: DiagnosticoGlobalResultado = JSON.parse(textoLimpio)
    return diagnosticoGlobal
  } catch (error) {
    console.error('Respuesta cruda de Gemini:', textoLimpio)
    throw new Error('Gemini devolvió un JSON inválido')
  }
}