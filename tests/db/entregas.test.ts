// Envío de entregas sobre Postgres en memoria (D327) (D196): la transacción real del Admin SDK.
// La subida a B2 no se prueba aquí (dobles en tests/unit/almacen.test.ts); las rutas de imagen
// se arman igual que la Server Action.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  entregasDeIntegrante,
  enviarEnTransaccion,
  permisoSubida,
} from "@/lib/data/entregas";
import type { Db } from "@/lib/db";
import { carpetaEntrega, claveImagen } from "@/lib/entregas";
import {
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
  zEntrega,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 5, 20, 12);
const UUID = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";
const CAPITAN = "39000001";
const INTEGRANTE = "39000002";
const SOLO = "39000003";
const EQUIPO = "w5-g1";
// F-A2: segundo equipo, al que el profe mueve a un alumno tras la entrega del primero.
const CAPITAN_2 = "39000004";
const MOVIDO = "39000005";
const EQUIPO_2 = "w5-g2";

const usuario = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Entrega",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea = (tipo: Tarea["tipo"], estado: Tarea["estado"]): Tarea => ({
  titulo: "Prueba W5",
  tipo,
  secciones: ["5A"],
  estado,
  fechaEntrega: "2026-11-07",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Foto", formato: "imagen", valor: 10 },
    { id: "p2", enunciado: "Texto", formato: "texto", valor: 10 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "W5 Equipo",
  seccion: "5A",
  tema: null,
  capitanId: CAPITAN,
  logoPath: null,
};

async function respuestas(tareaId: string, titular: string) {
  const c = await carpetaEntrega(idEntrega(tareaId, titular));
  return {
    p1: { imagenPath: claveImagen(tareaId, c, UUID) },
    p2: { texto: "  Respuesta  " },
  };
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerDoc(db(), "usuarios", CAPITAN, usuario(CAPITAN, EQUIPO));
  await docs.ponerDoc(
    db(),
    "usuarios",
    INTEGRANTE,
    usuario(INTEGRANTE, EQUIPO),
  );
  await docs.ponerDoc(db(), "usuarios", SOLO, usuario(SOLO, null));
  await docs.ponerDoc(db(), "equipos", EQUIPO, equipo);
  await docs.ponerDoc(
    db(),
    "usuarios",
    CAPITAN_2,
    usuario(CAPITAN_2, EQUIPO_2),
  );
  await docs.ponerDoc(db(), "usuarios", MOVIDO, usuario(MOVIDO, EQUIPO));
  await docs.ponerDoc(db(), "equipos", EQUIPO_2, {
    ...equipo,
    nombre: "W5 Equipo 2",
    capitanId: CAPITAN_2,
  });
  await docs.ponerDoc(db(), "tareas", "w5-ind", tarea("individual", "abierta"));
  await docs.ponerDoc(db(), "tareas", "w5-gru", tarea("grupal", "abierta"));
  await docs.ponerDoc(
    db(),
    "tareas",
    "w5-cerrada",
    tarea("individual", "evaluada"),
  );
  for (const id of ["w5-ind", "w5-gru", "w5-cerrada"]) {
    for (const t of [SOLO, CAPITAN, EQUIPO, EQUIPO_2]) {
      await docs.borrarDoc(db(), "entregas", idEntrega(id, t));
    }
  }
});

describe("enviarEnTransaccion (Postgres)", () => {
  test("individual: crea la entrega `entregada`; reenviarla la edita (D395)", async () => {
    const envio = {
      tareaId: "w5-ind",
      respuestas: await respuestas("w5-ind", SOLO),
    };
    expect(await enviarEnTransaccion(db(), SOLO, envio, AHORA)).toEqual({
      ok: true,
    });
    const snap = await docs.snap(db(), "entregas", idEntrega("w5-ind", SOLO));
    const e = zEntrega.parse(snap.data());
    expect(e).toMatchObject({
      tipo: "individual",
      titularId: SOLO,
      integrantes: [SOLO],
      estado: "entregada",
      enviadaPor: SOLO,
      enviadaEn: AHORA,
      respuestas: { p2: { texto: "Respuesta" } },
    });
    // Sin evaluar y con la tarea abierta: el mismo envío otra vez es una edición
    expect(await enviarEnTransaccion(db(), SOLO, envio, AHORA + 1)).toEqual({
      ok: true,
    });
    const p = await permisoSubida(db(), SOLO, "w5-ind", "p1");
    expect(p.ok).toBe(true);
  });

  test("grupal: el integrante no puede; el capitán sí, con todo el equipo", async () => {
    const envio = {
      tareaId: "w5-gru",
      respuestas: await respuestas("w5-gru", EQUIPO),
    };
    expect(await enviarEnTransaccion(db(), INTEGRANTE, envio, AHORA)).toEqual({
      ok: false,
      error: "no-capitan",
    });
    expect(await permisoSubida(db(), INTEGRANTE, "w5-gru", "p1")).toEqual({
      ok: false,
      error: "no-capitan",
    });
    const p = await permisoSubida(db(), CAPITAN, "w5-gru", "p1");
    expect(p.ok && p.permiso.titularId).toBe(EQUIPO);
    expect(await permisoSubida(db(), CAPITAN, "w5-gru", "p2")).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(await enviarEnTransaccion(db(), CAPITAN, envio, AHORA)).toEqual({
      ok: true,
    });
    const snap = await docs.snap(db(), "entregas", idEntrega("w5-gru", EQUIPO));
    expect(snap.get("integrantes")).toEqual([CAPITAN, INTEGRANTE, MOVIDO]);
    expect(snap.get("titularId")).toBe(EQUIPO);
  });

  test("grupal: el alumno movido tras la entrega se queda con su equipo viejo (F-A2, D221)", async () => {
    // Depende del test anterior: EQUIPO ya entregó w5-gru con MOVIDO dentro.
    await docs.actualizarDoc(db(), "usuarios", MOVIDO, { equipoId: EQUIPO_2 });
    const envio = {
      tareaId: "w5-gru",
      respuestas: await respuestas("w5-gru", EQUIPO_2),
    };
    expect(await enviarEnTransaccion(db(), CAPITAN_2, envio, AHORA)).toEqual({
      ok: true,
    });
    const nueva = await docs.snap(
      db(),
      "entregas",
      idEntrega("w5-gru", EQUIPO_2),
    );
    expect(nueva.get("integrantes")).toEqual([CAPITAN_2]);
    const conMovido = (await entregasDeIntegrante(db(), MOVIDO)).filter(
      (e) => e.tareaId === "w5-gru",
    );
    expect(conMovido.map((d) => d.id)).toEqual([idEntrega("w5-gru", EQUIPO)]);
  });

  test("sin equipo, tarea cerrada, imagen ajena o inexistente: no escribe nada", async () => {
    const gru = {
      tareaId: "w5-gru",
      respuestas: await respuestas("w5-gru", SOLO),
    };
    expect(await enviarEnTransaccion(db(), SOLO, gru, AHORA)).toEqual({
      ok: false,
      error: "sin-equipo",
    });
    const cerrada = {
      tareaId: "w5-cerrada",
      respuestas: await respuestas("w5-cerrada", SOLO),
    };
    expect(await enviarEnTransaccion(db(), SOLO, cerrada, AHORA)).toEqual({
      ok: false,
      error: "cerrada",
    });
    // Imagen subida para la entrega de otro alumno
    const ajena = {
      tareaId: "w5-ind",
      respuestas: await respuestas("w5-ind", SOLO),
    };
    expect(await enviarEnTransaccion(db(), CAPITAN, ajena, AHORA)).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(
      await enviarEnTransaccion(
        db(),
        SOLO,
        { tareaId: "no-existe", respuestas: {} },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
    for (const [t, tit] of [
      ["w5-cerrada", SOLO],
      ["w5-ind", CAPITAN],
    ] as const) {
      const s = await docs.snap(db(), "entregas", idEntrega(t, tit));
      expect(s.exists).toBe(false);
    }
  });
});

describe("editar la entrega (D395–D397)", () => {
  const T = "w5-edit";
  const T_GRU = "w5-edit-gru";
  const UUID_2 = "1c6d4b63-8e1f-4a64-8e1c-1f2e3d4c5b6a";

  beforeAll(async () => {
    await docs.ponerDoc(db(), "tareas", T, tarea("individual", "abierta"));
    await docs.ponerDoc(db(), "tareas", T_GRU, tarea("grupal", "abierta"));
  });

  async function con(
    tareaId: string,
    titular: string,
    uuid: string,
    texto: string,
  ) {
    const c = await carpetaEntrega(idEntrega(tareaId, titular));
    return {
      tareaId,
      respuestas: {
        p1: { imagenPath: claveImagen(tareaId, c, uuid) },
        p2: { texto },
      },
    };
  }

  test("reenviar una entregada: respuestas y envío nuevos; la imagen vieja sale en `sinUso`", async () => {
    const primero = await con(T, SOLO, UUID, "Primera");
    expect(await enviarEnTransaccion(db(), SOLO, primero, AHORA)).toEqual({
      ok: true,
    });
    const segundo = await con(T, SOLO, UUID_2, "Segunda");
    expect(
      await enviarEnTransaccion(db(), SOLO, segundo, AHORA + 60_000),
    ).toEqual({
      ok: true,
      sinUso: [primero.respuestas.p1.imagenPath],
    });
    const e = zEntrega.parse(
      (await docs.snap(db(), "entregas", idEntrega(T, SOLO))).data(),
    );
    expect(e).toMatchObject({
      estado: "entregada",
      evaluacion: null,
      enviadaEn: AHORA + 60_000,
      enviadaPor: SOLO,
      respuestas: {
        p1: { imagenPath: segundo.respuestas.p1.imagenPath },
        p2: { texto: "Segunda" },
      },
    });
  });

  test("evaluada: `ya-evaluada` al enviar y al subir; no cambia nada", async () => {
    const id = idEntrega(T, SOLO);
    await docs.actualizarDoc(db(), "entregas", id, {
      estado: "evaluada",
      evaluacion: {
        puntos: { p1: 10, p2: 10 },
        comentarios: {},
        puntaje: 20,
        evaluadaPor: null,
        evaluadaEn: AHORA + 120_000,
      },
    });
    const otro = await con(T, SOLO, UUID, "Tercera");
    expect(
      await enviarEnTransaccion(db(), SOLO, otro, AHORA + 180_000),
    ).toEqual({
      ok: false,
      error: "ya-evaluada",
    });
    expect(await permisoSubida(db(), SOLO, T, "p1")).toEqual({
      ok: false,
      error: "ya-evaluada",
    });
    const e = zEntrega.parse((await docs.snap(db(), "entregas", id)).data());
    expect(e.estado).toBe("evaluada");
    expect(e.respuestas.p2).toEqual({ texto: "Segunda" });
  });

  test("grupal: el capitán edita con los mismos integrantes; el integrante no", async () => {
    const primero = await con(T_GRU, EQUIPO, UUID, "Del equipo");
    expect(await enviarEnTransaccion(db(), CAPITAN, primero, AHORA)).toEqual({
      ok: true,
    });
    const id = idEntrega(T_GRU, EQUIPO);
    const antes = (await docs.snap(db(), "entregas", id)).get("integrantes");
    // Alguien entra al equipo después del primer envío: la foto no cambia al editar (D396)
    await docs.ponerDoc(
      db(),
      "usuarios",
      "39000009",
      usuario("39000009", EQUIPO),
    );
    const editado = await con(T_GRU, EQUIPO, UUID, "Editada");
    expect(
      await enviarEnTransaccion(db(), INTEGRANTE, editado, AHORA + 1),
    ).toEqual({
      ok: false,
      error: "no-capitan",
    });
    expect(
      await enviarEnTransaccion(db(), CAPITAN, editado, AHORA + 2),
    ).toEqual({
      ok: true,
    });
    const s = await docs.snap(db(), "entregas", id);
    expect(s.get("integrantes")).toEqual(antes);
    expect(s.get("respuestas")).toMatchObject({ p2: { texto: "Editada" } });
    await docs.actualizarDoc(db(), "usuarios", "39000009", { equipoId: null });
  });

  test("tarea cerrada: no se edita", async () => {
    await docs.actualizarDoc(db(), "tareas", T_GRU, { estado: "evaluada" });
    const editado = await con(T_GRU, EQUIPO, UUID, "Tarde");
    expect(
      await enviarEnTransaccion(db(), CAPITAN, editado, AHORA + 3),
    ).toEqual({
      ok: false,
      error: "cerrada",
    });
  });
});
