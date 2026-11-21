// Migración de las carpetas de entrega (D513) sobre PGlite con un almacén B2 falso: mueve los
// objetos, cambia las rutas de entregas y partes, es idempotente, reanuda lo que quedó a medias y
// el ensayo no escribe nada.
import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { ResultadoAlmacen, ResultadoExiste } from "@/lib/almacen/s3";
import {
  carpetaEntregaLegada,
  crearCarpetaEntrega,
} from "@/lib/carpeta-entrega";
import {
  type AlmacenMigracion,
  type EventoMigracion,
  migrarCarpetas,
  pendientesDelRegistro,
} from "@/lib/data/migrar-carpetas";
import type { Db } from "@/lib/db";
import { entregas, partes } from "@/lib/db/schema";
import { claveImagen } from "@/lib/entregas";
import { type Entrega, idEntrega, type Tarea } from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

const AHORA = Date.UTC(2026, 10, 21, 15, 0);
const T = "mig-ind";
const T_GRU = "mig-gru";
const SOLO = "39100001";
const EQUIPO = "mig-g1";
const U1 = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";
const U2 = "1c6d4b63-8e1f-4a64-8e1c-1f2e3d4c5b6a";
const U3 = "2d7e5c74-9f20-4b75-9f2d-2a3f4e5d6c7b";
const nueva = crearCarpetaEntrega("secreto-de-la-app-de-prueba");

const ID_SOLO = idEntrega(T, SOLO);
const ID_GRU = idEntrega(T_GRU, EQUIPO);
const vieja = (id: string, tareaId: string, uuid: string) =>
  claveImagen(tareaId, carpetaEntregaLegada(id), uuid);
const nuevaDe = (id: string, tareaId: string, uuid: string) =>
  claveImagen(tareaId, nueva(id), uuid);

const tarea = (tipo: Tarea["tipo"]): Tarea => ({
  titulo: "Migración",
  tipo,
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-28",
  premio: null,
  preguntas: [
    {
      id: "p1",
      enunciado: "Fotos",
      formato: "imagen",
      valor: 10,
      maxImagenes: 2,
    },
    { id: "p2", enunciado: "Texto", formato: "texto", valor: 10 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
});

const entrega = (
  tareaId: string,
  tipo: Entrega["tipo"],
  titularId: string,
  rutas: string[],
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5A",
  integrantes: [SOLO],
  estado: "entregada",
  respuestas: { p1: { imagenPaths: rutas }, p2: { texto: "Hola" } },
  enviadaPor: SOLO,
  enviadaEn: AHORA,
  evaluacion: null,
});

/** B2 falso: un conjunto de claves; `fallar` hace que esa operación responda error de red. */
function almacenFalso(inicial: string[]) {
  const objetos = new Set(inicial);
  const llamadas: string[] = [];
  const fallar = new Set<string>();
  const res = (op: string): ResultadoAlmacen | null =>
    fallar.has(op) ? { ok: false, error: "red" } : null;
  const a: AlmacenMigracion = {
    async existe(clave): Promise<ResultadoExiste> {
      llamadas.push(`existe ${clave}`);
      return fallar.has("existe")
        ? { ok: false, error: "red" }
        : { ok: true, existe: objetos.has(clave) };
    },
    async copiar(de, hacia) {
      llamadas.push(`copiar ${de} ${hacia}`);
      const f = res("copiar");
      if (f) return f;
      if (!objetos.has(de)) return { ok: false, error: "rechazado" };
      objetos.add(hacia);
      return { ok: true };
    },
    async borrar(clave) {
      llamadas.push(`borrar ${clave}`);
      const f = res("borrar");
      if (f) return f;
      objetos.delete(clave);
      return { ok: true };
    },
  };
  return { a, objetos, llamadas, fallar };
}

let base: Db;
const db = () => base;

async function rutasDeEntrega(id: string) {
  const [f] = await db()
    .select({ respuestas: entregas.respuestas })
    .from(entregas)
    .where(eq(entregas.id, id));
  return f?.respuestas;
}

async function respuestaDeParte(id: string) {
  const [f] = await db()
    .select({ respuesta: partes.respuesta })
    .from(partes)
    .where(eq(partes.entregaId, id));
  return f?.respuesta;
}

beforeEach(async () => {
  base = await baseNueva();
  await docs.ponerTarea(db(), T, tarea("individual"));
  await docs.ponerTarea(db(), T_GRU, tarea("grupal"));
  await docs.ponerEntrega(
    db(),
    ID_SOLO,
    entrega(T, "individual", SOLO, [
      vieja(ID_SOLO, T, U1),
      vieja(ID_SOLO, T, U2),
    ]),
  );
  // Grupal por partes aún sin enviar: solo la fila de la parte guarda la ruta
  await db()
    .insert(partes)
    .values({
      entregaId: ID_GRU,
      preguntaId: "p1",
      tareaId: T_GRU,
      equipoId: EQUIPO,
      asignado: SOLO,
      estado: "entregada",
      respuesta: { imagenPath: vieja(ID_GRU, T_GRU, U3) },
      entregadaEn: AHORA,
      actualizadoEn: AHORA,
    });
});

const OBJETOS_VIEJOS = () => [
  vieja(ID_SOLO, T, U1),
  vieja(ID_SOLO, T, U2),
  vieja(ID_GRU, T_GRU, U3),
];

describe("migrarCarpetas (D513)", () => {
  test("ensayo: lista lo que movería, no escribe en la base ni llama a B2", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    const eventos: EventoMigracion[] = [];
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: false,
      registrar: (e) => eventos.push(e),
    });
    expect(r).toMatchObject({
      entregas: 2,
      conViejas: 2,
      viejas: 3,
      enNueva: 0,
      ajenas: 0,
      actualizadas: 0,
      borradas: 0,
    });
    expect(eventos.map((e) => e.tipo)).toEqual(["plan", "plan"]);
    expect(b2.llamadas).toEqual([]);
    expect(await rutasDeEntrega(ID_SOLO)).toMatchObject({
      p1: { imagenPaths: [vieja(ID_SOLO, T, U1), vieja(ID_SOLO, T, U2)] },
    });
  });

  test("aplicar: copia, cambia las rutas (entrega y partes) y después borra los viejos", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(r).toMatchObject({
      actualizadas: 2,
      borradas: 3,
      errores: 0,
      sinBorrar: [],
    });
    expect(await rutasDeEntrega(ID_SOLO)).toEqual({
      p1: { imagenPaths: [nuevaDe(ID_SOLO, T, U1), nuevaDe(ID_SOLO, T, U2)] },
      p2: { texto: "Hola" },
    });
    expect(await respuestaDeParte(ID_GRU)).toEqual({
      imagenPath: nuevaDe(ID_GRU, T_GRU, U3),
    });
    expect([...b2.objetos].sort()).toEqual(
      [
        nuevaDe(ID_SOLO, T, U1),
        nuevaDe(ID_SOLO, T, U2),
        nuevaDe(ID_GRU, T_GRU, U3),
      ].sort(),
    );
    // Ninguna ruta guardada ni objeto lleva la carpeta sin secreto
    expect(JSON.stringify(await rutasDeEntrega(ID_SOLO))).not.toContain(
      carpetaEntregaLegada(ID_SOLO),
    );
    // Cada viejo se borra solo después de copiarlo
    const copia = b2.llamadas.indexOf(
      `copiar ${vieja(ID_SOLO, T, U1)} ${nuevaDe(ID_SOLO, T, U1)}`,
    );
    const borrado = b2.llamadas.indexOf(`borrar ${vieja(ID_SOLO, T, U1)}`);
    expect(copia).toBeGreaterThan(-1);
    expect(borrado).toBeGreaterThan(copia);
  });

  test("idempotente: la segunda corrida no mueve nada y no llama a B2", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    b2.llamadas.length = 0;
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(r).toMatchObject({
      conViejas: 0,
      viejas: 0,
      enNueva: 3,
      actualizadas: 0,
    });
    expect(b2.llamadas).toEqual([]);
  });

  test("ya copiada (corte entre copiar y actualizar): no vuelve a copiar, solo cambia la ruta", async () => {
    const b2 = almacenFalso([...OBJETOS_VIEJOS(), nuevaDe(ID_SOLO, T, U1)]);
    await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(
      b2.llamadas.some((l) => l.startsWith(`copiar ${vieja(ID_SOLO, T, U1)}`)),
    ).toBe(false);
    expect(await rutasDeEntrega(ID_SOLO)).toMatchObject({
      p1: { imagenPaths: [nuevaDe(ID_SOLO, T, U1), nuevaDe(ID_SOLO, T, U2)] },
    });
  });

  test("B2 sin red: la entrega no se toca y queda para la próxima", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    b2.fallar.add("copiar");
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(r).toMatchObject({ actualizadas: 0, errores: 2, borradas: 0 });
    expect(await rutasDeEntrega(ID_SOLO)).toMatchObject({
      p1: { imagenPaths: [vieja(ID_SOLO, T, U1), vieja(ID_SOLO, T, U2)] },
    });
    expect(b2.objetos.has(vieja(ID_SOLO, T, U1))).toBe(true);
    // Vuelve la red: la siguiente corrida lo termina
    b2.fallar.clear();
    const otra = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(otra).toMatchObject({ actualizadas: 2, errores: 0 });
  });

  test("reanuda: los viejos que no se borraron salen del registro y se borran en la siguiente", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    b2.fallar.add("borrar");
    const eventos: EventoMigracion[] = [];
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
      registrar: (e) => eventos.push(e),
    });
    expect(r.actualizadas).toBe(2);
    expect(r.sinBorrar).toHaveLength(3);
    const pendientes = pendientesDelRegistro(eventos);
    expect(pendientes.sort()).toEqual(OBJETOS_VIEJOS().sort());
    b2.fallar.clear();
    const otra = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
      pendientes,
      registrar: (e) => eventos.push(e),
    });
    expect(otra).toMatchObject({ viejas: 0, borradas: 3, sinBorrar: [] });
    expect(pendientesDelRegistro(eventos)).toEqual([]);
    expect(OBJETOS_VIEJOS().some((o) => b2.objetos.has(o))).toBe(false);
  });

  test("un pendiente que una fila vuelve a usar no se borra", async () => {
    const b2 = almacenFalso([vieja(ID_SOLO, T, U1)]);
    // Rutas que ya están en la nueva salvo la de U1, que llegó vieja de un formulario abierto
    await docs.ponerEntrega(
      db(),
      ID_SOLO,
      entrega(T, "individual", SOLO, [vieja(ID_SOLO, T, U1)]),
    );
    await db().delete(partes);
    b2.fallar.add("copiar");
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
      pendientes: [vieja(ID_SOLO, T, U1)],
    });
    expect(r.errores).toBe(1);
    expect(b2.objetos.has(vieja(ID_SOLO, T, U1))).toBe(true);
  });

  test("borrar: false (bucket compartido): mueve las rutas y deja los objetos viejos", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    const eventos: EventoMigracion[] = [];
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
      borrar: false,
      pendientes: [vieja(ID_SOLO, T, U1)],
      registrar: (e) => eventos.push(e),
    });
    expect(r).toMatchObject({ actualizadas: 2, borradas: 0 });
    expect(OBJETOS_VIEJOS().every((o) => b2.objetos.has(o))).toBe(true);
    expect(b2.llamadas.some((l) => l.startsWith("borrar"))).toBe(false);
    expect(pendientesDelRegistro(eventos)).toEqual([]);
  });

  test("imagen perdida (ni vieja ni nueva en B2): la ruta pasa a la nueva igual", async () => {
    const b2 = almacenFalso([vieja(ID_SOLO, T, U2), vieja(ID_GRU, T_GRU, U3)]);
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    expect(r).toMatchObject({ faltaban: 1, actualizadas: 2, borradas: 2 });
    expect(await rutasDeEntrega(ID_SOLO)).toMatchObject({
      p1: { imagenPaths: [nuevaDe(ID_SOLO, T, U1), nuevaDe(ID_SOLO, T, U2)] },
    });
  });

  test("con otro secreto, las rutas nuevas de la app cuentan como ajenas y no se tocan", async () => {
    const b2 = almacenFalso(OBJETOS_VIEJOS());
    await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: nueva,
      aplicar: true,
    });
    const r = await migrarCarpetas({
      db: db(),
      almacen: b2.a,
      carpetaNueva: crearCarpetaEntrega("otro-secreto"),
      aplicar: false,
    });
    expect(r).toMatchObject({ ajenas: 3, viejas: 0, enNueva: 0 });
  });
});
