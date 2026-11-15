// Entrega ideal sobre Postgres (tanda 11-14 Z2, D430–D435). Sin `server-only` para que las pruebas
// la corran sobre PGlite; la app la usa desde lib/acciones/ideales.ts (después de
// `exigirSesion("profesor")`) y desde lib/datos/ideal.ts (después de la sesión del alumno o del
// profe). No toca entregas, notas ni ranking: la ideal solo apunta a una entrega o guarda el texto
// del profe.
import { eq } from "drizzle-orm";
import {
  entregaDeFila,
  equipoDeFila,
  tareaDeFila,
  validar,
} from "@/lib/data/filas";
import { leerUsuario } from "@/lib/data/usuarios";
import type { Db, Tx } from "@/lib/db";
import { entregas, equipos, ideales, tareas } from "@/lib/db/schema";
import {
  type AutorIdeal,
  alumnoPuedeVer,
  autorDe,
  type GuardarIdeal,
  type Ideal,
  type ResultadoIdeal,
  validarIdeal,
  vigencia,
  zIdeal,
} from "@/lib/ideal";
import type {
  Entrega,
  Equipo,
  SeccionId,
  Tarea,
  Usuario,
} from "@/lib/modelo";

type FilaIdeal = typeof ideales.$inferSelect;

export function idealDeFila(f: FilaIdeal): Ideal | null {
  return validar(zIdeal, "ideales", f.tareaId, f);
}

/** La ideal guardada de una tarea (valide o no su entrega: eso lo dice `vigencia`). */
export async function leerIdeal(db: Tx, tareaId: string): Promise<Ideal | null> {
  const [f] = await db
    .select()
    .from(ideales)
    .where(eq(ideales.tareaId, tareaId));
  return f ? idealDeFila(f) : null;
}

async function leerEntrega(db: Tx, id: string, paraActualizar = false) {
  const q = db.select().from(entregas).where(eq(entregas.id, id));
  const [f] = await (paraActualizar ? q.for("update") : q);
  return f ? entregaDeFila(f) : null;
}

/**
 * Guarda (o reemplaza: una por tarea) la ideal en UNA transacción: relee la tarea y, si parte de
 * una entrega, la bloquea (`FOR UPDATE`) para que nadie la corrija a menos de 20 mientras tanto.
 */
export async function guardarIdealEnTransaccion(
  db: Db,
  autorId: string,
  entrada: GuardarIdeal,
  ahora: number,
): Promise<ResultadoIdeal> {
  return db.transaction(async (tx): Promise<ResultadoIdeal> => {
    const [ft] = await tx
      .select()
      .from(tareas)
      .where(eq(tareas.id, entrada.tareaId));
    const tarea = ft ? tareaDeFila(ft) : null;
    if (ft && !tarea) return { ok: false, error: "invalida" };
    const entrega =
      entrada.forma.tipo === "entrega"
        ? await leerEntrega(tx, entrada.forma.entregaId, true)
        : null;
    const r = validarIdeal(entrada, tarea, entrega, autorId, ahora);
    if (!r.ok) return r;
    const fila: FilaIdeal = { ...r.ideal };
    await tx
      .insert(ideales)
      .values(fila)
      .onConflictDoUpdate({ target: ideales.tareaId, set: fila });
    return { ok: true };
  });
}

/** Quita la ideal de la tarea. Sin ideal también es éxito (otro profe ya la quitó). */
export async function quitarIdeal(db: Tx, tareaId: string): Promise<void> {
  await db.delete(ideales).where(eq(ideales.tareaId, tareaId));
}

/** Lo que necesita la página de la ideal del alumno. */
export type IdealDelAlumno = {
  tarea: { id: string } & Tarea;
  ideal: Ideal;
  /** La entrega del autor (solo sus respuestas se pintan); `null` si la escribió el profe. */
  entrega: ({ id: string } & Entrega) | null;
  autor: AutorIdeal;
};

/**
 * La ideal que ve un alumno de `seccion` (D433, D434): tarea publicada de su sección y ya no
 * abierta, ideal guardada y vigente. Cualquier otra cosa → `null` (la página responde 404). La
 * sección sale del perfil del alumno de la sesión, nunca del cliente.
 */
export async function idealDelAlumno(
  db: Tx,
  seccion: SeccionId | null,
  tareaId: string,
): Promise<IdealDelAlumno | null> {
  const [ft] = await db.select().from(tareas).where(eq(tareas.id, tareaId));
  const tarea = ft ? tareaDeFila(ft) : null;
  if (!tarea || tarea.estado === "borrador") return null;
  if (!alumnoPuedeVer(tarea, seccion)) return null;
  const ideal = await leerIdeal(db, tareaId);
  if (!ideal) return null;
  const entrega = ideal.entregaId
    ? await leerEntrega(db, ideal.entregaId)
    : null;
  if (vigencia(ideal, entrega) !== "vigente") return null;

  const usuarios = new Map<string, Usuario>();
  const equiposMap = new Map<string, Equipo>();
  if (entrega?.tipo === "individual") {
    const u = await leerUsuario(db, entrega.titularId);
    if (u) usuarios.set(u.cedula, u);
  } else if (entrega?.tipo === "grupal") {
    const [fe] = await db
      .select()
      .from(equipos)
      .where(eq(equipos.id, entrega.titularId));
    const eq0 = fe ? equipoDeFila(fe) : null;
    if (eq0) equiposMap.set(eq0.id, eq0);
  }
  return {
    tarea,
    ideal,
    entrega,
    autor: autorDe(ideal, entrega, usuarios, equiposMap),
  };
}
