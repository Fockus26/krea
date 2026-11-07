// Crear, editar y eliminar equipos desde Equipos (W12, D270, D307). Puro (sin Firebase ni reloj):
// lo que mandan los diálogos, el documento nuevo, la regla de nombre repetido y lo que arrastra
// eliminar un equipo (sus integrantes, entregas grupales y ajustes), para avisarlo antes.
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

/** Lo que arrastra eliminar un equipo (D307): cuántos integrantes, entregas grupales y ajustes. */
export type ConsecuenciasEliminar = {
  integrantes: number;
  entregas: number;
  ajustes: number;
};

/**
 * Un equipo siempre se puede eliminar (D307, reemplaza a D271): sus integrantes quedan «Sin
 * equipo», sus entregas grupales se quedan (la nota es de cada integrante, D012) y sus ajustes de
 * puntos se borran (eran del equipo, D007). Esto solo normaliza los recuentos para el diálogo.
 */
export function consecuenciasEliminar(c: {
  integrantes: number;
  entregas: number;
  ajustes: number;
}): ConsecuenciasEliminar {
  const n = (x: number) => (Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
  return {
    integrantes: n(c.integrantes),
    entregas: n(c.entregas),
    ajustes: n(c.ajustes),
  };
}

/** Lo que arrastran varios equipos juntos (lote, D315): la suma de cada recuento. */
export function sumarConsecuencias(
  cs: readonly ConsecuenciasEliminar[],
): ConsecuenciasEliminar {
  return consecuenciasEliminar(
    cs.reduce(
      (t, c) => ({
        integrantes: t.integrantes + c.integrantes,
        entregas: t.entregas + c.entregas,
        ajustes: t.ajustes + c.ajustes,
      }),
      { integrantes: 0, entregas: 0, ajustes: 0 },
    ),
  );
}

/**
 * Escrituras de la transacción de eliminar: un perfil por integrante, `titularNombre` en cada
 * entrega grupal, un borrado por ajuste, el equipo y el ranking. Tope de Firestore: 500.
 */
export const escriturasEliminarEquipo = (c: ConsecuenciasEliminar) =>
  c.integrantes + c.entregas + c.ajustes + 2;

export type ErrorGestionEquipo =
  | "invalida"
  | "no-existe"
  | "repetido"
  | "demasiados"
  | "sesiones"
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

/** «a», «a y b», «a, b y c». */
function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

const contar = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

/**
 * Texto del diálogo de eliminar (D307): qué tiene y qué pasa con cada cosa, con números. «Tiene 3
 * integrantes, 2 entregas grupales y 1 ajuste: los integrantes quedan sin equipo, las notas se
 * quedan con cada alumno y el ajuste se borra.» Solo nombra lo que tiene. `varios`: la del lote
 * (D315: «Tienen…», «sus logos»). PROVISIONAL (lote: CONTENT_CHECKLIST fila 165).
 */
export function consecuenciasTexto(
  c: ConsecuenciasEliminar,
  varios = false,
): string {
  const tiene: string[] = [];
  const pasa: string[] = [];
  if (c.integrantes > 0) {
    tiene.push(contar(c.integrantes, "integrante", "integrantes"));
    pasa.push(
      c.integrantes === 1
        ? "el integrante queda sin equipo"
        : "los integrantes quedan sin equipo",
    );
  }
  if (c.entregas > 0) {
    tiene.push(contar(c.entregas, "entrega grupal", "entregas grupales"));
    pasa.push(
      c.entregas === 1
        ? "la nota se queda con cada alumno"
        : "las notas se quedan con cada alumno",
    );
  }
  if (c.ajustes > 0) {
    tiene.push(contar(c.ajustes, "ajuste", "ajustes"));
    pasa.push(c.ajustes === 1 ? "el ajuste se borra" : "los ajustes se borran");
  }
  const cierre = varios
    ? "Se borran también sus logos. No se puede deshacer."
    : "Se borra también su logo. No se puede deshacer.";
  const tener = varios ? "tienen" : "tiene";
  if (tiene.length === 0)
    return `No ${tener} integrantes, entregas grupales ni ajustes: no se pierde ninguna nota. ${cierre}`;
  return `${varios ? "Tienen" : "Tiene"} ${enumerar(tiene)}: ${enumerar(pasa)}. ${cierre}`;
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
    case "demasiados":
      return "Tiene demasiados datos para eliminarlo de una vez. No cambiamos nada: avísale al administrador.";
    case "sesiones":
      return "Se eliminó, pero no pudimos cerrar la sesión de algunos integrantes. Muévelos otra vez a «Sin equipo» para reintentarlo.";
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
