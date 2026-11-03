// Contenedor de contenido según rol y ancho (HANDOFF §4). Las clases son utilidades
// de app/globals.css; se escriben completas para que Tailwind las detecte.
export type Rol = "estudiante" | "profesor";
export type Ancho = "default" | "lectura";

export function containerClass(rol: Rol, ancho: Ancho = "default"): string {
  // Las pantallas de lectura del lienzo van alineadas al inicio, no centradas (D078)
  if (ancho === "lectura") return "container-reading-start";
  return rol === "profesor" ? "container-teacher" : "container-student";
}

/** Clases del `<main id="contenido">` del shell: contenedor, padding y ritmo de §4. */
export function mainClass(rol: Rol, ancho: Ancho = "default"): string {
  return `${containerClass(rol, ancho)} page-pad page-stack flex-1`;
}

// Pantallas `wrap-narrow` del lienzo (HANDOFF §3): Mis notas, Detalle, Tareas, Tarea y Perfil.
// El Perfil del profe reutiliza Apariencia y Seguridad del Perfil (decisión de César, fase 05).
const LECTURA: Readonly<Record<Rol, readonly string[]>> = {
  estudiante: ["/notas", "/tareas", "/perfil"],
  profesor: ["/profe/perfil"],
};

/**
 * Ancho del contenido de una ruta (D129): el shell vive en el layout del grupo y no sabe qué
 * página monta, así que lo decide por `pathname` (con sus subrutas). Ignora query y hash.
 */
export function anchoDe(rol: Rol, pathname: string | null | undefined): Ancho {
  const path = (pathname ?? "/").split(/[?#]/)[0] ?? "/";
  return LECTURA[rol].some((r) => path === r || path.startsWith(`${r}/`))
    ? "lectura"
    : "default";
}
