// Aviso de tarea nueva por Web Push sobre Postgres en memoria (D335–D340): suscribir y quitar,
// destinatarios por sección (varios navegadores por alumno), limpieza de 404/410 y que publicar
// avise UNA vez (re-guardar o reintentar desde la cola no). El envío es un doble: sin red.
import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import {
  avisarParteEntregada,
  avisarTareaPublicada,
  borrarSuscripcion,
  type Destino,
  destinatarios,
  type Enviar,
  guardarSuscripcion,
} from "@/lib/data/push";
import { guardarTareaEnTransaccion } from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import { partes, pushSuscripciones } from "@/lib/db/schema";
import type { Usuario } from "@/lib/modelo";
import type { AvisoPush, SuscripcionPush } from "@/lib/push";
import type { EntradaTarea } from "@/lib/tareas-profe-datos";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const HOY = "2026-11-08";
const AHORA = Date.UTC(2026, 10, 8, 15);
const PROFE = "30262299";
const A1 = "39100001"; // 5A, dos navegadores
const A2 = "39100002"; // 5A
const C1 = "39100003"; // 5C
const OP = "7b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

const persona = (
  cedula: string,
  rol: Usuario["rol"],
  seccion: string | null,
): Usuario => ({
  cedula,
  rol,
  nombres: "Prueba",
  apellidos: "Push",
  seccion,
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: cedula },
  actualizadoEn: 1,
});

const sub = (n: string): SuscripcionPush => ({
  endpoint: `https://push.example.test/envio/${n}`,
  keys: { p256dh: `clave-${n}`, auth: `auth-${n}` },
});

const completa = (o: Partial<EntradaTarea> = {}): EntradaTarea => ({
  titulo: "Afiche de la feria",
  tipo: "individual",
  fecha: "2026-11-20",
  secciones: ["5A"],
  premio: null,
  preguntas: [{ id: "q1", enunciado: "Uno", formato: "texto", valor: 20 }],
  ...o,
});

/** Doble de `web-push`: anota cada envío y falla con el código que se le diga por endpoint. */
function doble(fallos: Record<string, number> = {}) {
  const enviados: { destino: Destino; aviso: AvisoPush }[] = [];
  const enviar: Enviar = async (destino, aviso) => {
    const codigo = fallos[destino.endpoint];
    if (codigo) throw Object.assign(new Error("push"), { statusCode: codigo });
    enviados.push({ destino, aviso });
  };
  return { enviar, enviados };
}

async function endpoints(cedula: string) {
  const filas = await db()
    .select({ endpoint: pushSuscripciones.endpoint })
    .from(pushSuscripciones)
    .where(eq(pushSuscripciones.cedula, cedula));
  return filas.map((f) => f.endpoint).sort();
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), persona(PROFE, "profesor", null));
  await docs.ponerUsuario(db(), persona(A1, "estudiante", "5A"));
  await docs.ponerUsuario(db(), persona(A2, "estudiante", "5A"));
  await docs.ponerUsuario(db(), persona(C1, "estudiante", "5C"));
});

describe("suscripciones (D335)", () => {
  test("varias por alumno; quitar solo borra la propia", async () => {
    await guardarSuscripcion(db(), A1, sub("a1-movil"), AHORA);
    await guardarSuscripcion(db(), A1, sub("a1-laptop"), AHORA);
    // El mismo navegador dos veces no duplica
    await guardarSuscripcion(db(), A1, sub("a1-laptop"), AHORA + 1);
    expect(await endpoints(A1)).toEqual([
      sub("a1-laptop").endpoint,
      sub("a1-movil").endpoint,
    ]);

    await guardarSuscripcion(db(), A2, sub("a2"), AHORA);
    // A2 no puede quitar la de A1
    await borrarSuscripcion(db(), A2, sub("a1-movil").endpoint);
    expect(await endpoints(A1)).toHaveLength(2);
    await borrarSuscripcion(db(), A2, sub("a2").endpoint);
    expect(await endpoints(A2)).toEqual([]);
  });

  test("un navegador que pasa a otra cuenta deja de avisarle a la anterior", async () => {
    await guardarSuscripcion(db(), C1, sub("compartido"), AHORA);
    await guardarSuscripcion(db(), A2, sub("compartido"), AHORA + 1);
    expect(await endpoints(C1)).toEqual([]);
    expect(await endpoints(A2)).toEqual([sub("compartido").endpoint]);
    await borrarSuscripcion(db(), A2, sub("compartido").endpoint);
  });

  test("destinatarios: solo alumnos de esas secciones, todos sus navegadores", async () => {
    await guardarSuscripcion(db(), C1, sub("c1"), AHORA);
    await guardarSuscripcion(db(), PROFE, sub("profe"), AHORA);
    const de5A = (await destinatarios(db(), ["5A"])).map((d) => d.endpoint);
    expect(de5A.sort()).toEqual([
      sub("a1-laptop").endpoint,
      sub("a1-movil").endpoint,
    ]);
    const ambas = await destinatarios(db(), ["5A", "5C"]);
    expect(ambas).toHaveLength(3);
    expect(ambas.find((d) => d.endpoint === sub("c1").endpoint)).toEqual({
      endpoint: sub("c1").endpoint,
      p256dh: "clave-c1",
      auth: "auth-c1",
    });
    expect(await destinatarios(db(), [])).toEqual([]);
    await borrarSuscripcion(db(), PROFE, sub("profe").endpoint);
  });

  test("se van con el alumno (cascada)", async () => {
    const OTRO = "39100009";
    await docs.ponerUsuario(db(), persona(OTRO, "estudiante", "5C"));
    await guardarSuscripcion(db(), OTRO, sub("otro"), AHORA);
    await docs.borrarDoc(db(), "usuarios", OTRO);
    expect(await endpoints(OTRO)).toEqual([]);
  });
});

describe("envío (D338)", () => {
  test("404/410 borran la suscripción; otros fallos solo se cuentan", async () => {
    await guardarSuscripcion(db(), A2, sub("a2-vencida"), AHORA);
    await guardarSuscripcion(db(), A2, sub("a2-caida"), AHORA);
    const { enviar, enviados } = doble({
      [sub("a2-vencida").endpoint]: 410,
      [sub("a2-caida").endpoint]: 500,
      [sub("a1-movil").endpoint]: 404,
    });
    const r = await avisarTareaPublicada(
      db(),
      { id: "t-envio", titulo: "Maqueta", secciones: ["5A"] },
      enviar,
    );
    expect(r).toEqual({ enviados: 1, vencidos: 2, fallidos: 1 });
    expect(enviados.map((e) => e.destino.endpoint)).toEqual([
      sub("a1-laptop").endpoint,
    ]);
    expect(enviados[0].aviso).toMatchObject({
      titulo: "Nueva tarea",
      cuerpo: "Maqueta",
      url: "/tareas/t-envio",
    });
    expect(await endpoints(A1)).toEqual([sub("a1-laptop").endpoint]);
    expect(await endpoints(A2)).toEqual([sub("a2-caida").endpoint]);
    await borrarSuscripcion(db(), A2, sub("a2-caida").endpoint);
  });
});

describe("publicar avisa una vez (D336)", () => {
  test("nueva → publicar trae el aviso; guardar la publicada no", async () => {
    const p = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      { id: null, accion: "publicar", tarea: completa() },
      HOY,
      AHORA,
    );
    if (!p.ok) throw new Error(p.error);
    expect(p.aviso).toEqual({
      id: p.id,
      titulo: "Afiche de la feria",
      secciones: ["5A"],
    });
    const g = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      {
        id: p.id,
        accion: "guardar",
        tarea: completa({ titulo: "Afiche (v2)" }),
      },
      HOY,
      AHORA + 1,
    );
    expect(g).toEqual({ ok: true, id: p.id });
  });

  test("borrador no avisa; publicar el borrador sí, con sus secciones", async () => {
    const b = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      {
        id: null,
        accion: "borrador",
        tarea: completa({ secciones: ["5A", "5C"] }),
      },
      HOY,
      AHORA,
    );
    if (!b.ok) throw new Error(b.error);
    expect(b.aviso).toBeUndefined();
    const p = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      {
        id: b.id,
        accion: "publicar",
        tarea: completa({ secciones: ["5C", "5A"] }),
      },
      HOY,
      AHORA + 1,
    );
    if (!p.ok) throw new Error(p.error);
    expect(p.aviso?.secciones).toEqual(["5A", "5C"]);
  });

  test("la cola reintenta el mismo publicar: el segundo no avisa", async () => {
    const envio = {
      id: null,
      accion: "publicar" as const,
      tarea: completa({ titulo: "Desde la cola" }),
      opId: OP,
    };
    const a = await guardarTareaEnTransaccion(db(), PROFE, envio, HOY, AHORA);
    const b = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      envio,
      HOY,
      AHORA + 1,
    );
    if (!a.ok || !b.ok) throw new Error("no se guardó");
    expect(a.aviso?.id).toBe(a.id);
    expect(b).toEqual({ ok: true, id: a.id });
  });

  test("un error al armar no avisa", async () => {
    const r = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      {
        id: null,
        accion: "publicar",
        tarea: completa({
          preguntas: [
            { id: "q1", enunciado: "Uno", formato: "texto", valor: 12 },
          ],
        }),
      },
      HOY,
      AHORA,
    );
    expect(r).toEqual({ ok: false, error: "invalida" });
  });
});

describe("aviso al capitán al entregar una parte (D535)", () => {
  const CAP = "39100021";
  const ANA = "39100022";
  const SIN_PARTE = "39100023";
  const EQUIPO = "s7-g1";
  const TAREA = "s7-grupal";

  const integrante = (cedula: string, equipoId: string | null): Usuario => ({
    ...persona(cedula, "estudiante", "5A"),
    nombres: "Ana María",
    apellidos: "Paredes Aranda",
    equipoId,
  });

  const fila = (preguntaId: string, asignado: string, estado: string) => ({
    entregaId: `${TAREA}__${EQUIPO}`,
    preguntaId,
    tareaId: TAREA,
    equipoId: EQUIPO,
    asignado,
    estado: estado as "entregada",
    respuesta: null,
    entregadaEn: null,
    actualizadoEn: AHORA,
  });

  beforeAll(async () => {
    await docs.ponerUsuario(db(), integrante(CAP, EQUIPO));
    await docs.ponerUsuario(db(), integrante(ANA, EQUIPO));
    await docs.ponerUsuario(db(), integrante(SIN_PARTE, null));
    await docs.ponerDoc(db(), "equipos", EQUIPO, {
      nombre: "G1",
      seccion: "5A",
      tema: null,
      capitanId: CAP,
      logoPath: null,
    });
    await docs.ponerDoc(db(), "tareas", TAREA, {
      titulo: "Maqueta del puente",
      tipo: "grupal",
      secciones: ["5A"],
      estado: "abierta",
      fechaEntrega: "2026-11-30",
      premio: null,
      preguntas: [
        { id: "p1", enunciado: "Uno", formato: "texto", valor: 10 },
        { id: "p2", enunciado: "Dos", formato: "texto", valor: 10 },
      ],
      importada: false,
      autorId: null,
      actualizadoEn: 1,
    });
    await db()
      .insert(partes)
      .values([
        fila("p1", ANA, "asignada"),
        fila("p2", ANA, "entregada"),
      ]);
    await guardarSuscripcion(db(), CAP, sub("cap-movil"), AHORA);
    await guardarSuscripcion(db(), CAP, sub("cap-laptop"), AHORA);
    await guardarSuscripcion(db(), ANA, sub("ana"), AHORA);
  });

  test("avisa solo a los navegadores del capitán, con nombre corto y sin cédula", async () => {
    const { enviar, enviados } = doble();
    const r = await avisarParteEntregada(
      db(),
      { uid: ANA, tareaId: TAREA, preguntaId: "p2" },
      enviar,
    );
    expect(r).toEqual({ enviados: 2, vencidos: 0, fallidos: 0 });
    expect(enviados.map((e) => e.destino.endpoint).sort()).toEqual([
      sub("cap-laptop").endpoint,
      sub("cap-movil").endpoint,
    ]);
    expect(enviados[0].aviso).toEqual({
      titulo: "Parte entregada",
      cuerpo: "Ana Paredes entregó la pregunta 2 de “Maqueta del puente”",
      url: `/tareas/${TAREA}`,
      etiqueta: `parte-${TAREA}-p2`,
    });
    expect(JSON.stringify(enviados[0].aviso)).not.toContain(ANA);
  });

  test("no avisa si la parte no está entregada (asignada, aceptada o devuelta)", async () => {
    const { enviar, enviados } = doble();
    expect(
      await avisarParteEntregada(
        db(),
        { uid: ANA, tareaId: TAREA, preguntaId: "p1" },
        enviar,
      ),
    ).toBeNull();
    for (const estado of ["aceptada", "devuelta"] as const) {
      await db()
        .update(partes)
        .set({ estado })
        .where(eq(partes.preguntaId, "p2"));
      expect(
        await avisarParteEntregada(
          db(),
          { uid: ANA, tareaId: TAREA, preguntaId: "p2" },
          enviar,
        ),
      ).toBeNull();
    }
    await db()
      .update(partes)
      .set({ estado: "entregada" })
      .where(eq(partes.preguntaId, "p2"));
    expect(enviados).toEqual([]);
  });

  test("no avisa a otro que no es el asignado, ni sin equipo, ni al capitán a sí mismo", async () => {
    const { enviar, enviados } = doble();
    for (const uid of [CAP, SIN_PARTE]) {
      expect(
        await avisarParteEntregada(
          db(),
          { uid, tareaId: TAREA, preguntaId: "p2" },
          enviar,
        ),
      ).toBeNull();
    }
    expect(enviados).toEqual([]);
  });

  test("un capitán sin suscripciones no falla; las vencidas se borran", async () => {
    const { enviar } = doble({ [sub("cap-movil").endpoint]: 410 });
    const r = await avisarParteEntregada(
      db(),
      { uid: ANA, tareaId: TAREA, preguntaId: "p2" },
      enviar,
    );
    expect(r).toEqual({ enviados: 1, vencidos: 1, fallidos: 0 });
    expect(await endpoints(CAP)).toEqual([sub("cap-laptop").endpoint]);
    await borrarSuscripcion(db(), CAP, sub("cap-laptop").endpoint);
    const vacio = await avisarParteEntregada(
      db(),
      { uid: ANA, tareaId: TAREA, preguntaId: "p2" },
      enviar,
    );
    expect(vacio).toEqual({ enviados: 0, vencido