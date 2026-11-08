// Sembrar y leer «documentos» de `lib/modelo` sobre las tablas de Postgres (D327): las pruebas que
// eran de los emuladores de Firestore se portan casi línea a línea. `poner` crea también la
// cuenta (`user`) de un perfil, como hacía Auth.
import { eq } from "drizzle-orm";
import { PROVEEDOR_CREDENCIAL } from "@/lib/data/cuentas";
import {
  ajusteDeFila,
  entregaDeFila,
  equipoDeFila,
  filaDeAjuste,
  filaDeEntrega,
  filaDeEquipo,
  filaDeTarea,
  tareaDeFila,
} from "@/lib/data/filas";
import { leerRanking } from "@/lib/data/ranking";
import { filaDeUsuario, usuarioDeFila } from "@/lib/data/usuarios";
import type { Db } from "@/lib/db";
import {
  account,
  ajustes,
  config,
  entregas,
  equipos,
  historialBase,
  operaciones,
  presencia,
  ranking,
  recuperaciones,
  tareas,
  user,
  usuarios,
} from "@/lib/db/schema";
import {
  type Ajuste,
  type CambioBase,
  type Entrega,
  type Equipo,
  emailInterno,
  type RankingSeccion,
  type TareaDoc,
  type Usuario,
} from "@/lib/modelo";

/** Cuenta mínima de Better Auth (sin contraseña) para que el perfil tenga a quién apuntar. */
export async function cuenta(db: Db, cedula: string, hash = "sin-hash") {
  await db
    .insert(user)
    .values({ id: cedula, name: cedula, email: emailInterno(cedula) })
    .onConflictDoNothing();
  await db
    .insert(account)
    .values({
      id: `cuenta-${cedula}`,
      accountId: cedula,
      providerId: PROVEEDOR_CREDENCIAL,
      userId: cedula,
      password: hash,
    })
    .onConflictDoNothing();
}

export async function ponerUsuario(
  db: Db,
  u: Usuario,
  email: string | null = null,
) {
  await cuenta(db, u.cedula);
  const fila = { ...filaDeUsuario(u), emailRecuperacion: email };
  await db
    .insert(usuarios)
    .values(fila)
    .onConflictDoUpdate({ target: usuarios.cedula, set: fila });
}

export async function ponerEquipo(db: Db, id: string, e: Equipo) {
  const fila = filaDeEquipo(id, e);
  await db
    .insert(equipos)
    .values(fila)
    .onConflictDoUpdate({ target: equipos.id, set: fila });
}

export async function ponerTarea(db: Db, id: string, t: TareaDoc) {
  const fila = filaDeTarea(id, t);
  await db
    .insert(tareas)
    .values(fila)
    .onConflictDoUpdate({ target: tareas.id, set: fila });
}

export async function ponerEntrega(db: Db, id: string, e: Entrega) {
  const fila = filaDeEntrega(id, e);
  await db
    .insert(entregas)
    .values(fila)
    .onConflictDoUpdate({ target: entregas.id, set: fila });
}

export async function ponerAjuste(db: Db, id: string, a: Ajuste) {
  const fila = filaDeAjuste(id, a);
  await db
    .insert(ajustes)
    .values(fila)
    .onConflictDoUpdate({ target: ajustes.id, set: fila });
}

export async function ponerRanking(db: Db, seccion: string, r: RankingSeccion) {
  await db
    .insert(ranking)
    .values({ seccion, ...r })
    .onConflictDoUpdate({ target: ranking.seccion, set: r });
}

export async function ponerConfig(
  db: Db,
  id: string,
  datos: Record<string, unknown>,
) {
  await db
    .insert(config)
    .values({ id, datos })
    .onConflictDoUpdate({ target: config.id, set: { datos } });
}

/* ---------- Lecturas (null = no existe o no valida) ---------- */

export async function usuario(db: Db, cedula: string): Promise<Usuario | null> {
  const [f] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula));
  return f ? usuarioDeFila(f) : null;
}

export async function emailDe(
  db: Db,
  cedula: string,
): Promise<string | null | undefined> {
  const [f] = await db
    .select({ e: usuarios.emailRecuperacion })
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula));
  return f ? f.e : undefined;
}

export async function existeCuenta(db: Db, cedula: string): Promise<boolean> {
  const [f] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, cedula));
  return f !== undefined;
}

export async function equipo(db: Db, id: string) {
  const [f] = await db.select().from(equipos).where(eq(equipos.id, id));
  return f ? equipoDeFila(f) : null;
}

export async function tarea(db: Db, id: string) {
  const [f] = await db.select().from(tareas).where(eq(tareas.id, id));
  return f ? tareaDeFila(f) : null;
}

export async function entrega(db: Db, id: string) {
  const [f] = await db.select().from(entregas).where(eq(entregas.id, id));
  return f ? entregaDeFila(f) : null;
}

export async function ajuste(db: Db, id: string) {
  const [f] = await db.select().from(ajustes).where(eq(ajustes.id, id));
  return f ? ajusteDeFila(f) : null;
}

export async function ajustesDe(db: Db, destinoId: string) {
  const filas = await db
    .select()
    .from(ajustes)
    .where(eq(ajustes.destinoId, destinoId));
  return filas.map(ajusteDeFila).filter((a) => a !== null);
}

export async function historialDe(
  db: Db,
  alumnoId: string,
): Promise<CambioBase[]> {
  const filas = await db
    .select()
    .from(historialBase)
    .where(eq(historialBase.alumnoId, alumnoId));
  return filas.map(({ id: _, ...c }) => c);
}

export const rankingDe = (db: Db, seccion: string) => leerRanking(db, seccion);

export async function recuperacionDe(db: Db, cedula: string) {
  const [f] = await db
    .select()
    .from(recuperaciones)
    .where(eq(recuperaciones.cedula, cedula));
  return f?.envios ?? null;
}

export async function presenciaDe(db: Db, alumnoId: string) {
  return db.select().from(presencia).where(eq(presencia.alumnoId, alumnoId));
}

/* ---------- Atajos con forma de Firestore (para portar las pruebas línea a línea) ---------- */

type Coleccion =
  | "usuarios"
  | "privados"
  | "equipos"
  | "tareas"
  | "entregas"
  | "ajustes"
  | "ranking"
  | "recuperaciones"
  | "operaciones"
  | "config";

/** El documento como lo devolvía Firestore (sin id), o `undefined` si no existe o no valida. */
export async function leerDoc(
  db: Db,
  col: Coleccion,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const sinId = <T extends { id: string } | null>(x: T) => {
    if (!x) return undefined;
    const { id: _, ...resto } = x;
    return resto as Record<string, unknown>;
  };
  switch (col) {
    case "usuarios":
      return (await usuario(db, id)) ?? undefined;
    case "privados": {
      const e = await emailDe(db, id);
      return e === undefined ? undefined : { email: e };
    }
    case "equipos":
      return sinId(await equipo(db, id));
    case "tareas":
      return sinId(await tarea(db, id));
    case "entregas":
      return sinId(await entrega(db, id));
    case "ajustes":
      return sinId(await ajuste(db, id));
    case "ranking":
      return (await rankingDe(db, id)) ?? undefined;
    case "recuperaciones": {
      const envios = await recuperacionDe(db, id);
      return envios ? { envios } : undefined;
    }
    case "config": {
      const [f] = await db.select().from(config).where(eq(config.id, id));
      return f?.datos;
    }
    case "operaciones": {
      const [f] = await db
        .select()
        .from(operaciones)
        .where(eq(operaciones.id, id));
      return f?.datos;
    }
  }
}

/** `{ exists, id, data(), get(campo) }` como un DocumentSnapshot. */
export async function snap(db: Db, col: Coleccion, id: string) {
  const d = await leerDoc(db, col, id);
  return {
    id,
    exists: d !== undefined,
    data: () => d,
    get: (campo: string) => d?.[campo],
  };
}

/** `set` de Firestore: reemplaza el documento entero. */
export async function ponerDoc(db: Db, col: Coleccion, id: string, v: unknown) {
  switch (col) {
    case "usuarios":
      return ponerUsuario(db, v as Usuario, (await emailDe(db, id)) ?? null);
    case "privados":
      return db
        .update(usuarios)
        .set({ emailRecuperacion: (v as { email: string | null }).email })
        .where(eq(usuarios.cedula, id));
    case "equipos":
      return ponerEquipo(db, id, v as Equipo);
    case "tareas":
      return ponerTarea(db, id, v as TareaDoc);
    case "entregas":
      return ponerEntrega(db, id, v as Entrega);
    case "ajustes":
      return ponerAjuste(db, id, v as Ajuste);
    case "ranking":
      return ponerRanking(db, id, v as RankingSeccion);
    case "recuperaciones":
      return db
        .insert(recuperaciones)
        .values({ cedula: id, envios: (v as { envios: number[] }).envios })
        .onConflictDoUpdate({
          target: recuperaciones.cedula,
          set: { envios: (v as { envios: number[] }).envios },
        });
    case "config":
      return ponerConfig(db, id, v as Record<string, unknown>);
    case "operaciones": {
      const datos = v as Record<string, unknown>;
      return db
        .insert(operaciones)
        .values({ id, datos })
        .onConflictDoUpdate({ target: operaciones.id, set: { datos } });
    }
  }
}

/** `update` de Firestore: mezcla campos en el documento que ya existe. */
export async function actualizarDoc(
  db: Db,
  col: Coleccion,
  id: string,
  campos: Record<string, unknown>,
) {
  const actual = await leerDoc(db, col, id);
  if (!actual) throw new Error(`${col}/${id} no existe`);
  await ponerDoc(db, col, id, { ...actual, ...campos });
}

export async function borrarDoc(db: Db, col: Coleccion, id: string) {
  const tabla = {
    usuarios: null,
    privados: null,
    equipos,
    tareas,
    entregas,
    ajustes,
    ranking,
    recuperaciones,
    config,
    operaciones,
  }[col];
  if (col === "usuarios") return db.delete(user).where(eq(user.id, id));
  if (col === "privados") return ponerDoc(db, "privados", id, { email: null });
  if (!tabla) return;
  const pk =
    tabla === ranking
      ? ranking.seccion
      : tabla === recuperaciones
        ? recuperaciones.cedula
        : (tabla as typeof equipos).id;
  await db.delete(tabla).where(eq(pk, id));
}
