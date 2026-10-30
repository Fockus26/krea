import type { Rol } from "@/lib/layout";

/*
 * Ítems de navegación por rol y superficie (HANDOFF §2.7 y §2.13). Puro: sin React ni lucide.
 * `icon` es una clave que components/layout/nav-icon.tsx traduce al ícono; las constantes
 * viven aquí y no en un archivo cliente (Next 16 rompe el prerender si no).
 */
export type NavIconKey =
  | "inicio"
  | "notas"
  | "tareas"
  | "ranking"
  | "equipo"
  | "perfil"
  | "panel"
  | "evaluar"
  | "alumnos"
  | "equipos"
  | "puntos"
  | "premios";

export type NavSurface = "lateral" | "inferior" | "menu";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
  /** `exact`: solo esa ruta (raíz de cada rol). `prefix`: también sus subrutas. */
  match: "exact" | "prefix";
  /** Superficies donde aparece. */
  on: readonly NavSurface[];
};

const ESTUDIANTE: readonly NavItem[] = [
  {
    id: "inicio",
    label: "Inicio",
    href: "/",
    icon: "inicio",
    match: "exact",
    on: ["lateral", "inferior"],
  },
  {
    id: "notas",
    label: "Notas",
    href: "/notas",
    icon: "notas",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/tareas",
    icon: "tareas",
    match: "prefix",
    on: ["lateral"],
  },
  {
    id: "ranking",
    label: "Ranking",
    href: "/ranking",
    icon: "ranking",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "equipo",
    label: "Equipo",
    href: "/equipo",
    icon: "equipo",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "perfil",
    label: "Perfil",
    href: "/perfil",
    icon: "perfil",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
];

const PROFESOR: readonly NavItem[] = [
  {
    id: "panel",
    label: "Panel",
    href: "/profe",
    icon: "panel",
    match: "exact",
    on: ["lateral", "inferior"],
  },
  {
    id: "evaluar",
    label: "Evaluar",
    href: "/profe/evaluar",
    icon: "evaluar",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/profe/tareas",
    icon: "tareas",
    match: "prefix",
    on: ["lateral", "menu"],
  },
  {
    id: "alumnos",
    label: "Alumnos",
    href: "/profe/alumnos",
    icon: "alumnos",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "equipos",
    label: "Equipos",
    href: "/profe/equipos",
    icon: "equipos",
    match: "prefix",
    on: ["lateral", "menu"],
  },
  {
    id: "puntos",
    label: "Puntos",
    href: "/profe/puntos",
    icon: "puntos",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "ranking",
    label: "Ranking",
    href: "/ranking",
    icon: "ranking",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "premios",
    label: "Premios",
    href: "/profe/premios",
    icon: "premios",
    match: "prefix",
    on: ["lateral", "menu"],
  },
];

/** Ítems de un rol para una superficie, en el orden del handoff. */
export function navItems(rol: Rol, surface: NavSurface): readonly NavItem[] {
  const items = rol === "profesor" ? PROFESOR : ESTUDIANTE;
  return items.filter((item) => item.on.includes(surface));
}

/** Ruta de Perfil (tarjeta de usuario y avatar de la topbar). Solo el estudiante la tiene. */
export const PERFIL_HREF = "/perfil";

/** Etiqueta de rol de la tarjeta de usuario. */
export function rolLabel(rol: Rol): string {
  return rol === "profesor" ? "Profesor" : "Estudiante";
}

/**
 * ¿`pathname` cae dentro del ítem? Ruta exacta para la raíz de cada rol (`/`, `/profe`) y
 * prefijo con frontera de segmento para el resto: `/notas/x` activa Notas, `/notasx` no.
 * Ignora la query, el hash y la barra final.
 */
export function isActive(
  item: Pick<NavItem, "href" | "match">,
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalize(pathname);
  const href = normalize(item.href);
  if (item.match === "exact") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? "";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean || "/";
}

/** Texto accesible del contador de Evaluar; `null` si no hay nada que anunciar. */
export function counterLabel(count: number | null | undefined): string | null {
  if (count == null || count <= 0) return null;
  return `${count} por evaluar`;
}
