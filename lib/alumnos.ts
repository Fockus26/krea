// Textos y lógica de Alumnos (HANDOFF §3 Alumnos, §2.15; lienzo design/canvas/Alumnos.dc.html).
// Lógica pura, sin React. D106–D109.

import type { DicebearEstilo } from "@/lib/dicebear";
import { BASE_MAX, BASE_MIN, NOTA_APROBATORIA } from "@/lib/grades";
import type { SeccionId } from "@/lib/modelo";
import { cedulaTexto } from "@/lib/perfil";
import { esCodigoSeccion, ordenarSecciones } from "@/lib/secciones";

/** Una fila de la tabla: lo que la pantalla necesita ya resuelto (la fuente real llega en la fase 07). */
/** Una entrega en la ficha del alumno (Editar alumno). */
export type EntregaDeAlumno = {
  id: string;
  titulo: string;
  tipo: "individual" | "grupal";
  /** Nota con su base; `null` = Pendiente (entregada sin evaluar, D003). */
  nota: number | null;
  /** Puntaje de la evaluación sobre 20; `null` mientras no esté evaluada. */
  puntaje: number | null;
  estado: "entregada" | "evaluada";
  /** En una grupal evaluada, el profe lo marcó «No participó» (D365): su nota es la mínima. */
  noParticipo: boolean;
};

/** La ficha separa «Individuales» y «Grupales» (D400); cada lista conserva el orden recibido. */
export function separarEntregas(entregas: readonly EntregaDeAlumno[]): {
  individuales: EntregaDeAlumno[];
  grupales: EntregaDeAlumno[];
} {
  return {
    individuales: entregas.filter((e) => e.tipo === "individual"),
    grupales: entregas.filter((e) => e.tipo === "grupal"),
  };
}

/** Qué se hace con una entrega desde la ficha: evaluar la pendiente, corregir la evaluada. */
export function accionDeEntrega(
  e: Pick<EntregaDeAlumno, "estado">,
): "evaluar" | "corregir" {
  return e.estado === "evaluada" ? "corregir" : "evaluar";
}

/** Nombre accesible de «Ver», «Evaluar» o «Corregir» de la ficha: incluye la tarea. */
export function entregaAccionLabel(
  accion: "ver" | "evaluar" | "corregir",
  titulo: string,
): string {
  const verbo =
    accion === "ver" ? "Ver" : accion === "evaluar" ? "Evaluar" : "Corregir";
  return `${verbo} la entrega de ${titulo}`;
}

/**
 * La tarea 1 en la ficha (`lib/puntaje-final`): el profe pone su puntaje final, haya entregado o
 * no. Solo si la tarea es de la sección del alumno.
 */
export type PuntajeFinalAlumno = {
  titulo: string;
  /** Sobre 20; `null` = todavía sin nota. */
  puntaje: number | null;
};

export type FilaAlumno = {
  cedula: string;
  seccion: SeccionId;
  nombres: string;
  apellidos: string;
  /** "5A-G2 Repostería"; `null` = "Sin equipo". */
  equipo: string | null;
  /** Base de evaluación 10–20 (D006). */
  base: number;
  /** Nota individual vigente; `null` = Pendiente (D003). */
  nota: number | null;
  /**
   * Nota grupal vigente: la de su grupal evaluada más reciente, con su base (D399); `null` =
   * Pendiente. Ausente en la vista previa.
   */
  notaGrupal?: number | null;
  /** Nota en cada tarea evaluada (id → nota, con su base); sin entrada = Pendiente (D252). */
  notas?: Readonly<Record<string, number>>;
  /** Puntos del ranking (D007). */
  puntos: number;
  /**
   * Tareas que entregó (individuales y grupales donde es integrante), la más reciente primero;
   * cada una abre su entrega en Evaluar. Ausente en la vista previa.
   */
  entregas?: readonly EntregaDeAlumno[];
  /** Puntaje final de la tarea 1 (única que se edita desde la ficha); ausente si no aplica. */
  puntajeFinal?: PuntajeFinalAlumno;
  estilo: DicebearEstilo;
  /** Semilla del avatar elegida en Perfil (D191); sin ella, la cédula (vista previa). */
  semilla?: string;
  /** Email de recuperación (`privados`, D209); ausente en la vista previa (no se edita). */
  email?: string | null;
};

/** Minúsculas, sin diacríticos y con los espacios colapsados: "  MÉndez  " → "mendez". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Nombre completo para filas y botones: "Jailyn Verónica Martínez Méndez". */
export function nombreAlumno(
  a: Pick<FilaAlumno, "nombres" | "apellidos">,
): string {
  return `${a.nombres} ${a.apellidos}`.replace(/\s+/g, " ").trim();
}

/**
 * Filtra por nombre, apellido o cédula, sin tildes ni mayúsculas. La cédula se busca con o sin
 * puntos ("34.099" y "34099" encuentran lo mismo); una consulta sin dígitos no mira la cédula.
 * Consulta vacía → la lista tal cual.
 */
export function filtrarAlumnos<
  T extends Pick<FilaAlumno, "nombres" | "apellidos" | "cedula">,
>(lista: readonly T[], consulta: string): T[] {
  const q = normalizar(consulta);
  if (q === "") return [...lista];
  const digitos = q.replace(/\D/g, "");
  return lista.filter((a) => {
    if (normalizar(nombreAlumno(a)).includes(q)) return true;
    return digitos !== "" && a.cedula.includes(digitos);
  });
}

/**
 * Frase completa y estable para `role="status"` (se anuncia en cada tecla, así que nunca un número
 * suelto): "5 resultados para «mé»", "1 resultado para «x»", "Sin resultados para «x»".
 * Sin consulta: el total de la sección ("35 estudiantes en 5A").
 */
export function contadorTexto(
  n: number,
  consulta: string,
  seccion?: SeccionId,
): string {
  const q = consulta.replace(/\s+/g, " ").trim();
  if (q === "") {
    const donde = seccion ? ` en ${seccion}` : "";
    return `${n} ${n === 1 ? "estudiante" : "estudiantes"}${donde}`;
  }
  if (n === 0) return `Sin resultados para «${q}»`;
  return `${n} ${n === 1 ? "resultado" : "resultados"} para «${q}»`;
}

/** Opción del segmentado: "5A · 35". */
export function seccionOpcionTexto(seccion: SeccionId, n: number): string {
  return `${seccion} · ${n}`;
}

/** Eyebrow del encabezado: "69 estudiantes · 2 secciones". */
export function resumenTexto(total: number, secciones: number): string {
  return `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${secciones} ${secciones === 1 ? "sección" : "secciones"}`;
}

/** Nombre accesible de la región desplazable de la tabla. */
export function tablaLabel(seccion: SeccionId): string {
  return `Tabla de alumnos de ${seccion}`;
}

/** "34099118" → "34.099.118": puntos de miles solo para mostrar (reutiliza el de Perfil). */
export function cedulaConPuntos(cedula: string): string {
  return cedulaTexto(cedula).replace(/^C\.I\. /, "");
}

/** Subtítulo del diálogo Editar: "Jailyn Verónica Martínez Méndez · C.I. 37.575.127 · 5A". */
export function subtituloEdicion(
  a: Pick<FilaAlumno, "nombres" | "apellidos" | "cedula" | "seccion">,
): string {
  return `${nombreAlumno(a)} · ${cedulaTexto(a.cedula)} · ${a.seccion}`;
}

/** Nombre accesible del botón Editar de una fila. */
export function editarLabel(
  a: Pick<FilaAlumno, "nombres" | "apellidos">,
): string {
  return `Editar a ${nombreAlumno(a)}`;
}

export const MOTIVO_BASE_REQUERIDO =
  "Escribe por qué cambias la base: el alumno lo verá.";
export const NOMBRES_VACIO = "Escribe el nombre.";
export const APELLIDOS_VACIO = "Escribe el apellido.";
export const BASE_INVALIDA = "La base va de 10 a 20, de medio en medio.";
export const EMAIL_INVALIDO = "Escribe un email válido, como nombre@gmail.com.";

/** Forma mínima de un email (el servidor lo valida con zod). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Paso de la base (D004/D006). */
export const BASE_PASO = 0.5;

export type EdicionAlumno = {
  baseAnterior: number;
  baseNueva: number;
  motivo: string;
  nombres: string;
  apellidos: string;
  /**
   * Campos «Primer nombre» y «Primer apellido» del diálogo, si los hay: no pueden quedar en blanco
   * aunque el segundo tenga texto (QA versión 1, F-M2: «Génesis Julibeth» pasaba a «Julibeth»).
   */
  primerNombre?: string;
  primerApellido?: string;
  /** Email de recuperación; ausente si no se edita (vista previa). Vacío = sin email. */
  email?: string;
};

export type ErroresEdicion = {
  nombres?: string;
  apellidos?: string;
  base?: string;
  motivo?: string;
  email?: string;
};

/** ¿Cambió la base? Es lo único que vuelve obligatorio el motivo. */
export function baseCambio(baseAnterior: number, baseNueva: number): boolean {
  return baseAnterior !== baseNueva;
}

/**
 * Errores del formulario Editar (D071: al enviar). Motivo obligatorio **solo si la base cambió**;
 * nombres y apellidos no vacíos (y el primero de cada uno, si viene); base entre 10 y 20 en pasos de 0,5. `{}` = válido.
 */
export function validarEdicion(e: EdicionAlumno): ErroresEdicion {
  const errores: ErroresEdicion = {};
  const vacio = (v: string | undefined) => v !== undefined && v.trim() === "";
  if (e.nombres.trim() === "" || vacio(e.primerNombre))
    errores.nombres = NOMBRES_VACIO;
  if (e.apellidos.trim() === "" || vacio(e.primerApellido))
    errores.apellidos = APELLIDOS_VACIO;
  const baseValida =
    Number.isFinite(e.baseNueva) &&
    e.baseNueva >= BASE_MIN &&
    e.baseNueva <= BASE_MAX &&
    Number.isInteger(e.baseNueva / BASE_PASO);
  if (!baseValida) errores.base = BASE_INVALIDA;
  else if (baseCambio(e.baseAnterior, e.baseNueva) && e.motivo.trim() === "") {
    errores.motivo = MOTIVO_BASE_REQUERIDO;
  }
  const email = e.email?.trim() ?? "";
  if (email !== "" && !EMAIL.test(email)) errores.email = EMAIL_INVALIDO;
  return errores;
}

/** Une primer y segundo nombre (o apellido) sin dobles espacios: ("Jailyn", " Verónica") → "Jailyn Verónica". */
export function unirNombre(primero: string, segundo: string): string {
  return `${primero} ${segundo}`.replace(/\s+/g, " ").trim();
}

/**
 * Sección que sugiere el vacío de la búsqueda: la que tiene más coincidencias, sin contar la
 * actual; en empate, la primera por año y letra. Ninguna con coincidencias → `null`.
 */
export function seccionSugerida(
  actual: SeccionId,
  coincidencias: Readonly<Record<SeccionId, number>>,
): SeccionId | null {
  let mejor: SeccionId | null = null;
  for (const s of ordenarSecciones(Object.keys(coincidencias))) {
    const n = coincidencias[s] ?? 0;
    if (s === actual || n <= 0) continue;
    if (mejor === null || n > (coincidencias[mejor] ?? 0)) mejor = s;
  }
  return mejor;
}

/**
 * Vacío de la búsqueda sin resultados (lienzo Vacios.dc.html «Alumnos · búsqueda sin resultados»,
 * D170). Sugiere otra sección solo si allí sí hay coincidencias: la que tiene más (D323).
 */
export function busquedaVacia(
  consulta: string,
  seccion: SeccionId,
  coincidencias: Readonly<Record<SeccionId, number>>,
): { titulo: string; descripcion: string; otra: SeccionId | null } {
  const q = consulta.replace(/\s+/g, " ").trim();
  const otra = seccionSugerida(seccion, coincidencias);
  return {
    titulo: `Nadie con «${q}» en ${seccion}`,
    descripcion: otra
      ? `Revisa las tildes o busca por cédula. ¿Quizás está en ${otra}?`
      : "Revisa las tildes o busca por cédula.",
    otra,
  };
}

/* ---------- Filtros por URL (D252) ---------- */

export type EstadoAlumnos = "evaluados" | "raspados" | "pendientes";
export const ESTADOS_ALUMNOS: readonly EstadoAlumnos[] = [
  "evaluados",
  "raspados",
  "pendientes",
];

/** Filtros de /profe/alumnos que viajan en la URL; todos opcionales. */
export type FiltrosAlumnos = {
  seccion?: SeccionId;
  estado?: EstadoAlumnos;
  /** Id de la tarea sobre la que se miran `estado` y la columna de nota. */
  tarea?: string;
  /** Cédula del alumno cuya ficha se abre. */
  alumno?: string;
};

export const RUTA_ALUMNOS = "/profe/alumnos";

/** Ruta de Alumnos con los filtros dados: `rutaAlumnos({ tarea: "t1", estado: "raspados" })`. */
export function rutaAlumnos(filtros: FiltrosAlumnos = {}): string {
  const p = new URLSearchParams();
  if (filtros.seccion) p.set("seccion", filtros.seccion);
  if (filtros.estado) p.set("estado", filtros.estado);
  if (filtros.tarea) p.set("tarea", filtros.tarea);
  if (filtros.alumno) p.set("alumno", filtros.alumno);
  const q = p.toString();
  return q === "" ? RUTA_ALUMNOS : `${RUTA_ALUMNOS}?${q}`;
}

type ParamsCrudos =
  | URLSearchParams
  | Readonly<Record<string, string | readonly string[] | undefined>>;

/**
 * Lee los filtros de la URL; un valor inválido o repetido se ignora (nunca error). Con
 * `secciones` (las del catálogo), una sección que no está en la lista también se ignora.
 */
export function leerFiltrosAlumnos(
  params: ParamsCrudos,
  secciones?: readonly SeccionId[],
): FiltrosAlumnos {
  const uno = (clave: string): string | undefined => {
    const v =
      params instanceof URLSearchParams ? params.get(clave) : params[clave];
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === "string" ? s.trim() : undefined;
  };
  const filtros: FiltrosAlumnos = {};
  const seccion = uno("seccion");
  if (esCodigoSeccion(seccion) && (!secciones || secciones.includes(seccion)))
    filtros.seccion = seccion;
  const estado = ESTADOS_ALUMNOS.find((e) => e === uno("estado"));
  if (estado) filtros.estado = estado;
  const tarea = uno("tarea");
  if (tarea && tarea.length <= 128 && !/[\s/]/.test(tarea))
    filtros.tarea = tarea;
  const alumno = uno("alumno");
  if (alumno && /^\d{7,9}$/.test(alumno)) filtros.alumno = alumno;
  return filtros;
}

/** Nota del alumno para el filtro: la de la tarea elegida o, sin tarea, la individual vigente. */
export function notaParaFiltro(
  a: Pick<FilaAlumno, "nota" | "notas">,
  tarea: string | undefined,
): number | null {
  if (!tarea) return a.nota;
  return a.notas?.[tarea] ?? null;
}

/**
 * Filas que cumplen `estado` (sobre la tarea, o la nota vigente sin tarea): evaluados = con nota,
 * raspados = nota < 10, pendientes = sin nota (D003). El alumno pedido por `alumno` se queda
 * siempre, para que su ficha sea visible en la lista.
 */
export function filtrarPorEstado<
  T extends Pick<FilaAlumno, "cedula" | "nota" | "notas">,
>(
  lista: readonly T[],
  estado: EstadoAlumnos | undefined,
  tarea: string | undefined,
  alumno?: string,
): T[] {
  if (!estado) return [...lista];
  return lista.filter((a) => {
    if (alumno && a.cedula === alumno) return true;
    const n = notaParaFiltro(a, tarea);
    if (estado === "pendientes") return n === null;
    if (estado === "evaluados") return n !== null;
    return n !== null && n < NOTA_APROBATORIA;
  });
}

const ESTADO_TEXTO: Record<EstadoAlumnos, [string, string]> = {
  evaluados: ["evaluado", "evaluados"],
  raspados: ["raspado", "raspados"],
  pendientes: ["pendiente", "pendientes"],
};

/**
 * Frase del contador cuando hay filtro de estado y no hay búsqueda:
 * "12 raspados en 5A · Identidad de marca", "Nadie raspado en 5A · Identidad de marca".
 */
export function contadorEstadoTexto(
  n: number,
  estado: EstadoAlumnos,
  seccion: SeccionId,
  tareaTitulo?: string,
): string {
  const [uno, varios] = ESTADO_TEXTO[estado];
  const cola = tareaTitulo ? ` · ${tareaTitulo}` : "";
  if (n === 0) return `Nadie ${uno} en ${seccion}${cola}`;
  return `${n} ${n === 1 ? uno : varios} en ${seccion}${cola}`;
}
