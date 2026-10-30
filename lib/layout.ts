// Contenedor de contenido según rol y ancho (HANDOFF §4). Las clases son utilidades
// de app/globals.css; se escriben completas para que Tailwind las detecte.
export type Rol = "estudiante" | "profesor";
export type Ancho = "default" | "lectura";

export function containerClass(rol: Rol, ancho: Ancho = "default"): string {
  // Las pantallas de lectura del lienzo van alineadas al inicio, no centradas (D078)
  if (ancho === "lectura") return "container-reading-start";
  return rol === "profesor" ? "container-teacher" : "container-student";
}
