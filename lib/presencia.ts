// Presencia al editar un alumno (W14, D275–D277). Puro (sin Firebase ni reloj): qué entradas de
// `presencia/{cedulaAlumno}/editores/{cedulaProfe}` siguen vivas y qué texto ven los demás profes.
// La escribe el navegador del profe (única excepción a D175, D275); un latido cada LATIDO_MS y,
// si el último tiene más de VIGENCIA_MS, la pestaña se da por muerta y la entrada se ignora.
import { z } from "zod";
import { zCedula } from "@/lib/modelo";

/** Cada cuánto el diálogo abierto renueva su entrada. */
export const LATIDO_MS = 20_000;
/** Más viejo que esto, la entrada se ignora (pestaña cerrada sin `pagehide`, sin red). */
export const VIGENCIA_MS = 45_000;
/** Cada cuánto se vuelve a mirar la vigencia sin que llegue una instantánea nueva. */
export const RELOJ_PRESENCIA_MS = 15_000;
/** Tope del nombre que el profe escribe en su entrada (las reglas lo repiten). */
export const NOMBRE_PRESENCIA_MAX = 120;

/** Una entrada ya leída: los timestamps del servidor pasados a ms. */
export const zEntradaPresencia = z.object({
  /** Cédula del profe (el id del documento). */
  profeId: z.string().min(1),
  nombre: z.string().trim().min(1).max(NOMBRE_PRESENCIA_MAX),
  desde: z.number().finite(),
  latido: z.number().finite(),
});
export type EntradaPresencia = z.infer<typeof zEntradaPresencia>;

/** ¿Sigue viva? Un latido «en el futuro» (reloj del navegador atrasado) cuenta como vivo. */
export function vigente(latido: number, ahora: number): boolean {
  return ahora - latido <= VIGENCIA_MS;
}

/**
 * Los OTROS profes que están editando a un alumno ahora: sin la entrada propia (otra pestaña mía
 * no es «otro profe»), sin las vencidas y en orden de llegada (el primero que abrió, primero).
 */
export function editoresVigentes(
  entradas: readonly EntradaPresencia[],
  ahora: number,
  yo: string,
): EntradaPresencia[] {
  return entradas
    .filter((e) => e.profeId !== yo && vigente(e.latido, ahora))
    .sort((a, b) => a.desde - b.desde || a.profeId.localeCompare(b.profeId));
}

/**
 * «Ana Pérez está editando» · «Ana Pérez y Luis Díaz están editando» · «Ana Pérez y 2 más están
 * editando». Vacío si no hay nadie. PROVISIONAL (fila 154).
 */
export function presenciaTexto(
  editores: ReadonlyArray<Pick<EntradaPresencia, "nombre">>,
): string {
  return quienes(editores, "editando");
}

/** «Ana Pérez está <verbo>» · «Ana Pérez y Luis Díaz están <verbo>» · «… y 2 más están <verbo>». */
function quienes(
  editores: ReadonlyArray<Pick<EntradaPresencia, "nombre">>,
  verbo: string,
): string {
  const [primero, segundo, ...resto] = editores;
  if (!primero) return "";
  if (!segundo) return `${primero.nombre} está ${verbo}`;
  if (resto.length === 0)
    return `${primero.nombre} y ${segundo.nombre} están ${verbo}`;
  return `${primero.nombre} y ${resto.length + 1} más están ${verbo}`;
}

/**
 * El aviso del diálogo: no bloquea, avisa. «Ana Pérez está editando a este alumno. Si guarda antes
 * que tú, te avisaremos.» PROVISIONAL (fila 154).
 */
export function avisoPresencia(texto: string): string {
  return texto
    ? `${texto} a este alumno. Si guarda antes que tú, te avisaremos.`
    : "";
}

/* ---------- Presencia en «Evaluar entrega» (pedido 8, D408–D410) ---------- */

// Misma tabla que la de alumnos: la entrega va en `alumno_id` con el prefijo «entrega:» (D408).
// Una cédula es `^\d{7,9}$`, así que nunca empieza así: las dos presencias no se mezclan.
const PREFIJO_ENTREGA = "entrega:";

/** Id de entrega (`tarea__titular`, ids automáticos): el patrón de `zIdDocumento` (lib/evaluar-datos). */
export const zIdEntrega = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,200}$/, "Id inválido");

/** La clave de presencia de una entrega: `entrega:<id>`. */
export function claveEntrega(id: string): string {
  return PREFIJO_ENTREGA + id;
}

export function esClaveEntrega(clave: string): boolean {
  return clave.startsWith(PREFIJO_ENTREGA);
}

/** El id de la entrega de una clave `entrega:<id>`; `null` si es la de un alumno. */
export function entregaDeClave(clave: string): string | null {
  return esClaveEntrega(clave) ? clave.slice(PREFIJO_ENTREGA.length) : null;
}

const zAccion = z.enum(["marcar", "quitar"]);

/**
 * Lo que manda el navegador a /api/presencia: o un alumno (`cedula`, «Editar alumno») o una
 * entrega (`entrega`, «Evaluar»). Nunca los dos: `strict` rechaza el pedido ambiguo.
 */
export const zPedidoPresencia = z.union([
  z.object({ accion: zAccion, cedula: zCedula }).strict(),
  z.object({ accion: zAccion, entrega: zIdEntrega }).strict(),
]);
export type PedidoPresencia = z.infer<typeof zPedidoPresencia>;

/** La fila de `presencia` que toca un pedido: la cédula del alumno o `entrega:<id>`. */
export function claveDePedido(p: PedidoPresencia): string {
  return "cedula" in p ? p.cedula : claveEntrega(p.entrega);
}

/**
 * «Ana Pérez está evaluando» · «Ana Pérez y Luis Díaz están evaluando» · «Ana Pérez y 2 más están
 * evaluando». Vacío si no hay nadie. PROVISIONAL (fila 217).
 */
export function presenciaEvaluarTexto(
  evaluadores: ReadonlyArray<Pick<EntradaPresencia, "nombre">>,
): string {
  return quienes(evaluadores, "evaluando");
}

/**
 * El aviso de Evaluar: no bloquea, avisa (D410). «Ana Pérez está evaluando esta entrega. Si guarda
 * antes que tú, te avisaremos.» El «te avisaremos» es el error `cambio` de Guardar (D224).
 * PROVISIONAL (fila 217).
 */
export function avisoPresenciaEntrega(texto: string): string {
  return texto
    ? `${texto} esta entrega. Si guarda antes que tú, te avisaremos.`
    : "";
}

/** El aviso de Evaluar sale como toast (D450): el doble de los 4 s normales, para leerlo entero. */
export const AVISO_PRESENCIA_MS = 8_000;

/**
 * Profes que acaban de llegar a la entrega: los de `actuales` que no estaban en `vistos` (sin
 * repetir, en orden de llegada). Uno por llegada (D450): quien ya avisó no vuelve a avisar en cada
 * sondeo, y si se van todos no hay nada que avisar.
 */
export function llegadasPresencia<T extends Pick<EntradaPresencia, "profeId">>(
  vistos: ReadonlySet<string>,
  actuales: readonly T[],
): T[] {
  const nuevos = new Map<string, T>();
  for (const e of actuales)
    if (!vistos.has(e.profeId) && !nuevos.has(e.profeId))
      nuevos.set(e.profeId, e);
  return [...nuevos.values()];
}

/** Cómo se ve el profe en la presencia: primer nombre + primer apellido («Ana Pérez»). */
export function nombrePresencia(
  u: { nombres: string; apellidos: string } | null,
): string {
  const primero = (s: string) => s.trim().split(/\s+/)[0] ?? "";
  const nombre = u
    ? `${primero(u.nombres)} ${primero(u.apellidos)}`.trim()
    : "";
  // Sin perfil legible: un nombre genérico antes que una entrada inválida
  return (nombre || "Otro profe").slice(0, NOMBRE_PRESENCIA_MAX);
}

/** Agrupa las entradas por alumno (la cédula sale de la ruta del documento). */
export function porAlumno(
  docs: ReadonlyArray<{ alumnoId: string; entrada: EntradaPresencia }>,
): Map<string, EntradaPresencia[]> {
  const m = new Map<string, EntradaPresencia[]>();
  for (const { alumnoId, entrada } of docs) {
    const lista = m.get(alumnoId);
    if (lista) lista.push(entrada);
    else m.set(alumnoId, [entrada]);
  }
  return m;
}
