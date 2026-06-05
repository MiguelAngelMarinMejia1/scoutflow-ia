// Define todos los tipos de datos que se usan en la aplicación.
// Al centralizar los tipos aquí, cualquier componente puede importarlos
// TypeScript nos avisará si usamos los datos de forma incorrecta.

// Representa un área de la empresa tal como viene de Supabase
export interface Area {
  id: string;      // UUID generado por Supabase
  nombre: string;  // Nombre del área (ej: Logística)
  activa: boolean; // Si el área está disponible para seleccionar
}

// Representa los datos que el usuario ingresa en el formulario
export interface CasoFormulario {
  areaId: string;         // ID del área seleccionada en el desplegable
  contexto: string;       // Descripción del problema
  impacto: string;        // Nivel de impacto percibido (Alto, Medio, Bajo)
  actores: string;        // Personas o equipos involucrados
  pasosManuales: string;     // Pasos manuales que se realizan actualmente
  cuellosBottella: string; // Obstáculos o ineficiencias identificadas
}

// Representa la propuesta de solución digital generada por la IA
export interface Propuesta {
  tipoSolucion: string;        // Tipo de solución recomendada
  alcanceMvp: string;          // Qué debería incluir un MVP de esa solución
  automatizaciones: string[];  // Lista de automatizaciones sugeridas
  siguientesPasos: string[];   // Pasos concretos para avanzar
}

// Representa el diagnóstico completo generado por la IA
export interface Diagnostico {
  resumen: string;                       // Resumen ejecutivo del problema
  causasProbables: string[];             // Lista de posibles causas raíz
  severidad: 'Alto' | 'Medio' | 'Bajo'; // Nivel de severidad del problema
  oportunidades: string[];               // Oportunidades de mejora identificadas
  propuesta: Propuesta;                  // Propuesta de solución digital
}

// Representa un caso completo tal como se guarda en Supabase
export interface Caso {
  id: string;              // UUID generado por Supabase
  fecha: string;           // Fecha y hora de creación
  area_id: string;         // ID del área relacionada
  contexto: string;        // Descripción del problema
  impacto: string;         // Nivel de impacto
  actores: string;         // Actores involucrados
  pasos_manuales: string;  // Pasos manuales
  cuellos_botella: string; // Cuellos de botella
  diagnostico: Diagnostico; // Resultado del análisis de la IA
  areas?: Area;            // Datos del área (cuando se hace JOIN con la tabla areas)
}

// Representa un diagnóstico global de un área
// Agrupa y analiza todos los casos de un área para generar una visión unificada
export interface DiagnosticoGlobalResultado {
  resumen: string;                       // Resumen ejecutivo de todos los problemas del área
  patronesRecurrentes: string[];         // Problemas que se repiten entre casos
  severidadGeneral: 'Alto' | 'Medio' | 'Bajo'; // Severidad promedio del área
  areasDeOportunidad: string[];          // Oportunidades de mejora identificadas
  propuestaUnificada: {
    enfoque: string;                     // Enfoque general de solución
    iniciativesPrioritarias: string[];   // Iniciativas más importantes
    roadmap: string[];                   // Pasos ordenados para mejorar el área
  }
}

// Representa un diagnóstico global guardado en Supabase
export interface DiagnosticoGlobal {
  id: string;
  fecha: string;
  area_id: string;
  total_casos: number;
  diagnostico: DiagnosticoGlobalResultado;
  areas?: Area;                          // Datos del área (JOIN con tabla areas)
}