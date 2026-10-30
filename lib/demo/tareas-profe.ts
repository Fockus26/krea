// Props de ejemplo de Tareas del profesor y del constructor (D066, D069; brief de la ola 4,
// "Formas compartidas"). Fuente común: `TAREAS` de lib/demo/tareas.ts (no se edita) con sus
// títulos; aquí va solo lo que el lienzo añade. REAL: "Identidad de marca" (8 preguntas, 12 de 69
// evaluadas en el seed), 69 alumnos y 12 equipos. PLACEHOLDER (HANDOFF §8; CONTENT_CHECKLIST
// fila 91): el borrador «Plan de redes sociales» y sus preguntas, los avances de las demás
// tareas y las 5 preguntas de «Logo y paleta de la marca» (TAREAS no las trae).
import { COLA } from "@/lib/demo/evaluar";
import { ALUMNOS, EQUIPOS, TAREA_IDENTIDAD } from "@/lib/demo/seed";
import { type DemoTarea, TAREAS } from "@/lib/demo/tareas";
import {
  type AvanceTarea,
  type DatosBorrador,
  type EstadoTareaProfe,
  ordenarTareas,
  sumaValores,
  type TareaProfe,
} from "@/lib/tareas-profe";

/** "Hoy" fijo de la vista previa (el servidor no lee el reloj con `cacheComponents`). */
export const HOY_DEMO = "2026-10-30";
export const SECCIONES_PROFE = "5A y 5C";

/** Id y título del borrador: los mismos que usa Premios (W4) para «Agregar premio». */
export const BORRADOR_ID = "plan-redes";
export const BORRADOR_TITULO = "Plan de redes sociales";

/** PLACEHOLDER (fila 91): las 4 primeras son las del lienzo Constructor (suma 14); las 6 siguientes, sin valor. */
export const BORRADOR_DEMO: DatosBorrador = {
  titulo: BORRADOR_TITULO,
  tipo: "grupal",
  fecha: "",
  seccion: "5A y 5C",
  premio: "",
  preguntas: [
    {
      enunciado: "¿En qué red social van a publicar primero y por qué?",
      formato: "texto",
      valor: 4,
    },
    {
      enunciado: "Sube una publicación de ejemplo hecha por el equipo.",
      formato: "imagen",
      valor: 6,
    },
    {
      enunciado:
        "Hagan un calendario de una semana: qué publican cada día, a qué hora y con qué objetivo. Expliquen por qué eligieron esos horarios pensando en su cliente ideal.",
      formato: "texto",
      valor: 2,
    },
    {
      enunciado: "Escriban 3 textos cortos para acompañar sus publicaciones.",
      formato: "texto",
      valor: 2,
    },
    {
      enunciado: "¿Qué nombre de usuario van a usar y por qué?",
      formato: "texto",
      valor: null,
    },
    {
      enunciado: "Sube la foto de perfil que eligieron para la cuenta.",
      formato: "imagen",
      valor: null,
    },
    {
      enunciado: "Escriban la biografía del perfil (máximo 150 caracteres).",
      formato: "texto",
      valor: null,
    },
    {
      enunciado: "¿Qué etiquetas (hashtags) van a usar en sus publicaciones?",
      formato: "texto",
      valor: null,
    },
    {
      enunciado: "Sube una historia de ejemplo para anunciar un producto.",
      formato: "imagen",
      valor: null,
    },
    {
      enunciado: "¿Cómo van a responder a un comentario negativo?",
      formato: "texto",
      valor: null,
    },
  ],
};

/** Tarea nueva: vacía, con una pregunta. */
export const NUEVA_DEMO: DatosBorrador = {};

/**
 * Estado y avance del lado del profe. El `estado` de `TAREAS` es el que ve el alumno (su entrega
 * ya evaluada); el del profe dice si la tarea sigue recibiendo o evaluando entregas, así que
 * "Identidad de marca" está abierta (12 de 69 evaluadas en el seed), como en el lienzo.
 */
const PROFE: Readonly<
  Record<
    string,
    { estado: EstadoTareaProfe; avance: AvanceTarea; preguntas?: number }
  >
> = {
  [TAREA_IDENTIDAD.id]: {
    estado: "abierta",
    avance: {
      tipo: "evaluadas",
      hechas: TAREA_IDENTIDAD.evaluaciones.length,
      total: ALUMNOS.length,
    },
  },
  "logo-y-paleta": {
    estado: "evaluada",
    avance: {
      tipo: "evaluadas",
      hechas: EQUIPOS.length,
      total: EQUIPOS.length,
    },
    preguntas: 5,
  },
  "presentacion-producto": {
    estado: "abierta",
    avance: { tipo: "entregas", hechas: 3, total: EQUIPOS.length },
  },
  competencia: {
    estado: "abierta",
    avance: { tipo: "evaluadas", hechas: 0, total: ALUMNOS.length },
  },
};

function tareaProfe(t: DemoTarea): TareaProfe {
  const p = PROFE[t.id];
  return {
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    estado: p?.estado ?? t.estado,
    fecha: t.fecha,
    premio: t.tipo === "grupal" ? (t.premio ?? null) : null,
    preguntas: p?.preguntas ?? t.preguntas.length,
    suma: sumaValores(t.preguntas),
    avance: p?.avance ?? null,
    porEvaluar: COLA.filter((e) => e.tarea.id === t.id).length,
  };
}

const BORRADOR_LISTA: TareaProfe = {
  id: BORRADOR_ID,
  titulo: BORRADOR_TITULO,
  tipo: "grupal",
  estado: "borrador",
  fecha: null,
  premio: null,
  preguntas: BORRADOR_DEMO.preguntas?.length ?? 0,
  suma: sumaValores(BORRADOR_DEMO.preguntas ?? []),
  avance: null,
  porEvaluar: 0,
};

/** Las 4 de `TAREAS` + el borrador, en el orden de la lista. */
export function tareasProfeVista(): TareaProfe[] {
  return ordenarTareas([...TAREAS.map(tareaProfe), BORRADOR_LISTA]);
}
