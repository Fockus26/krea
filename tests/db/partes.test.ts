// Grupal por partes sobre Postgres en memoria (D416–D421): asignar, entregar, aceptar y devolver
// en la transacción real de `lib/acciones/partes.ts`; el envío del capitán calcula `sinParte`; con
// la entrega enviada o la tarea cerrada todo queda congelado; eliminar la tarea borra las partes.
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { eliminarEntregaEnTransaccion } from "@/lib/data/devolver-entrega";
import { enviarEnTransaccion, permisoSubida } from "@/lib/data/entregas";
import {
  accionParteEnTransaccion,
  leerPartes,
  leerVersionPartes,
} from "@/lib/data/partes";
import { eliminarTareaEnTransaccion } from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import { entregas, partes } from "@/lib/db/schema";
import { carpetaEntrega, claveImagen } from "@/lib/entregas";
import { crearIdPublico } from "@/lib/id-publico";
import { type Equipo, idEntrega, type Tarea, type Usuario } from "@/lib/modelo";
import { type AccionParte, huellaDePartes } from "@/lib/partes";
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
/** El cliente nombra al integrante por su id público (D495). */
const ID = crearIdPublico("secreto-de-prueba-partes");

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
    ID,
  );
/** Asigna a la cédula `asignado` como lo hace el panel: con su id público. */
const asignar = (uid: string, preguntaId: string, asignado: string | null) =>
  accion(uid, preguntaId, {
    tipo: "asignar",
    asignado: asignado === null ? null : ID(asignado),
  });
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
  test("asignar traduce el id público a la cédula del integrante; nada más vale (D495)", async () => {
    // La cédula misma ya no sirve: el cliente nunca la tiene
    expect(
      await accion(CAPITAN, "p1", { tipo: "asignar", asignado: ADELA }),
    ).toEqual({ ok: false, error: "integrante" });
    // El id de alguien de otro equipo, o uno inventado, tampoco
    expect(
      await accion(CAPITAN, "p1", { tipo: "asignar", asignado: ID(OTRO) }),
    ).toEqual({ ok: false, error: "integrante" });
    expect(
      await accion(CAPITAN, "p1", {
        tipo: "asignar",
        asignado: "AAAAAAAAAAAAAAAAAAAAAA",
      }),
    ).toEqual({ ok: false, error: "integrante" });
    // Con otro secreto, el id de Adela no es el suyo
    const otroSecreto = crearIdPublico("otro-secreto");
    expect(
      await accion(CAPITAN, "p1", {
        tipo: "asignar",
        asignado: otroSecreto(ADELA),
      }),
    ).toEqual({ ok: false, error: "integrante" });
    expect(await leerPartes(db(), ENTREGA)).toEqual([]);
    // Su id público: la parte queda a nombre de su cédula en la base
    expect(
      await accion(CAPITAN, "p1", { tipo: "asignar", asignado: ID(ADELA) }),
    ).toEqual({ ok: true });
    const [p] = await leerPartes(db(), ENTREGA);
    expect(p?.asignado).toBe(ADELA);
  });

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
    // Para enviar, la parte no puede quedar pendiente (D463): la devuelve y la toma
    await accion(CAPITAN, "p1", { tipo: "devolver" });
    await accion(CAPITAN, "p1", { tipo: "tomar" });
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
    expect(await accion(CAPITAN, "p1", { tipo: "tomar" })).toEqual({
      ok: false,
      error: "enviada",
    });
    expect((await permisoSubida(db(), ADELA, TAREA, "p2", AHORA)).ok).toBe(
      false,
    );
    // Si el profe elimina la entrega (X1), el reparto vuelve tal cual: tomada, se la devuelve
    await docs.borrarDoc(db(), "entregas", ENTREGA);
    expect(await asignar(CAPITAN, "p1", ADELA)).toEqual({ ok: true });
    expect((await leerPartes(db(), ENTREGA))[0]).toMatchObject({
      estado: "devuelta",
      respuesta: { texto: "Mía" },
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

  test("tomada y no entregó otra → marcado; con otra aceptada → no (D461)", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await asignar(CAPITAN, "p3", ADELA);
    await entregarTexto(ADELA, "p1", "Mía");
    await accion(CAPITAN, "p1", { tipo: "aceptar" });
    await accion(CAPITAN, "p3", { tipo: "tomar" }); // Adela entregó otra: participó
    await asignar(CAPITAN, "p2", LUIS);
    expect(await accion(CAPITAN, "p2", { tipo: "tomar" })).toEqual({
      ok: true,
    });
    // Luis ya no la puede entregar ni subir su imagen
    expect(
      await accion(LUIS, "p2", {
        tipo: "entregar",
        respuesta: { imagenPath: await imagen(UUID_1) },
      }),
    ).toEqual({ ok: false, error: "no-asignada" });
    expect((await permisoSubida(db(), LUIS, TAREA, "p2", AHORA)).ok).toBe(
      false,
    );
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
    const e = await docs.entrega(db(), ENTREGA);
    expect(e?.sinParte).toEqual([LUIS]);
    // La aceptada es la de Adela (la del cliente se ignora, D463); la tomada, la del capitán
    expect(e?.respuestas.p1).toEqual({ texto: "Mía" });
    expect(e?.respuestas.p2).toEqual({ imagenPath: await imagen(UUID_2) });
    expect(e?.respuestas.p3).toEqual({ texto: "Tres" });
  });

  test("devuelta y tomada cuenta como no entregada; el reenvío conserva sinParte", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await entregarTexto(ADELA, "p1", "Mía");
    await accion(CAPITAN, "p1", { tipo: "devolver" });
    await accion(CAPITAN, "p1", { tipo: "tomar" });
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

  test("con una parte sin aceptar no se envía (D463); aceptada, entra aunque el cliente no la mande", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    for (const paso of ["asignada", "entregada", "devuelta"] as const) {
      if (paso === "entregada") await entregarTexto(ADELA, "p1", "Mía");
      if (paso === "devuelta")
        await accion(CAPITAN, "p1", { tipo: "devolver" });
      expect(
        await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
      ).toEqual({ ok: false, error: "partes-pendientes" });
    }
    expect(await docs.entrega(db(), ENTREGA)).toBeNull();
    await entregarTexto(ADELA, "p1", "Corregida");
    await accion(CAPITAN, "p1", { tipo: "aceptar" });
    const { p1: _, ...sinP1 } = (await envio()).respuestas;
    expect(
      await enviarEnTransaccion(
        db(),
        CAPITAN,
        { tareaId: TAREA, respuestas: sinP1 },
        AHORA,
      ),
    ).toEqual({ ok: true });
    const e = await docs.entrega(db(), ENTREGA);
    expect(e?.respuestas.p1).toEqual({ texto: "Corregida" });
    expect(e && "sinParte" in e).toBe(false);
  });

  test("la imagen de una parte aceptada entra desde el reparto (de la carpeta de la entrega)", async () => {
    await asignar(CAPITAN, "p2", ADELA);
    const deParte = await imagen(UUID_1);
    await accion(ADELA, "p2", {
      tipo: "entregar",
      respuesta: { imagenPath: deParte },
    });
    await accion(CAPITAN, "p2", { tipo: "aceptar" });
    // El cliente manda otra imagen: se ignora
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
    expect((await docs.entrega(db(), ENTREGA))?.respuestas.p2).toEqual({
      imagenPath: deParte,
    });
  });

  test("concurrencia: tomar y entregar a la vez; la tarea bloqueada decide el orden", async () => {
    // Integrante primero: ya entregó, tomar no cabe
    await asignar(CAPITAN, "p1", ADELA);
    await entregarTexto(ADELA, "p1", "Primero");
    expect(await accion(CAPITAN, "p1", { tipo: "tomar" })).toEqual({
      ok: false,
      error: "estado",
    });
    // Capitán primero: tomada, entregar ya no cabe
    await asignar(CAPITAN, "p3", ADELA);
    await accion(CAPITAN, "p3", { tipo: "tomar" });
    expect(await entregarTexto(ADELA, "p3", "Tarde")).toEqual({
      ok: false,
      error: "no-asignada",
    });
    // A la vez: una de las dos gana y la otra ve el estado nuevo
    await asignar(CAPITAN, "p2", LUIS);
    const [tomar, entregar] = await Promise.all([
      accion(CAPITAN, "p2", { tipo: "tomar" }),
      accion(LUIS, "p2", {
        tipo: "entregar",
        respuesta: { imagenPath: await imagen(UUID_1) },
      }),
    ]);
    const [p2] = (await leerPartes(db(), ENTREGA)).filter(
      (p) => p.preguntaId === "p2",
    );
    expect([tomar.ok, entregar.ok].filter(Boolean)).toHaveLength(1);
    expect(p2?.estado).toBe(tomar.ok ? "tomada" : "entregada");
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

describe("reparto en vivo (D465)", () => {
  test("la huella cambia con cada acción y con el envío; la de otro equipo no se mueve", async () => {
    const otra = idEntrega(TAREA, EQUIPO_OTRO);
    const vacia = await leerVersionPartes(db(), ENTREGA);
    expect(vacia).toBe("0.0.0");
    const delOtro = await leerVersionPartes(db(), otra);
    // Sin cambios: la misma (la ruta responde 204)
    expect(await leerVersionPartes(db(), ENTREGA)).toBe(vacia);

    await asignar(CAPITAN, "p1", ADELA);
    const asignada = await leerVersionPartes(db(), ENTREGA);
    expect(asignada).toBe(`1.${AHORA}.0`);
    await accion(CAPITAN, "p1", { tipo: "tomar" }, AHORA + 1);
    const tomada = await leerVersionPartes(db(), ENTREGA);
    expect(tomada).not.toBe(asignada);
    await asignar(CAPITAN, "p1", null);
    expect(await leerVersionPartes(db(), ENTREGA)).toBe("0.0.0");
    // Un borrador no cuenta; enviada, sí
    await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA + 2);
    expect(await leerVersionPartes(db(), ENTREGA)).toBe(`0.0.${AHORA + 2}`);
    expect(await leerVersionPartes(db(), otra)).toBe(delOtro);
  });

  test("la página calcula la misma huella con las partes que ya leyó", async () => {
    await asignar(CAPITAN, "p1", ADELA);
    await asignar(CAPITAN, "p2", LUIS);
    expect(huellaDePartes(await leerPartes(db(), ENTREGA))).toBe(
      await leerVersionPartes(db(), ENTREGA),
    );
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
    // p2: Adela entrega una imagen, el capitán se la devuelve y la toma (D461): envía la suya y la
    // de Adela queda en la parte; p1: texto aceptado, sin imagen
    await asignar(CAPITAN, "p1", LUIS);
    await entregarTexto(LUIS, "p1", "Mi parte");
    await accion(CAPITAN, "p1", { tipo: "aceptar" });
    await asignar(CAPITAN, "p2", ADELA);
    const deParte = await imagen(UUID_1);
    await accion(ADELA, "p2", {
      tipo: "entregar",
      respuesta: { imagenPath: deParte },
    });
    await accion(CAPITAN, "p2", { tipo: "devolver" });
    await accion(CAPITAN, "p2", { tipo: "tomar" });
    expect(
      await enviarEnTransaccion(db(), CAPITAN, await envio(), AHORA),
    ).toEqual({ ok: true });
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
