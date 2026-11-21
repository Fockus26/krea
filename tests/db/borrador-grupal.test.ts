// Borrador compartido de una grupal (D544–D547) sobre Postgres en memoria: quién lo guarda, la
// versión optimista, el borrado al enviar y en cascada, y la huella del sondeo que lee el
// integrante (204/200, sin cédulas).
import { beforeAll, describe, expect, test } from "bun:test";
import { huellaConBorrador } from "@/lib/borrador-grupal";
import { carpetaEntrega } from "@/lib/carpeta-entrega";
import {
  guardarBorradorEnTransaccion,
  leerBorradorGrupal,
} from "@/lib/data/borrador-grupal";
import { enviarEnTransaccion } from "@/lib/data/entregas";
import { eliminarEquipoEnTransaccion } from "@/lib/data/equipos";
import { leerVersionPartes } from "@/lib/data/partes";
import { eliminarTareaEnTransaccion } from "@/lib/data/tareas";
import { respuestaVersionPartes } from "@/lib/data/version-partes";
import type { Db } from "@/lib/db";
import { claveImagen } from "@/lib/entregas";
import { type Equipo, idEntrega, type Tarea, type Usuario } from "@/lib/modelo";
import type { Sesion } from "@/lib/sesion";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 5, 20, 12);
const UUID = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";
const UUID_2 = "1c6d4b63-8e1f-4a64-8e1c-1f2e3d4c5b6a";
const CAPITAN = "39100001";
const INTEGRANTE = "39100002";
const OTRO_CAPITAN = "39100003";
const NUEVO = "39100004";
const EQUIPO = "b3-g1";
const OTRO = "b3-g2";
const T = "b3-gru";

const usuario = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Borrador",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea = (tipo: Tarea["tipo"], estado: Tarea["estado"]): Tarea => ({
  titulo: "Prueba B3",
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

const equipo = (capitanId: string, nombre: string): Equipo => ({
  nombre,
  seccion: "5A",
  tema: null,
  capitanId,
  logoPath: null,
});

const imagen = (tareaId: string, equipoId: string, uuid = UUID) =>
  claveImagen(tareaId, carpetaEntrega(idEntrega(tareaId, equipoId)), uuid);

const sesion = (uid: string, equipoId: string | null): Sesion => ({
  uid,
  rol: "estudiante",
  seccion: "5A",
  equipoId,
});

beforeAll(async () => {
  base = await baseNueva();
  for (const [c, e] of [
    [CAPITAN, EQUIPO],
    [INTEGRANTE, EQUIPO],
    [OTRO_CAPITAN, OTRO],
  ] as const)
    await docs.ponerDoc(db(), "usuarios", c, usuario(c, e));
  await docs.ponerDoc(db(), "equipos", EQUIPO, equipo(CAPITAN, "B3 Uno"));
  await docs.ponerDoc(db(), "equipos", OTRO, equipo(OTRO_CAPITAN, "B3 Dos"));
  await docs.ponerDoc(db(), "tareas", T, tarea("grupal", "abierta"));
  await docs.ponerDoc(
    db(),
    "tareas",
    "b3-cerrada",
    tarea("grupal", "evaluada"),
  );
  await docs.ponerDoc(db(), "tareas", "b3-ind", tarea("individual", "abierta"));
});

describe("guardarBorradorEnTransaccion (D546)", () => {
  test("el capitán guarda: solo preguntas de la tarea e imágenes de su entrega", async () => {
    const r = await guardarBorradorEnTransaccion(
      db(),
      CAPITAN,
      {
        tareaId: T,
        version: 0,
        respuestas: {
          p1: { imagenPath: imagen(T, EQUIPO), nombre: "foto.jpg", peso: 1200 },
          p2: "  A medio escribir",
          // Ni una pregunta que no existe ni la imagen de otra entrega se guardan
          p9: "sobra",
        },
      },
      AHORA,
    );
    expect(r).toEqual({ ok: true, version: 1 });
    const b = await leerBorradorGrupal(db(), idEntrega(T, EQUIPO));
    expect(b).toEqual({
      respuestas: {
        p1: { imagenPath: imagen(T, EQUIPO), nombre: "foto.jpg", peso: 1200 },
        p2: "  A medio escribir",
      },
      actualizadoEn: AHORA,
      actualizadoPor: CAPITAN,
      version: 1,
    });
    const ajena = await guardarBorradorEnTransaccion(
      db(),
      CAPITAN,
      {
        tareaId: T,
        version: 1,
        respuestas: {
          p1: { imagenPath: imagen(T, OTRO), nombre: "x.jpg", peso: 1 },
          p2: "  A medio escribir",
        },
      },
      AHORA + 1,
    );
    // La imagen ajena se descarta: queda solo el texto (cambió, versión 2)
    expect(ajena).toEqual({ ok: true, version: 2 });
    expect(
      (await leerBorradorGrupal(db(), idEntrega(T, EQUIPO)))?.respuestas,
    ).toEqual({ p2: "  A medio escribir" });
  });

  test("integrante, tarea cerrada, individual o sin equipo: no escribe", async () => {
    const entrada = (tareaId: string) => ({
      tareaId,
      version: 2,
      respuestas: { p2: "Del integrante" },
    });
    expect(
      await guardarBorradorEnTransaccion(db(), INTEGRANTE, entrada(T), AHORA),
    ).toEqual({ ok: false, error: "no-capitan" });
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        entrada("b3-cerrada"),
        AHORA,
      ),
    ).toEqual({ ok: false, error: "cerrada" });
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        entrada("b3-ind"),
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(
      await guardarBorradorEnTransaccion(db(), CAPITAN, entrada("nada"), AHORA),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(
      (await leerBorradorGrupal(db(), idEntrega(T, EQUIPO)))?.respuestas,
    ).toEqual({ p2: "  A medio escribir" });
  });

  test("el capitán de otro equipo escribe solo en el borrador del suyo", async () => {
    const antes = await leerVersionPartes(db(), idEntrega(T, EQUIPO));
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        OTRO_CAPITAN,
        { tareaId: T, version: 0, respuestas: { p2: "Del otro equipo" } },
        AHORA,
      ),
    ).toEqual({ ok: true, version: 1 });
    expect(await leerVersionPartes(db(), idEntrega(T, EQUIPO))).toBe(antes);
    expect(
      (await leerBorradorGrupal(db(), idEntrega(T, EQUIPO)))?.respuestas.p2,
    ).toBe("  A medio escribir");
  });

  test("versión vieja: `cambio` sin escribir; lo mismo otra vez es idempotente", async () => {
    // Otro dispositivo del capitán guardó la 2; este todavía tiene la 1
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        { tareaId: T, version: 1, respuestas: { p2: "Desde la tablet" } },
        AHORA + 2,
      ),
    ).toEqual({ ok: false, error: "cambio", version: 2 });
    // Un reintento de lo que ya está guardado no cuenta como cambio
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        { tareaId: T, version: 1, respuestas: { p2: "  A medio escribir" } },
        AHORA + 3,
      ),
    ).toEqual({ ok: true, version: 2 });
    // Con la versión nueva, el último gana
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        { tareaId: T, version: 2, respuestas: { p2: "Desde la tablet" } },
        AHORA + 4,
      ),
    ).toEqual({ ok: true, version: 3 });
  });
});

describe("sondeo del integrante (D547)", () => {
  const params = (q: Record<string, string>) => new URLSearchParams(q);

  test("sin sesión 401, profe 404, sin tarea 400", async () => {
    expect(
      (await respuestaVersionPartes(null, params({ tarea: T }), db())).status,
    ).toBe(401);
    const profe: Sesion = { ...sesion("39100099", null), rol: "profesor" };
    expect(
      (await respuestaVersionPartes(profe, params({ tarea: T }), db())).status,
    ).toBe(404);
    expect(
      (
        await respuestaVersionPartes(
          sesion(INTEGRANTE, EQUIPO),
          params({}),
          db(),
        )
      ).status,
    ).toBe(400);
  });

  test("200 con la versión (sin cédulas); 204 si no cambió; el borrador nuevo la mueve", async () => {
    const yo = sesion(INTEGRANTE, EQUIPO);
    const r = await respuestaVersionPartes(
      yo,
      params({ tarea: T, borrador: "1" }),
      db(),
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    const cuerpo = await r.text();
    for (const c of [CAPITAN, INTEGRANTE, OTRO_CAPITAN])
      expect(cuerpo).not.toContain(c);
    const { version } = JSON.parse(cuerpo) as { version: string };
    // La misma huella que arma la página
    expect(version).toBe(
      huellaConBorrador(await leerVersionPartes(db(), idEntrega(T, EQUIPO)), 3),
    );
    expect(
      (
        await respuestaVersionPartes(
          yo,
          params({ tarea: T, borrador: "1", desde: version }),
          db(),
        )
      ).status,
    ).toBe(204);
    // Sin `borrador=1` (el capitán), el borrador no entra en la huella
    const sinBorrador = await respuestaVersionPartes(
      yo,
      params({ tarea: T }),
      db(),
    );
    expect(((await sinBorrador.json()) as { version: string }).version).toBe(
      await leerVersionPartes(db(), idEntrega(T, EQUIPO)),
    );
    await guardarBorradorEnTransaccion(
      db(),
      CAPITAN,
      { tareaId: T, version: 3, respuestas: { p2: "Casi listo" } },
      AHORA + 5,
    );
    const despues = await respuestaVersionPartes(
      yo,
      params({ tarea: T, borrador: "1", desde: version }),
      db(),
    );
    expect(despues.status).toBe(200);
    expect(((await despues.json()) as { version: string }).version).not.toBe(
      version,
    );
  });
});

describe("al enviar y en cascada (D544, D545)", () => {
  test("enviar borra el borrador; después ya no se guarda (tampoco el capitán que entró después)", async () => {
    const envio = {
      tareaId: T,
      respuestas: {
        p1: { imagenPath: imagen(T, EQUIPO) },
        p2: { texto: "Final" },
      },
    };
    expect(await enviarEnTransaccion(db(), CAPITAN, envio, AHORA + 6)).toEqual({
      ok: true,
    });
    expect(await leerBorradorGrupal(db(), idEntrega(T, EQUIPO))).toBeNull();
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        CAPITAN,
        { tareaId: T, version: 0, respuestas: { p2: "Tarde" } },
        AHORA + 7,
      ),
    ).toEqual({ ok: false, error: "enviada" });
    // Entra al equipo después del envío y lo hacen capitán (D526): ni borrador ni reenvío
    await docs.ponerDoc(db(), "usuarios", NUEVO, usuario(NUEVO, EQUIPO));
    await docs.actualizarDoc(db(), "equipos", EQUIPO, { capitanId: NUEVO });
    expect(
      await guardarBorradorEnTransaccion(
        db(),
        NUEVO,
        { tareaId: T, version: 0, respuestas: { p2: "Del nuevo" } },
        AHORA + 8,
      ),
    ).toEqual({ ok: false, error: "enviada" });
    expect(await enviarEnTransaccion(db(), NUEVO, envio, AHORA + 9)).toEqual({
      ok: false,
      error: "ya-entregada",
    });
    await docs.actualizarDoc(db(), "equipos", EQUIPO, { capitanId: CAPITAN });
    await docs.actualizarDoc(db(), "usuarios", NUEVO, { equipoId: null });
  });

  test("eliminar la tarea se lleva sus borradores y devuelve sus imágenes", async () => {
    const T2 = "b3-gru-2";
    await docs.ponerDoc(db(), "tareas", T2, tarea("grupal", "abierta"));
    const foto = imagen(T2, OTRO, UUID_2);
    await guardarBorradorEnTransaccion(
      db(),
      OTRO_CAPITAN,
      {
        tareaId: T2,
        version: 0,
        respuestas: { p1: { imagenPath: foto, nombre: "f.jpg", peso: 1 } },
      },
      AHORA,
    );
    const r = await eliminarTareaEnTransaccion(db(), T2, AHORA + 1);
    expect(r.resultado.ok).toBe(true);
    expect(r.imagenes).toContain(foto);
    expect(await leerBorradorGrupal(db(), idEntrega(T2, OTRO))).toBeNull();
  });

  test("eliminar el equipo se lleva su borrador y devuelve sus imágenes", async () => {
    const T3 = "b3-gru-3";
    await docs.ponerDoc(db(), "tareas", T3, tarea("grupal", "abierta"));
    const foto = imagen(T3, OTRO, UUID_2);
    await guardarBorradorEnTransaccion(
      db(),
      OTRO_CAPITAN,
      {
        tareaId: T3,
        version: 0,
        respuestas: { p1: { imagenPath: foto, nombre: "f.jpg", peso: 1 } },
      },
      AHORA,
    );
    const r = await eliminarEquipoEnTransaccion(db(), OTRO, AHORA + 1);
    expect(r.resultado.ok).toBe(true);
    expect(r.imagenes).toContain(foto);
    expect(await leerBorradorGrupal(db(), idEntrega(T3, OTRO))).toBeNull();
    expect(await leerBorradorGrupal(db(), idEntrega(T, OTRO))).toBeNull();
  });
});
