// Textos y lógica de Alumnos (HANDOFF §3 Alumnos, §2.15; lienzo design/canvas/Alumnos.dc.html).
// Lógica pura, sin React. D106–D109.

import type { DicebearEstilo } from "@/lib/dicebear";
import { BASE_MAX, BASE_MIN } from "@/lib/grades";
import { cedulaTexto } from "@/lib/perfil";

export type SeccionAlumnos = "5A" | "5C";

/** Una fila de la tabla: lo que la pantalla necesita ya resuelto (la fuente real llega en la fase 07). */
export type FilaAlumno = {
  cedula: string;
  seccion: SeccionAlumnos;
  nombres: string;
  apellidos: string;
  /** "5A-G2 Repostería"; `null` = "Sin equipo". */
  equipo: string | null;
  /** Base de evaluación 10–20 (D006). */
  base: number;
  /** Nota individual vigente; `null` = Pendiente (D003). */
  nota: number | null;
  /** Puntos del ranking (D007). */
  puntos: number;
  estilo: DicebearEstilo;
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
  seccion?: SeccionAlumnos,
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
export function seccionOpcionTexto(seccion: SeccionAlumnos, n: number): string {
  return `${seccion} · ${n}`;
}

/** Eyebrow del encabezado: "69 estudiantes · 2 secciones". */
export function resumenTexto(total: number, secciones: number): string {
  return `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${secciones} ${secciones === 1 ? "sección" : "secciones"}`;
}

/** Nombre accesible de la región desplazable de la tabla. */
export function tablaLabel(seccion: SeccionAlumnos): string {
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

/** Paso de la base (D004/D006). */
export const BASE_PASO = 0.5;

export type EdicionAlumno = {
  baseAnterior: number;
  baseNueva: number;
  motivo: string;
  nombres: string;
  apellidos: string;
};

export type ErroresEdicion = {
  nombres?: string;
  apellidos?: string;
  base?: string;
  motivo?: string;
};

/** ¿Cambió la base? Es lo único que vuelve obligatorio el motivo. */
export function baseCambio(baseAnterior: number, baseNueva: number): boolean {
  return baseAnterior !== baseNueva;
}

/**
 * Errores del formulario Editar (D071: al enviar). Motivo obligatorio **solo si la base cambió**;
 * nombres y apellidos no vacíos; base entre 10 y 20 en pasos de 0,5. `{}` = válido.
 */
export function validarEdicion(e: EdicionAlumno): ErroresEdicion {
  const errores: ErroresEdicion = {};
  if (e.nombres.trim() === "") errores.nombres = NOMBRES_VACIO;
  if (e.apellidos.trim() === "") errores.apellidos = APELLIDOS_VACIO;
  const baseValida =
    Number.isFinite(e.baseNueva) &&
    e.baseNueva >= BASE_MIN &&
    e.baseNueva <= BASE_MAX &&
    Number.isInteger(e.baseNueva / BASE_PASO);
  if (!baseValida) errores.base = BASE_INVALIDA;
  else if (baseCambio(e.baseAnterior, e.baseNueva) && e.motivo.trim() === "") {
    errores.motivo = MOTIVO_BASE_REQUERIDO;
  }
  return errores;
}

/** Une primer y segundo nombre (o apellido) sin dobles espacios: ("Jailyn", " Verónica") → "Jailyn Verónica". */
export function unirNombre(primero: string, segundo: string): string {
  return `${primero} ${segundo}`.replace(/\s+/g, " ").trim();
}
