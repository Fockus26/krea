// Respuesta de enlace sobre Postgres en memoria (D468, D469): enviar una entrega con una pregunta
// «Enlace» y entregar una parte de enlace pasan por `respuestasValidas` en la transacción real.
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { enviarEnTransaccion, permisoSubida } from "@/lib/data/entregas";
import { accionParteEnTransaccion, leerPartes } from "@/lib/data/partes";
import type { Db } from "@/lib/db";
import { entregas, partes } from "@/lib/db/schema";
import { crearIdPublico } from "@/lib/id-publico";
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

const AHORA = Date.UTC(2026, 10, 20, 15);
const SOLO = "39468001";
const CAPITAN = "39468002";
const ANA = "39468003";
const EQUIPO = "q7-g1";
const IND = "q7-url-ind";
const GRU = "q7-url-gru";

const usuario = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Enlace",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea = (tipo: Tarea["tipo"]): Tarea => ({
  titulo: "Prueba Q7",
  tipo,
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-30",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Enlace a tu diseño", formato: "url", valor: 10 },
    { id: "p2", enunciado: "Explica", formato: "texto", valor: 10 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "Q7 Equipo",
  seccion: "5A",
  tema: null,
  capitanId: CAPITAN,
  logoPath: null,
};

beforeAll(async () => {
  base = await baseNueva();
});

beforeEach(async () => {
  await db().delete(partes);
  await db().delete(entregas);
  await docs.ponerDoc(db(), "usuarios", SOLO, usuario(SOLO, null));
  for (const c of [CAPITAN, ANA])
    await docs.ponerDoc(db(), "usuarios", c, usuario(c, EQUIPO));
  await docs.ponerDoc(db(), "equipos", EQUIPO, equipo);
  await docs.ponerDoc(db(), "tareas", IND, tarea("individual"));
  await docs.ponerDoc(db(), "tareas", GRU, tarea("grupal"));
});

describe("entrega con pregunta «Enlace» (D469)", () => {
  test("válida: se guarda normalizada (con https:// si faltaba)", async () => {
    const envio = {
      tareaId: IND,
      respuestas: {
        p1: { url: "  www.canva.com/design/DAF1/view " },
        p2: { texto: "Mi explicación" },
      },
    };
    expect(await enviarEnTransaccion(db(), SOLO, envio, AHORA)).toEqual({
      ok: true,
    });
    const snap = await docs.snap(db(), "entregas", idEntrega(IND, SOLO));
    expect(zEntrega.parse(snap.data()).respuestas).toEqual({
      p1: { url: "https://www.canva.com/design/DAF1/view" },
      p2: { texto: "Mi explicación" },
    });
  });

  test("javascript: o credenciales → `incompleta`, sin escribir nada", async () => {
    for (const url of [
      "javascript:alert(document.cookie)",
      "https://ana:clave@drive.google.com/x",
    ]) {
      expect(
        await enviarEnTransaccion(
          db(),
          SOLO,
          { tareaId: IND, respuestas: { p1: { url }, p2: { texto: "a" } } },
          AHORA,
        ),
      ).toEqual({ ok: false, error: "incompleta" });
    }
    const snap = await docs.snap(db(), "entregas", idEntrega(IND, SOLO));
    expect(snap.exists).toBe(false);
  });

  test("una pregunta «Enlace» no admite subir imágenes", async () => {
    expect(await permisoSubida(db(), SOLO, IND, "p1", AHORA)).toEqual({
      ok: false,
      error: "incompleta",
    });
  });
});

describe("parte de enlace (D468, D469)", () => {
  const ID = crearIdPublico("secreto-de-prueba-enlace");
  const accion = (
    uid: string,
    a: Parameters<typeof accionParteEnTransaccion>[2]["accion"],
  ) =>
    accionParteEnTransaccion(
      db(),
      uid,
      { tareaId: GRU, preguntaId: "p1", accion: a },
      AHORA,
      ID,
    );

  test("el asignado entrega un enlace válido; uno inseguro es `incompleta`", async () => {
    expect(
      await accion(CAPITAN, { tipo: "asignar", asignado: ID(ANA) }),
    ).toEqual({
      ok: true,
    });
    expect(
      await accion(ANA, {
        tipo: "entregar",
        respuesta: { url: "data:text/html,<b>hola</b>" },
      }),
    ).toEqual({ ok: false, error: "incompleta" });
    expect(
      await accion(ANA, {
        tipo: "entregar",
        respuesta: { texto: "https://www.figma.com/file/X" },
      }),
    ).toEqual({ ok: false, error: "incompleta" });
    expect(
      await accion(ANA, {
        tipo: "entregar",
        respuesta: { url: "figma.com/file/X" },
      }),
    ).toEqual({ ok: true });
    expect((await leerPartes(db(), idEntrega(GRU, EQUIPO)))[0]).toMatchObject({
      estado: "entregada",
      respuesta: { url: "https://figma.com/file/X" },
    });
  });
});
