import type { Rol } from "@/lib/layout";

/*
 * Barra superior móvil por ruta (fase 05, D128). Puro: sin React ni router. `RouteTopBar` y
 * `RouteBottomNav` (components/layout/route-nav.tsx) la llaman con `usePathname()`.
 * La tabla cubre todas las rutas finales del brief de la fase 05, también las que aún no
 * tienen página: las olas siguientes solo crean páginas.
 *
 * Variantes (HANDOFF §2.7 y §3; lienzos *-movil):
 *   logo     logo 88 + avatar (estudiante) o Menú (profesor); listas y raíces.
 *   detalle  volver 44 + título h4; pantallas de detalle (Detalle de nota, Tarea, constructor).
 *   evaluar  X «Salir de la evaluación» + «Entrega n de m» + Menú (Evaluar entrega).
 * `enVivo` añade el chip «En vivo» (Ranking: en móvil vive en la topbar). `barraInferior: false`
 * esconde la barra inferior (constructor: «es una tarea en curso», §3). `soloAccion` deja a la
 * derecha solo la acción de la página (constructor: «Guardar borrador», sin Menú, lienzo
 * Constructor.dc.html).
 */

export type VarianteTopbar = "logo" | "detalle" | "evaluar";

export type Topbar = {
  variante: VarianteTopbar;
  /** Texto central (detalle y evaluar). */
  titulo?: string;
  /** Destino y nombre accesible del botón de la izquierda (detalle y evaluar). */
  volver?: { href: string; label: string };
  enVivo: boolean;
  barraInferior: boolean;
  soloAccion: boolean;
};

/**
 * Títulos que dependen de datos (título de la tarea, «Entrega n de m»), por `pathname` exacto.
 * Los arma el layout del grupo en el servidor desde `lib/demo/topbar.ts` (fase 07: Firestore)
 * y llegan al cliente como objeto serializable. Si falta la ruta, se usa el título de reserva.
 */
export type TitulosTopbar = Readonly<Record<string, string>>;

type Regla = {
  /** Patrón con segmentos dinámicos `[x]` (un segmento cada uno). */
  ruta: string;
  variante?: VarianteTopbar;
  /** Título fijo, o de reserva si la ruta está en `TitulosTopbar`. */
  titulo?: string;
  volver?: { href: string; label: string };
  enVivo?: boolean;
  sinBarraInferior?: boolean;
  soloAccion?: boolean;
  /** También sus subrutas (p. ej. pestañas del ranking como rutas, D095). */
  subrutas?: boolean;
};

// Copy de los lienzos: «Volver a Mis notas» (DetalleNota), «Volver a Tareas» (Constructor),
// «Salir de la evaluación» (Evaluar). PROVISIONAL: «Volver a Tareas» en /tareas/[tarea] (el
// lienzo Tarea dice «Volver» y va a Inicio; CONTENT_CHECKLIST fila 95) y los títulos de reserva
// sin dato (Mis notas, Tareas, Evaluar entrega; fila 96). Orden: lo estático antes que lo dinámico.
const ESTUDIANTE: readonly Regla[] = [
  { ruta: "/" },
  { ruta: "/notas" },
  {
    ruta: "/notas/[tarea]",
    variante: "detalle",
    titulo: "Mis notas",
    volver: { href: "/notas", label: "Volver a Mis notas" },
  },
  { ruta: "/tareas" },
  {
    ruta: "/tareas/[tarea]",
    variante: "detalle",
    titulo: "Tareas",
    volver: { href: "/tareas", label: "Volver a Tareas" },
  },
  { ruta: "/equipo" },
  { ruta: "/ranking", enVivo: true, subrutas: true },
  { ruta: "/perfil" },
];

const CONSTRUCTOR = {
  variante: "detalle",
  // Copy del lienzo: el borrador también es una tarea nueva hasta publicarla (vista D116)
  titulo: "Nueva tarea",
  volver: { href: "/profe/tareas", label: "Volver a Tareas" },
  sinBarraInferior: true,
  soloAccion: true,
} as const satisfies Omit<Regla, "ruta">;

const PROFESOR: readonly Regla[] = [
  { ruta: "/profe" },
  { ruta: "/profe/evaluar" },
  {
    ruta: "/profe/evaluar/[entrega]",
    variante: "evaluar",
    titulo: "Evaluar entrega",
    volver: { href: "/profe", label: "Salir de la evaluación" },
  },
  { ruta: "/profe/tareas" },
  { ruta: "/profe/tareas/nueva", ...CONSTRUCTOR },
  { ruta: "/profe/tareas/[id]", ...CONSTRUCTOR },
  { ruta: "/profe/alumnos" },
  { ruta: "/profe/equipos" },
  { ruta: "/profe/puntos" },
  { ruta: "/profe/premios" },
  { ruta: "/profe/ranking", enVivo: true, subrutas: true },
  { ruta: "/profe/perfil" },
];

/** Patrones de la tabla por rol (las pruebas comprueban que cubren las rutas finales). */
export function rutasTopbar(rol: Rol): readonly string[] {
  return (rol === "profesor" ? PROFESOR : ESTUDIANTE).map((r) => r.ruta);
}

const LOGO: Topbar = {
  variante: "logo",
  enVivo: false,
  barraInferior: true,
  soloAccion: false,
};

/**
 * Topbar móvil de `pathname` para el rol. Una ruta fuera de la tabla lleva la de logo con barra
 * inferior. Ignora la query, el hash y la barra final.
 */
export function topbarDe(
  rol: Rol,
  pathname: string | null | undefined,
  titulos: TitulosTopbar = {},
): Topbar {
  const path = normalizar(pathname ?? "/");
  const regla = (rol === "profesor" ? PROFESOR : ESTUDIANTE).find((r) =>
    coincide(r, path),
  );
  if (!regla) return LOGO;
  const variante = regla.variante ?? "logo";
  return {
    variante,
    ...(variante === "logo"
      ? {}
      : { titulo: titulos[path] ?? regla.titulo, volver: regla.volver }),
    enVivo: regla.enVivo ?? false,
    barraInferior: !regla.sinBarraInferior,
    soloAccion: regla.soloAccion ?? false,
  };
}

function coincide(regla: Regla, path: string): boolean {
  const patron = segmentos(regla.ruta);
  const partes = segmentos(path);
  if (partes.length < patron.length) return false;
  if (partes.length > patron.length && !regla.subrutas) return false;
  return patron.every(
    (p, i) => partes[i] === p || (p.startsWith("[") && p.endsWith("]")),
  );
}

function segmentos(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function normalizar(path: string): string {
  const limpio = path.split(/[?#]/)[0] ?? "";
  return limpio.length > 1 ? limpio.replace(/\/+$/, "") : limpio || "/";
}
