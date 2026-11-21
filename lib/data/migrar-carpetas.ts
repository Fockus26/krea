// Mueve las imágenes de entrega de la carpeta vieja (SHA-256 del id, sin secreto) a la nueva (HMAC
// con el secreto, D512) y actualiza las rutas guardadas (D513). Lo corre César con
// `scripts/migrar-carpetas-b2.ts`; aquí está la lógica, con la base y el almacén inyectados para
// probarla sobre PGlite con un almacén falso.
//
// Por entrega: 1) copia en B2 cada objeto viejo a su ruta nueva (si la nueva ya existe, salta);
// 2) en UNA transacción (con la tarea bloqueada, como el envío) cambia las rutas en
// `entregas.respuestas` y `partes.respuesta`; 3) solo después del commit borra los objetos viejos.
// Idempotente: lo que ya está en la carpeta nueva no se toca, así que volver a correrlo reanuda y,
// una vez terminado, no mueve nada. Una ruta vieja que llegue después (un formulario abierto antes,
// D514) la recoge la siguiente pasada.
import { and, eq, isNotNull } from "drizzle-orm";
import type { Almacen } from "@/lib/almacen/s3";
import { type CarpetaDe, carpetaEntregaLegada } from "@/lib/carpeta-entrega";
import type { Db } from "@/lib/db";
import { entregas, partes, tareas } from "@/lib/db/schema";
import { partesDeImagen } from "@/lib/entregas";

export type AlmacenMigracion = Pick<Almacen, "existe" | "copiar" | "borrar">;

/** Una imagen que cambia de carpeta. */
export type Movida = { de: string; a: string };

/** Lo que va pasando; el script lo escribe en el registro (una línea JSON por evento). */
export type EventoMigracion =
  | { tipo: "plan"; entregaId: string; tareaId: string; movidas: Movida[] }
  | {
      tipo: "actualizada";
      entregaId: string;
      movidas: number;
      /** Ni la vieja ni la nueva existían: la ruta pasa a la nueva igual (no hay imagen que salvar). */
      faltaban: string[];
      /** Objetos viejos que se borran después del commit. */
      borrar: string[];
    }
  | { tipo: "borradas"; rutas: string[] }
  | { tipo: "error"; entregaId: string | null; motivo: string };

export type OpcionesMigracion = {
  db: Db;
  /** Sin almacén solo se puede ensayar. */
  almacen: AlmacenMigracion | null;
  /** La carpeta nueva, con el MISMO secreto que la app de esa base. */
  carpetaNueva: CarpetaDe;
  carpetaVieja?: CarpetaDe;
  /** `false` (ensayo): lista lo que movería y no escribe ni llama a B2. */
  aplicar: boolean;
  /** Objetos viejos que una corrida anterior no llegó a borrar (del registro). */
  pendientes?: readonly string[];
  /**
   * `false`: copia y cambia rutas pero no borra los objetos viejos (bucket compartido con otra base
   * que aún los usa). Quedan huérfanos: ninguna fila los nombra y nadie firma su URL.
   */
  borrar?: boolean;
  registrar?: (e: EventoMigracion) => void;
};

export type ResumenMigracion = {
  /** Entregas (o repartos de partes) con alguna imagen. */
  entregas: number;
  /** De ellas, con alguna ruta en la carpeta vieja. */
  conViejas: number;
  /** Rutas en la carpeta vieja (las que se mueven o se moverían). */
  viejas: number;
  /** Rutas que ya están en la carpeta nueva: si hay, el secreto es el de la app. */
  enNueva: number;
  /** Rutas en una carpeta que no es ni la vieja ni la nueva: ¿otro secreto? */
  ajenas: number;
  actualizadas: number;
  faltaban: number;
  borradas: number;
  /** Objetos viejos que quedaron sin borrar (van al registro para la próxima corrida). */
  sinBorrar: string[];
  errores: number;
};

type Fila = { tareaId: string; rutas: Set<string> };

/** Rutas de imagen de una respuesta guardada en jsonb (sin validar: lee lo que haya). */
export function rutasGuardadas(valor: unknown): string[] {
  if (!valor || typeof valor !== "object") return [];
  const o = valor as { imagenPath?: unknown; imagenPaths?: unknown };
  if (typeof o.imagenPath === "string") return [o.imagenPath];
  if (Array.isArray(o.imagenPaths))
    return o.imagenPaths.filter((r): r is string => typeof r === "string");
  return [];
}

/** La respuesta con sus rutas cambiadas según `mapa`; lo demás, igual. */
export function conRutas(
  valor: unknown,
  mapa: ReadonlyMap<string, string>,
): unknown {
  if (!valor || typeof valor !== "object") return valor;
  const o = valor as Record<string, unknown>;
  if (typeof o.imagenPath === "string")
    return { ...o, imagenPath: mapa.get(o.imagenPath) ?? o.imagenPath };
  if (Array.isArray(o.imagenPaths))
    return {
      ...o,
      imagenPaths: o.imagenPaths.map((r) =>
        typeof r === "string" ? (mapa.get(r) ?? r) : r,
      ),
    };
  return valor;
}

/** Cada entrega (o reparto de partes aún sin entrega) con las rutas de imagen que guarda. */
async function rutasPorEntrega(db: Db): Promise<Map<string, Fila>> {
  const out = new Map<string, Fila>();
  const sumar = (entregaId: string, tareaId: string, rutas: string[]) => {
    if (rutas.length === 0) return;
    const f = out.get(entregaId) ?? { tareaId, rutas: new Set<string>() };
    for (const r of rutas) f.rutas.add(r);
    out.set(entregaId, f);
  };
  const filasEntregas = await db
    .select({
      id: entregas.id,
      tareaId: entregas.tareaId,
      respuestas: entregas.respuestas,
    })
    .from(entregas);
  for (const e of filasEntregas)
    sumar(e.id, e.tareaId, Object.values(e.respuestas).flatMap(rutasGuardadas));
  const filasPartes = await db
    .select({
      entregaId: partes.entregaId,
      tareaId: partes.tareaId,
      respuesta: partes.respuesta,
    })
    .from(partes)
    .where(isNotNull(partes.respuesta));
  for (const p of filasPartes)
    sumar(p.entregaId, p.tareaId, rutasGuardadas(p.respuesta));
  return out;
}

/** Ruta en la carpeta `desde` → la misma imagen en `hacia`; `null` si no es de esa carpeta. */
function enCarpeta(
  ruta: string,
  tareaId: string,
  desde: string,
  hacia: string,
): string | null {
  const p = partesDeImagen(ruta);
  if (!p || p.tareaId !== tareaId || p.carpeta !== desde) return null;
  return `entregas/${tareaId}/${hacia}/${p.uuid}.jpg`;
}

/**
 * Copia (si hace falta) cada imagen a la carpeta nueva. Un texto (el motivo) si B2 no respondió:
 * la entrega se deja para la próxima corrida, sin tocar la base.
 */
async function copiarTodas(
  almacen: AlmacenMigracion,
  movidas: readonly Movida[],
): Promise<{ borrar: string[]; faltaban: string[] } | string> {
  const borrar: string[] = [];
  const faltaban: string[] = [];
  for (const m of movidas) {
    const nueva = await almacen.existe(m.a);
    if (!nueva.ok) return `existe(nueva): ${nueva.error}`;
    const vieja = await almacen.existe(m.de);
    if (!vieja.ok) return `existe(vieja): ${vieja.error}`;
    if (!nueva.existe) {
      if (!vieja.existe) {
        faltaban.push(m.de);
        continue;
      }
      const c = await almacen.copiar(m.de, m.a);
      if (!c.ok) return `copiar: ${c.error}`;
    }
    if (vieja.existe) borrar.push(m.de);
  }
  return { borrar, faltaban };
}

/** Cambia las rutas de la entrega y de sus partes en una transacción; cuántas filas cambiaron. */
async function actualizarRutas(
  db: Db,
  entregaId: string,
  tareaId: string,
  mapa: ReadonlyMap<string, string>,
): Promise<number> {
  return db.transaction(async (tx) => {
    // El mismo orden de bloqueo que el envío y las partes (tarea primero): sin interbloqueos
    await tx
      .select({ id: tareas.id })
      .from(tareas)
      .where(eq(tareas.id, tareaId))
      .for("update");
    let cambiadas = 0;
    const [e] = await tx
      .select({ respuestas: entregas.respuestas })
      .from(entregas)
      .where(eq(entregas.id, entregaId))
      .for("update");
    if (e) {
      const nuevas = Object.fromEntries(
        Object.entries(e.respuestas).map(([k, v]) => [k, conRutas(v, mapa)]),
      );
      if (JSON.stringify(nuevas) !== JSON.stringify(e.respuestas)) {
        await tx
          .update(entregas)
          .set({ respuestas: nuevas })
          .where(eq(entregas.id, entregaId));
        cambiadas++;
      }
    }
    const filas = await tx
      .select({ preguntaId: partes.preguntaId, respuesta: partes.respuesta })
      .from(partes)
      .where(eq(partes.entregaId, entregaId))
      .for("update");
    for (const f of filas) {
      const nueva = conRutas(f.respuesta, mapa);
      if (JSON.stringify(nueva) === JSON.stringify(f.respuesta)) continue;
      await tx
        .update(partes)
        .set({ respuesta: nueva as typeof f.respuesta })
        .where(
          and(
            eq(partes.entregaId, entregaId),
            eq(partes.preguntaId, f.preguntaId),
          ),
        );
      cambiadas++;
    }
    return cambiadas;
  });
}

/** Borra objetos viejos; los que no se pudieron vuelven para el registro. */
async function borrarViejas(
  almacen: AlmacenMigracion,
  rutas: readonly string[],
): Promise<{ borradas: string[]; sinBorrar: string[] }> {
  const borradas: string[] = [];
  const sinBorrar: string[] = [];
  for (const r of rutas) {
    const b = await almacen.borrar(r);
    (b.ok ? borradas : sinBorrar).push(r);
  }
  return { borradas, sinBorrar };
}

export async function migrarCarpetas(
  o: OpcionesMigracion,
): Promise<ResumenMigracion> {
  const vieja = o.carpetaVieja ?? carpetaEntregaLegada;
  const registrar = o.registrar ?? (() => {});
  const conBorrar = o.borrar ?? true;
  const r: ResumenMigracion = {
    entregas: 0,
    conViejas: 0,
    viejas: 0,
    enNueva: 0,
    ajenas: 0,
    actualizadas: 0,
    faltaban: 0,
    borradas: 0,
    sinBorrar: [],
    errores: 0,
  };
  if (o.aplicar && !o.almacen) throw new Error("Sin almacén B2 no se aplica");

  const porEntrega = await rutasPorEntrega(o.db);
  for (const [entregaId, { tareaId, rutas }] of porEntrega) {
    r.entregas++;
    const cv = vieja(entregaId);
    const cn = o.carpetaNueva(entregaId);
    const movidas: Movida[] = [];
    for (const ruta of rutas) {
      const a = enCarpeta(ruta, tareaId, cv, cn);
      if (a) movidas.push({ de: ruta, a });
      else if (enCarpeta(ruta, tareaId, cn, cn)) r.enNueva++;
      else r.ajenas++;
    }
    if (movidas.length === 0) continue;
    r.conViejas++;
    r.viejas += movidas.length;
    registrar({ tipo: "plan", entregaId, tareaId, movidas });
    if (!o.aplicar || !o.almacen) continue;

    const copia = await copiarTodas(o.almacen, movidas);
    if (typeof copia === "string") {
      r.errores++;
      registrar({ tipo: "error", entregaId, motivo: copia });
      continue;
    }
    try {
      await actualizarRutas(
        o.db,
        entregaId,
        tareaId,
        new Map(movidas.map((m) => [m.de, m.a])),
      );
    } catch (e) {
      r.errores++;
      registrar({
        tipo: "error",
        entregaId,
        motivo: `base: ${(e as { code?: string }).code ?? "error"}`,
      });
      continue;
    }
    r.actualizadas++;
    r.faltaban += copia.faltaban.length;
    const aBorrar = conBorrar ? copia.borrar : [];
    registrar({
      tipo: "actualizada",
      entregaId,
      movidas: movidas.length,
      faltaban: copia.faltaban,
      borrar: aBorrar,
    });
    const b = await borrarViejas(o.almacen, aBorrar);
    r.borradas += b.borradas.length;
    r.sinBorrar.push(...b.sinBorrar);
    if (b.borradas.length > 0)
      registrar({ tipo: "borradas", rutas: b.borradas });
  }

  // Lo que una corrida anterior no llegó a borrar, si ninguna fila lo usa ya
  if (
    conBorrar &&
    o.aplicar &&
    o.almacen &&
    o.pendientes &&
    o.pendientes.length > 0
  ) {
    const enUso = new Set(
      [...(await rutasPorEntrega(o.db)).values()].flatMap((f) => [...f.rutas]),
    );
    const sueltas = [...new Set(o.pendientes)].filter((p) => !enUso.has(p));
    const b = await borrarViejas(o.almacen, sueltas);
    r.borradas += b.borradas.length;
    r.sinBorrar.push(...b.sinBorrar);
    if (b.borradas.length > 0)
      registrar({ tipo: "borradas", rutas: b.borradas });
  }
  return r;
}

/**
 * Objetos viejos pendientes de borrar según el registro: los de cada `actualizada` que ninguna
 * `borradas` posterior cubrió.
 */
export function pendientesDelRegistro(
  eventos: readonly EventoMigracion[],
): string[] {
  const pendientes = new Set<string>();
  for (const e of eventos) {
    if (e.tipo === "actualizada") for (const r of e.borrar) pendientes.add(r);
    if (e.tipo === "borradas") for (const r of e.rutas) pendientes.delete(r);
  }
  return [...pendientes];
}
