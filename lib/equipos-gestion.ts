// Crear, editar y eliminar equipos desde Equipos (W12, D270–D271). Puro (sin Firebase ni reloj): lo
// que mandan los diálogos, el documento nuevo, la regla de nombre repetido y cuándo un equipo NO
// se puede eliminar (tiene integrantes, entregas grupales o ajustes: borrarlo perdería datos).
import { z } from "zod";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { type Equipo, type SeccionId, zEquipo, zSeccion } from "@/lib/modelo";

/** Tema vacío = sin tema (`null`, «Sin tema elegido»). */
const zTemaEntrada = z
  .string()
  .trim()
  .max(60)
  .transform((v) => (v === "" ? null : v));

const zDatosEquipo = z.object({
  nombre: zEquipo.shape.nombre,
  tema: zTemaEntrada,
});

/** «Nuevo equipo»: la sección es la de la página (5A/5C). */
export const zCrearEquipo = zDatosEquipo.extend({ seccion: zSeccion });
export type CrearEquipo = z.input<typeof zCrearEquipo>;
export type EquipoACrear = z.output<typeof zCrearEquipo>;

/** «Editar equipo»: nombre y tema (la sección no cambia: sus integrantes son de ella). */
export const zEditarEquipo = zDatosEquipo.extend({ equipoId: zIdDocumento });
export type EditarEquipo = z.input<typeof zEditarEquipo>;
export type EquipoAEditar = z.output<typeof zEditarEquipo>;

/** Documento de un equipo nuevo: sin capitán ni logo hasta que tenga integrantes (D111). */
export function equipoNuevo(d: EquipoACrear): Equipo {
  return {
    nombre: d.nombre,
    seccion: d.seccion,
    tema: d.tema,
    capitanId: null,
    logoPath: null,
  };
}

const clave = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es");

/**
 * ¿Ya hay en la sección otro equipo con ese nombre? Sin distinguir mayúsculas, tildes ni espacios
 * dobles: dos «Repostería» en 5A confundirían el ranking y el menú «Mover a…».
 */
export function nombreRepetido(
  nombre: string,
  equipos: ReadonlyArray<{ id: string; nombre: string; seccion: SeccionId }>,
  seccion: SeccionId,
  excepto?: string,
): boolean {
  const k = clave(nombre);
  return equipos.some(
    (e) => e.seccion === seccion && e.id !== excepto && clave(e.nombre) === k,
  );
}

/** Por qué un equipo no se puede eliminar (`null`: sí se puede). */
export type BloqueoEquipo =
  | { motivo: "integrantes"; n: number }
  | { motivo: "entregas"; n: number }
  | { motivo: "ajustes"; n: number };

/**
 * Solo se elimina un equipo vacío, sin entregas grupales (su nota y su premio, D012) y sin ajustes
 * de puntos (D007): así borrarlo nunca se lleva datos. Se mira en ese orden.
 */
export function bloqueoEliminar(c: {
  integrantes: number;
  entregas: number;
  ajustes: number;
}): BloqueoEquipo | null {
  if (c.integrantes > 0) return { motivo: "integrantes", n: c.integrantes };
  if (c.entregas > 0) return { motivo: "entregas", n: c.entregas };
  if (c.ajustes > 0) return { motivo: "ajustes", n: c.ajustes };
  return null;
}

export type ErrorGestionEquipo =
  | "invalida"
  | "no-existe"
  | "repetido"
  | "integrantes"
  | "entregas"
  | "ajustes"
  | "red";

export type ResultadoGestionEquipo =
  | { ok: true; id: string }
  | { ok: false; error: ErrorGestionEquipo };

/* Textos. PROVISIONAL (CONTENT_CHECKLIST fila 149): los diálogos no están en el lienzo */

export const NOMBRE_EQUIPO_VACIO = "Escribe el nombre del equipo.";
export const TEMA_AYUDA =
  "Opcional. Si aún no lo eligen, déjalo vacío: dirá «Sin tema elegido».";

export function validarEquipo(f: { nombre: string; tema: string }): {
  nombre?: string;
  tema?: string;
} {
  const e: { nombre?: string; tema?: string } = {};
  if (f.nombre.trim() === "") e.nombre = NOMBRE_EQUIPO_VACIO;
  else if (f.nombre.trim().length > 80)
    e.nombre = "El nombre va hasta 80 caracteres.";
  if (f.tema.trim().length > 60) e.tema = "El tema va hasta 60 caracteres.";
  return e;
}

export function bloqueoTexto(b: BloqueoEquipo): string {
  switch (b.motivo) {
    case "integrantes":
      return `Tiene ${b.n === 1 ? "1 integrante" : `${b.n} integrantes`}. Muévelos a otro equipo o a «Sin equipo» y luego elimínalo.`;
    case "entregas":
      return `Tiene ${b.n === 1 ? "1 entrega grupal" : `${b.n} entregas grupales`}: sus notas se perderían. Un equipo con entregas no se elimina.`;
    case "ajustes":
      return `Tiene ${b.n === 1 ? "1 ajuste" : `${b.n} ajustes`} de puntos: se perderían. Un equipo con ajustes no se elimina.`;
  }
}

export function errorGestionEquipoTexto(
  e: ErrorGestionEquipo,
  seccion?: SeccionId,
): string {
  switch (e) {
    case "repetido":
      return `Ya hay un equipo con ese nombre${seccion ? ` en ${seccion}` : ""}.`;
    case "no-existe":
      return "Ese equipo ya no existe. Recarga la página.";
    case "integrantes":
      return "Ahora tiene integrantes: sácalos antes de eliminarlo.";
    case "entregas":
      return "Tiene entregas grupales: no se elimina.";
    case "ajustes":
      return "Tiene ajustes de puntos: no se elimina.";
    case "invalida":
      return "Revisa los datos: algo no se pudo guardar así.";
    case "red":
      return "Se perdió la conexión. No cambiamos nada: vuelve a intentarlo.";
  }
}

export const creadoEquipoTexto = (nombre: string) =>
  `Creaste el equipo ${nombre}`;
export const eliminadoEquipoTexto = (nombre: string) =>
  `Eliminaste el equipo ${nombre}`;
