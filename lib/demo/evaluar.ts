// Cola "Por evaluar" de la vista previa de Evaluar entrega (D066, D069; brief de la ola 3,
// "Formas compartidas"): 7 entregas, 4 individuales y 3 grupales. Las dos primeras son las del
// lienzo (5A-G2 Repostería · "Logo y paleta del emprendimiento" de Raquel Figueroa, y Mateo
// Paredes · "Identidad de marca"); las demás salen del seed (alumnos y equipos reales) con
// tareas de lib/demo/tareas.ts. REAL: nombres, equipos, secciones, capitanes, bases y las
// preguntas de "Identidad de marca". PLACEHOLDER (HANDOFF §8; CONTENT_CHECKLIST fila 80):
// fechas y horas de entrega, las respuestas de los alumnos, los puntajes y el comentario
// ya puestos, el título y las preguntas de "Logo y paleta del emprendimiento" y de "Plan de
// ventas" (la tarea larga de "Contenido extremo"). La fase 07 cambia la fuente, no la forma.

import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import type { ReviewIdentity } from "@/components/sections/evaluar/review-header";
import { IMAGEN_DEMO } from "@/lib/demo/entrega";
import {
  alumnoPorCedula,
  type DemoAlumno,
  equipoPorId,
  integrantes,
  nombreCorto,
  type Seccion,
  TAREA_IDENTIDAD,
} from "@/lib/demo/seed";
import { TAREAS } from "@/lib/demo/tareas";
import {
  baseChipTexto,
  baseEfectiva,
  entregaLinea,
  eyebrowEvaluar,
  type SiguienteEntrega,
  type TipoEntrega,
  tipoChipTexto,
  tituloEntrega,
} from "@/lib/evaluar";
import { answerImageAlt } from "@/lib/question";

export type DemoPreguntaEntrega = {
  id: string;
  enunciado: string;
  valor: number;
  respuesta: QuestionAnswer;
  /** Puntaje ya puesto al abrir; `null`/ausente = sin puntuar (D003). */
  puntaje?: number | null;
  comentario?: string;
};

export type DemoEntrega = {
  id: string;
  tipo: TipoEntrega;
  /** Alumno (individual) o equipo (grupal) que se evalúa. */
  destino: { tipo: "alumno"; cedula: string } | { tipo: "equipo"; id: string };
  tarea: { id: string; titulo: string; premio?: string };
  /** Grupal: quien la envió (el capitán, D012). */
  entregadaPor?: string;
  /** Género de quien envió para "(capitana)"; no está en el seed (D075): solo el lienzo lo da. */
  femenino?: boolean;
  /** Día civil ISO y hora "hh:mm" de la entrega. */
  fecha: string;
  hora: string;
  preguntas: readonly DemoPreguntaEntrega[];
};

const texto = (t: string): QuestionAnswer => ({ tipo: "texto", texto: t });
const imagen = (alt: string): QuestionAnswer => ({
  tipo: "imagen",
  src: IMAGEN_DEMO,
  alt,
});

/** Enunciados de "Identidad de marca" con tildes, como el lienzo (lib/demo/notas.ts no los exporta). */
const ENUNCIADOS_IDENTIDAD: Readonly<Record<string, string>> = {
  p1: "¿Cómo se llama la marca?",
  p2: "¿Por qué nació esta marca?",
  p3: "¿Qué producto o servicio vende?",
  p4: "¿Cuál es el cliente ideal?",
  p5: "¿Cuál es la personalidad de la marca?",
  p6: "¿Qué problema resuelven?",
  p7: "¿Cuál es el elemento diferenciador?",
  p8: "¿Cuáles son los 3 valores principales?",
};

/** "Identidad de marca" (seed) con las respuestas de ejemplo de un alumno. */
function identidad(respuestas: readonly string[]): DemoPreguntaEntrega[] {
  return TAREA_IDENTIDAD.preguntas.map((p, i) => ({
    id: p.id,
    enunciado: ENUNCIADOS_IDENTIDAD[p.id] ?? p.enunciado,
    valor: p.valor,
    respuesta: texto(respuestas[i] ?? ""),
  }));
}

/** Tarea de lib/demo/tareas.ts por id (título, premio y preguntas de ejemplo). */
function tareaDemo(id: string) {
  const t = TAREAS.find((x) => x.id === id);
  if (!t) throw new RangeError(`No hay tarea de ejemplo ${id}`);
  return t;
}

const PRESENTACION = tareaDemo("presentacion-producto");
const COMPETENCIA = tareaDemo("competencia");

/** "Logo y paleta del emprendimiento" del lienzo Evaluar (5 preguntas: 6 + 4 + 4 + 3 + 3). */
const LOGO_Y_PALETA = {
  id: "logo-y-paleta-emprendimiento",
  titulo: "Logo y paleta del emprendimiento",
  premio: "Salida al cine con todo pago",
} as const;

function logoYPaleta(
  equipo: string,
  respuestas: {
    colores: string;
    tipografia: string;
    uso: string;
    paleta: string;
  },
): DemoPreguntaEntrega[] {
  return [
    {
      id: "p1",
      enunciado: "Sube el logo de tu emprendimiento.",
      valor: 6,
      respuesta: imagen(`Logo entregado por ${equipo}`),
    },
    {
      id: "p2",
      enunciado: "¿Por qué eligieron esos colores?",
      valor: 4,
      respuesta: texto(respuestas.colores),
    },
    {
      id: "p3",
      enunciado: "Sube la paleta con los códigos de cada color.",
      valor: 4,
      respuesta: imagen(respuestas.paleta),
    },
    {
      id: "p4",
      enunciado: "¿Qué tipografía usaron y por qué?",
      valor: 3,
      respuesta: texto(respuestas.tipografia),
    },
    {
      id: "p5",
      enunciado: "¿Dónde van a usar el logo primero?",
      valor: 3,
      respuesta: texto(respuestas.uso),
    },
  ];
}

/** "Plan de ventas": 10 preguntas, una de 7 (> 6 → stepper) — tablero "Contenido extremo". */
const PLAN_DE_VENTAS = { id: "plan-de-ventas", titulo: "Plan de ventas" };
const PLAN_ENUNCIADOS: readonly (readonly [string, number])[] = [
  ["Escribe la meta de ventas del primer mes y explica cómo la calculaste.", 7],
  ["¿Cuánto cuesta producir una unidad?", 2],
  ["¿A qué precio la venderán?", 2],
  ["¿Cuántas unidades necesitan vender para cubrir los costos?", 1],
  ["¿Dónde van a vender?", 1],
  ["¿Qué días y a qué hora?", 1],
  ["¿Quién del equipo cobra y lleva las cuentas?", 1],
  ["Sube una foto de la tabla de inventario.", 2],
  ["¿Qué promoción harán la primera semana?", 2],
  ["¿Qué harán si sobra producto?", 1],
];
const PLAN_RESPUESTAS: readonly (number | null)[] = [
  5.5,
  2,
  2,
  1,
  1,
  1,
  null,
  null,
  null,
  null,
];

/** PLACEHOLDER (fila 80): la cola completa, en el orden en que se evalúa. */
export const COLA: readonly DemoEntrega[] = [
  {
    id: "5a-g2-logo-y-paleta",
    tipo: "grupal",
    destino: { tipo: "equipo", id: "5a-g2" },
    tarea: LOGO_Y_PALETA,
    entregadaPor: "45009896",
    // El lienzo y el brief dicen "(capitana)" para Raquel (D075: solo con el dato a mano)
    femenino: true,
    fecha: "2026-10-25",
    hora: "16:12",
    preguntas: logoYPaleta("5A-G2 Repostería", {
      colores:
        "El rosado y el marrón recuerdan a las tortas y al chocolate. El crema da calma y se ve limpio, como una vitrina de pastelería.",
      paleta: "Paleta: rosado #E98AA7, marrón #6B3E26, crema #F6E7D2",
      tipografia:
        "Una letra redondita tipo manuscrita, porque se ve casera y dulce como nuestros postres.",
      uso: "En las etiquetas de las cajitas de cupcakes y en el perfil de Instagram del emprendimiento.",
    }).map((p) =>
      p.id === "p1"
        ? { ...p, puntaje: 5.5 }
        : p.id === "p2"
          ? {
              ...p,
              puntaje: 3.5,
              comentario:
                "Bien explicado. Agrega qué quieren que sienta el cliente al ver la vitrina.",
            }
          : p,
    ),
  },
  {
    id: "45003711-identidad-de-marca",
    tipo: "individual",
    destino: { tipo: "alumno", cedula: "45003711" },
    tarea: { id: TAREA_IDENTIDAD.id, titulo: TAREA_IDENTIDAD.titulo },
    fecha: "2026-10-25",
    hora: "15:05",
    preguntas: identidad([
      "Corte Fino",
      "Porque en el barrio no hay una barbería para jóvenes con precios de estudiante.",
      "Esquivel de cabello, perfilado de barba y diseños con navaja.",
      "Muchachos de 14 a 20 años que quieren verse bien sin gastar mucho.",
      "Fresca, confiable y con estilo urbano.",
      "Que hay que esperar mucho y los esquivel de moda salen caros.",
      "Atendemos con cita por WhatsApp y te mandamos foto del corte antes de empezar.",
      "Puntualidad, limpieza y buen trato.",
    ]),
  },
  {
    id: "45006185-competencia",
    tipo: "individual",
    destino: { tipo: "alumno", cedula: "45006185" },
    tarea: { id: COMPETENCIA.id, titulo: COMPETENCIA.titulo },
    fecha: "2026-10-25",
    hora: "11:20",
    preguntas: COMPETENCIA.preguntas.map((p, i) => ({
      id: p.id,
      enunciado: p.enunciado,
      valor: p.valor,
      respuesta:
        p.formato === "imagen"
          ? imagen(answerImageAlt("Benjamín Sandoval", i + 1))
          : texto(
              [
                "Sweet Day, Dulce Antojo y La Casa del Ponqué.",
                "Tienen local propio, aceptan pago móvil y publican fotos todos los días.",
              ][i] ?? "",
            ),
    })),
  },
  {
    id: "5c-g3-presentacion",
    tipo: "grupal",
    destino: { tipo: "equipo", id: "5c-g3" },
    tarea: {
      id: PRESENTACION.id,
      titulo: PRESENTACION.titulo,
      premio: PRESENTACION.premio,
    },
    entregadaPor: "45086590",
    fecha: "2026-10-24",
    hora: "18:30",
    preguntas: PRESENTACION.preguntas.map((p, i) => ({
      id: p.id,
      enunciado: p.enunciado,
      valor: p.valor,
      respuesta:
        p.formato === "imagen"
          ? imagen(answerImageAlt("5C-G3 Repostería", i + 1))
          : texto(
              i === 1
                ? "A 2 dólares cada cupcake, porque la competencia los vende a 2,5 y los nuestros son más pequeños."
                : "Hola, somos 5C-G3 Repostería. Hacemos cupcakes con ingredientes frescos y los entregamos en el liceo.",
            ),
    })),
  },
  {
    id: "45014844-identidad-de-marca",
    tipo: "individual",
    destino: { tipo: "alumno", cedula: "45014844" },
    tarea: { id: TAREA_IDENTIDAD.id, titulo: TAREA_IDENTIDAD.titulo },
    fecha: "2026-10-24",
    hora: "10:45",
    preguntas: identidad([
      "Brasa Express",
      "Porque a la salida del liceo no hay dónde comer algo rápido.",
      "Perros calientes, hamburguesas y tequeños.",
      "Estudiantes y profesores que salen con hambre.",
      "Alegre, rápida y económica.",
      "Comer algo caliente sin salir lejos del liceo.",
      "Combos para estudiantes con bebida incluida.",
      "Rapidez, sabor y precio justo.",
    ]),
  },
  {
    id: "5a-g3-logo-y-paleta",
    tipo: "grupal",
    destino: { tipo: "equipo", id: "5a-g3" },
    tarea: LOGO_Y_PALETA,
    entregadaPor: "45058139",
    fecha: "2026-10-23",
    hora: "17:00",
    preguntas: logoYPaleta("5A-G3 Ropa", {
      colores:
        "Negro y blanco porque combinan con todo, y un toque de verde para que se vea fresco.",
      paleta: "Paleta: negro #111111, blanco #FFFFFF, verde #2E8B57",
      tipografia:
        "Una letra gruesa y recta, como las de las marcas de ropa urbana.",
      uso: "En las etiquetas de las franelas y en las bolsas.",
    }),
  },
  {
    id: "45013607-plan-de-ventas",
    tipo: "individual",
    destino: { tipo: "alumno", cedula: "45013607" },
    tarea: PLAN_DE_VENTAS,
    fecha: "2026-10-23",
    hora: "9:15",
    preguntas: PLAN_ENUNCIADOS.map(([enunciado, valor], i) => ({
      id: `p${i + 1}`,
      enunciado,
      valor,
      respuesta: enunciado.startsWith("Sube")
        ? imagen(answerImageAlt("Darío Farías", i + 1))
        : texto("Respuesta de ejemplo del alumno."),
      puntaje: PLAN_RESPUESTAS[i] ?? null,
    })),
  },
];

/* ---------- Props de la vista ---------- */

type IdentidadEntrega = ReviewIdentity;

export type EvaluarVista = {
  entrega: DemoEntrega;
  indice: number;
  total: number;
  eyebrow: string;
  tituloTopbar: string;
  titulo: string;
  identidad: IdentidadEntrega;
  linea: string;
  chips: {
    tipo: TipoEntrega;
    tipoTexto: string;
    seccion: string;
    base: string;
    premio?: string;
  };
  /** Base con la que se calcula la nota (grupal: 20, D014). */
  base: number;
  /** Grupal: integrantes para «No participó» (D364); vacío en individuales. */
  integrantes: Array<{ cedula: string; nombre: string }>;
  /** Base de cada integrante en esta tarea (D403): la vigente de cada alumno del demo. */
  bases: Record<string, number>;
  siguiente: SiguienteEntrega;
};

function nombreDestino(e: DemoEntrega): string {
  if (e.destino.tipo === "equipo") return equipoPorId(e.destino.id).nombre;
  return nombreCorto(alumnoPorCedula(e.destino.cedula));
}

/** Props de la entrega `indice` (desde 0) de la cola. */
export function evaluarVista(indice: number): EvaluarVista {
  const entrega = COLA[indice];
  if (!entrega) throw new RangeError(`No hay entrega ${indice}`);
  const total = COLA.length;
  const siguiente = COLA[indice + 1];

  let identidadE: IdentidadEntrega;
  let seccion: Seccion;
  let baseAlumno = 20;
  let integrantesN: number | undefined;
  let miembros: EvaluarVista["integrantes"] = [];
  let bases: EvaluarVista["bases"] = {};
  if (entrega.destino.tipo === "equipo") {
    const eq = equipoPorId(entrega.destino.id);
    identidadE = { tipo: "equipo", teamId: eq.id, tema: eq.tema ?? eq.nombre };
    seccion = eq.seccion;
    miembros = integrantes(eq).map((a) => ({
      cedula: a.cedula,
      nombre: nombreCorto(a),
    }));
    bases = Object.fromEntries(integrantes(eq).map((a) => [a.cedula, a.base]));
    integrantesN = miembros.length;
  } else {
    const al: DemoAlumno = alumnoPorCedula(entrega.destino.cedula);
    // PLACEHOLDER: el estilo de avatar lo elige cada alumno en Perfil
    identidadE = {
      tipo: "alumno",
      estilo: "adventurer-neutral",
      seed: al.cedula,
      nombre: nombreCorto(al),
    };
    seccion = al.seccion;
    baseAlumno = al.base;
    bases = { [al.cedula]: al.base };
  }

  return {
    entrega,
    indice,
    total,
    eyebrow: eyebrowEvaluar(indice, total),
    tituloTopbar: tituloEntrega(indice, total),
    titulo: nombreDestino(entrega),
    identidad: identidadE,
    linea: entregaLinea({
      tarea: entrega.tarea.titulo,
      tipo: entrega.tipo,
      autor: entrega.entregadaPor
        ? nombreCorto(alumnoPorCedula(entrega.entregadaPor))
        : undefined,
      femenino: entrega.femenino,
      fecha: entrega.fecha,
      hora: entrega.hora,
    }),
    chips: {
      tipo: entrega.tipo,
      tipoTexto: tipoChipTexto(entrega.tipo, integrantesN),
      seccion: `Sección ${seccion}`,
      base: baseChipTexto(entrega.tipo, baseAlumno),
      premio: entrega.tipo === "grupal" ? entrega.tarea.premio : undefined,
    },
    base: baseEfectiva(entrega.tipo, baseAlumno),
    integrantes: miembros,
    bases,
    siguiente: siguiente
      ? { nombre: nombreDestino(siguiente), tarea: siguiente.tarea.titulo }
      : null,
  };
}
