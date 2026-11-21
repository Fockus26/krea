// Grupal por partes sobre Postgres en memoria (D416–D421): asignar, entregar, aceptar y devolver
// en la transacción real de `lib/acciones/partes.ts`; el envío del capitán calcula `sinParte`; con
// la entrega enviada o la tarea cerrada todo queda congelado; eliminar la tarea borra las partes.
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { eliminarEntregaEnTransaccion } from "@/lib/data/devolver-entrega";
import { enviarEnTransaccion, permisoSubida } from "@/lib/data/entregas";
import { accionParteEnTransaccion, leerPartes } from "@/lib/data/partes";
import { eliminarTareaEnTransaccion } from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import { entregas, partes } from "@/lib/db/schema";
import { carpetaEntrega, claveImagen } from "@/lib/entregas";
import { type Equipo, idEntrega, type Tarea, type Usuario } from "@/lib/modelo";
import type { AccionParte } from "@/lib/partes";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 14, 15);
const CAPITAN = "39160001";
const ADELA = "39160002";
const LUIS = "39160003";
const OTRO = "39160004";
const EQUIPO = "x2-g1";
const EQUIPO_OTRO = "x2-g2";
const TAREA = "x2-grupal";
const ENTREGA = idEntrega(TAREA, EQUIPO);
const UUID_1 = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";
const UUID_2 = "1b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5b";

const usuario = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Partes",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea = (estado: Tarea["estado"] = "abierta"): Tarea => ({
  titulo: "Prueba X2",
  tipo: "grupal",
  secciones: ["5A"],
  estado,
  fechaEntrega: "2026-11-20",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Texto", formato: "texto", valor: 5 },
    { id: "p2", enunciado: "Foto", formato: "imagen", valor: 5 },
    { id: "p3", enunciado: "Otra", formato: "texto", valor: 10 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
});

const equipo = (capitanId: string): Equipo => ({
  nombre: "X2 Equipo",
  seccion: "5A",
  tema: null,
  capitanId,
  logoPath: null,
});

const accion = (
  uid: string,
  preguntaId: string,
  a: AccionParte,
  ahora = AHORA,
) =>
  accionParteEnTransaccion(
    db(),
    uid,
    { tareaId: TAREA, preguntaId, accion: a },
    ahora,
  );
const asignar = (uid: string, preguntaId: string, asignado: string | null) =>
  accion(uid, preguntaId, { tipo: "asignar", asignado });
const entregarTexto = (uid: string, preguntaId: string, texto: string) =>
  accion(uid, preguntaId, { tipo: "entregar", respuesta: { texto } });

async function imagen(uuid = UUID_1) {
  return claveImagen(TAREA, await carpetaEntrega(ENTREGA), uuid);
}

async function envio() {
  return {
    tareaId: TAREA,
    respuestas: {
      p1: { texto: "Uno" },
      p2: { imagenPath: await imagen(UUID_2) },
      p3: { texto: "Tres" },
    },
  };
}

beforeAll(async () => {
  base = await baseNueva();
});

// Cada prueba arranca del mismo equipo, sin reparto ni entrega
beforeEach(async () => {
  await db().delete(partes);
  await db().delete(entregas);
  for (const c of [CAPITAN, ADELA, LUIS])
    await docs.ponerDoc(db(), "usuarios", c, usuario(c, EQUIPO));
  await docs.ponerDoc(db(), "usuarios", OTRO, usuario(OTRO, EQUIPO_OTRO));
  await docs.ponerDoc(db(), "equipos", EQUIPO, equipo(CAPITAN));
  await docs.ponerDoc(db(), "equipos", EQUIPO_OTRO, equipo(OTRO));
  await docs.ponerDoc(db(), "tareas", TAREA, tarea());
});

describe("reparto (D417)", () => {
  test("asignar, reasignar y quitar: solo el capitán y solo a integrantes", async () => {
    expect(await asignar(ADELA, "p1", LUIS)).toEqual({
      ok: false,
      error: "no-capitan",
    });
    expect(await asignar(CAPITAN, "p1", OTRO)).toEqual({
      ok: false,
      error: "integrante",
    });
    expect(await asignar(CAPITAN, "p1", CAPITAN)).toEqual({
      ok: false,
      error: "integrante",
    });
    expect(await asignar(CAPITAN, "p1", ADELA)).toEqual({ ok: true });
    expect(await entregarTexto(ADELA, "p1", "  Mi parte  ")).toEqual({
      ok: true,
    });
    // Reasignar descarta lo que entregó la anterior
    expect(await asignar(CAPITAN, "p1", LUIS)).toEqual({ ok: true });
    const [p] = await leerPartes(db(), ENTREGA);
    expect(p).toMatchObject({
      asignado: LUIS,
      estado: "asignada",
      respuesta: null,
    });
    expect(await asignar(CAPITAN, "p1", null)).toEqual({ ok: true });
    expect(await leerPartes(db(), ENTREGA)).toEqual([]);
  });

  test("entregar: solo el asignado; aceptar y devolver: solo el capitán", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    expect(await entregarTexto(LUIS, "p1", "No es mía")).toEqual({
      ok: false,
      error: "no-asignada",
    });
    expect(await entregarTexto(ADELA, "p1", "   ")).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(await accion(CAPITAN, "p1", { tipo: "aceptar" })).toEqual({
      ok: false,
      error: "estado",
    });
    expect(await entregarTexto(ADELA, "p1", "  Mi parte  ")).toEqual({
      ok: true,
    });
    expect((await leerPartes(db(), ENTREGA))[0]).toMatchObject({
      estado: "entregada",
      respuesta: { texto: "Mi parte" },
      entregadaEn: AHORA,
    });
    expect(await accion(ADELA, "p1", { tipo: "aceptar" })).toEqual({
      ok: false,
      error: "no-capitan",
    });
    expect(await accion(CAPITAN, "p1", { tipo: "aceptar" })).toEqual({
      ok: true,
    });
    // Aceptada: ya no se vuelve a entregar
    expect(await entregarTexto(ADELA, "p1", "Otra")).toEqual({
      ok: false,
      error: "estado",
    });
    expect(await accion(CAPITAN, "p1", { tipo: "devolver" })).toEqual({
      ok: true,
    });
    expect((await leerPartes(db(), ENTREGA))[0]?.estado).toBe("devuelta");
    expect(await entregarTexto(ADELA, "p1", "Corregida")).toEqual({ ok: true });
    expect((await leerPartes(db(), ENTREGA))[0]?.estado).toBe("entregada");
  });

  test("imagen: el asignado sube a la carpeta del equipo; re-entregar con otra deja la vieja sin uso", async () => {
    expect(await permisoSubida(db(), ADELA, TAREA, "p2", AHORA)).toEqual({
      ok: false,
      error: "no-capitan",
    });
    await asignar(CAPITAN, "p2", ADELA);
    const p = await permisoSubida(db(), ADELA, TAREA, "p2", AHORA);
    expect(p.ok && p.permiso.entregaId).toBe(ENTREGA);
    // Otra pregunta, no
    expect((await permisoSubida(db(), ADELA, TAREA, "p1", AHORA)).ok).toBe(
      false,
    );
    const vieja = await imagen(UUID_1);
    expect(
      await accion(ADELA, "p2", {
        tipo: "entregar",
        respuesta: { imagenPath: vieja },
      }),
    ).toEqual({ ok: true });
    expect(
      await accion(ADELA, "p2", {
        tipo: "entregar",
        respuesta: { imagenPath: await imagen(UUID_2) },
      }),
    ).toEqual({ ok: true, sinUso: [vieja] });
    // Una imagen de otra carpeta no entra
    expect(
      await accion(ADELA, "p2", {
        tipo: "entregar",
        respuesta: {
          imagenPath: claveImagen(TAREA, await carpetaEntrega("otra"), UUID_1),
        },
      }),
    ).toEqual({ ok: false, error: "incompleta" });
  });

  test("con la entrega enviada o la tarea cerrada, todo queda congelado (D419)", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await entregarTexto(ADELA, "p1", "Mía");
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
    expect(await asignar(CAPITAN, "p1", LUIS)).toEqual({
      ok: false,
      error: "enviada",
    });
    expect(await entregarTexto(ADELA, "p1", "Otra")).toEqual({
      ok: false,
      error: "enviada",
    });
    expect(await accion(CAPITAN, "p1", { tipo: "aceptar" })).toEqual({
      ok: false,
      error: "enviada",
    });
    expect((await permisoSubida(db(), ADELA, TAREA, "p2", AHORA)).ok).toBe(
      false,
    );
    // Si el profe elimina la entrega (X1), el reparto vuelve tal cual
    await docs.borrarDoc(db(), "entregas", ENTREGA);
    expect(await accion(CAPITAN, "p1", { tipo: "aceptar" })).toEqual({
      ok: true,
    });

    await docs.ponerDoc(db(), "tareas", TAREA, tarea("evaluada"));
    expect(await asignar(CAPITAN, "p3", LUIS)).toEqual({
      ok: false,
      error: "cerrada",
    });
    expect(await entregarTexto(ADELA, "p1", "Tarde")).toEqual({
      ok: false,
      error: "cerrada",
    });
  });
});

describe("envío del capitán: sinParte (D420)", () => {
  test("sin reparto: nadie queda marcado (campo ausente)", async () => {
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
    const e = await docs.entrega(db(), ENTREGA);
    expect(e?.integrantes).toEqual([CAPITAN, ADELA, LUIS]);
    expect(e && "sinParte" in e).toBe(false);
  });

  test("tenía pregunta y no entregó → marcado; entregada sin aceptar → no; sin pregunta → no", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await asignar(CAPITAN, "p3", ADELA);
    await entregarTexto(ADELA, "p1", "Mía"); // entregada, nunca aceptada
    await asignar(CAPITAN, "p2", LUIS); // asignada, nunca entregada
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
    expect((await docs.entrega(db(), ENTREGA))?.sinParte).toEqual([LUIS]);
  });

  test("devuelta y no rehecha cuenta como no entregada; el reenvío conserva sinParte", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await entregarTexto(ADELA, "p1", "Mía");
    await accion(CAPITAN, "p1", { tipo: "devolver" });
    await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA);
    expect((await docs.entrega(db(), ENTREGA))?.sinParte).toEqual([ADELA]);
    // Editar la entrega enviada (D395): mismas personas y mismo sinParte
    const otra = await envio();
    otra.respuestas.p1 = { texto: "Uno editado" };
    expect(await enviarEnTransaccion(db(), CAPITAN, otra, AHORA + 1)).toEqual({
      ok: true,
    });
    const e = await docs.entrega(db(), ENTREGA);
    expect(e?.sinParte).toEqual([ADELA]);
    expect(e?.respuestas.p1).toEqual({ texto: "Uno editado" });
  });

  test("quien se fue del equipo deja de contar: su parte queda sin asignar (D421)", async () => {
    await asignar(CAPITAN, "p1", LUIS);
    await docs.actualizarDoc(db(), "usuarios", LUIS, { equipoId: EQUIPO_OTRO });
    // En su equipo nuevo esa pregunta no es suya (manda el equipo actual, D221)
    expect(await entregarTexto(LUIS, "p1", "Desde el otro")).toEqual({
      ok: false,
      error: "no-asignada",
    });
    await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA);
    const e = await docs.entrega(db(), ENTREGA);
    expect(e?.integrantes).toEqual([CAPITAN, ADELA]);
    expect(e && "sinParte" in e).toBe(false);
  });
});

describe("limpieza (D421)", () => {
  test("eliminar la tarea borra sus partes y devuelve sus imágenes", async () => {
    await asignar(CAPITAN, "p2", ADELA);
    const ruta = await imagen(UUID_1);
    await accion(ADELA, "p2", {
      tipo: "entregar",
      respuesta: { imagenPath: ruta },
    });
    const r = await eliminarTareaEnTransaccion(db(), TAREA, AHORA);
    expect(r.resultado.ok).toBe(true);
    expect(r.imagenes).toContain(ruta);
    expect(await leerPartes(db(), ENTREGA)).toEqual([]);
  });

  test("eliminar la entrega borra sus partes y suma sus imágenes, sin repetir", async () => {
    // p2: Adela entrega una imagen que el capitán NO usa en su envío; p1: texto, sin imagen
    await asignar(CAPITAN, "p1", LUIS);
    await entregarTexto(LUIS, "p1", "Mi parte");
    await asignar(CAPITAN, "p2", ADELA);
    const deParte = await imagen(UUID_1);
    await accion(ADELA, "p2", {
      tipo: "entregar",
      respuesta: { imagenPath: deParte },
    });
    await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA);
    // Otra entrega con reparto, que no se toca
    const otraEntrega = idEntrega(TAREA, EQUIPO_OTRO);
    await db().insert(partes).values({
      entregaId: otraEntrega,
      preguntaId: "p1",
      tareaId: TAREA,
      equipoId: EQUIPO_OTRO,
      asignado: OTRO,
      estado: "asignada",
      respuesta: null,
      entregadaEn: null,
      actualizadoEn: AHORA,
    });

    const r = await eliminarEntregaEnTransaccion(
      db(),
      { entregaId: ENTREGA, enviadaEn: AHORA, evaluadaEn: null },
      AHORA + 1,
    );
    expect(r).toEqual({
      ok: true,
      id: ENTREGA,
      imagenes: [await imagen(UUID_2), deParte],
    });
    expect(await leerPartes(db(), ENTREGA)).toEqual([]);
    expect(await docs.entrega(db(), ENTREGA)).toBeNull();
    const quedan = await db().select().from(partes);
    expect(quedan.map((p) => p.entregaId)).toEqual([otraEntrega]);
  });

  test("eliminar la entrega: la imagen de una parte aceptada que el capitán envió va una sola vez", async () => {
    await asignar(CAPITAN, "p2", ADELA);
    const ruta = await imagen(UUID_2);
    await accion(ADELA, "p2", {
      tipo: "entregar",
      respuesta: { imagenPath: ruta },
    });
    await accion(CAPITAN, "p2", { tipo: "aceptar" });
    await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA);
    const r = await eliminarEntregaEnTransaccion(
      db(),
      { entregaId: ENTREGA, enviadaEn: AHORA, evaluadaEn: null },
      AHORA + 1,
    );
    expect(r).toEqual({ ok: true, id: ENTREGA, imagenes: [ruta] });
    expect(await leerPartes(db(), ENTREGA)).toEqual([]);
  });
});
