// Envío de entregas contra el emulador de Firestore (D196): la transacción real del Admin SDK.
// La subida a B2 no se prueba aquí (dobles en tests/unit/almacen.test.ts); las rutas de imagen
// se arman igual que la Server Action.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { carpetaEntrega, claveImagen } from "@/lib/entregas";
import { enviarEnTransaccion, permisoSubida } from "@/lib/firebase/entregas";
import {
  COL,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
  zEntrega,
} from "@/lib/modelo";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const db = () => getFirestore(app());

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
  const b = db().batch();
  b.set(db().collection(COL.usuarios).doc(CAPITAN), usuario(CAPITAN, EQUIPO));
  b.set(
    db().collection(COL.usuarios).doc(INTEGRANTE),
    usuario(INTEGRANTE, EQUIPO),
  );
  b.set(db().collection(COL.usuarios).doc(SOLO), usuario(SOLO, null));
  b.set(db().collection(COL.equipos).doc(EQUIPO), equipo);
  b.set(
    db().collection(COL.usuarios).doc(CAPITAN_2),
    usuario(CAPITAN_2, EQUIPO_2),
  );
  b.set(db().collection(COL.usuarios).doc(MOVIDO), usuario(MOVIDO, EQUIPO));
  b.set(db().collection(COL.equipos).doc(EQUIPO_2), {
    ...equipo,
    nombre: "W5 Equipo 2",
    capitanId: CAPITAN_2,
  });
  b.set(
    db().collection(COL.tareas).doc("w5-ind"),
    tarea("individual", "abierta"),
  );
  b.set(db().collection(COL.tareas).doc("w5-gru"), tarea("grupal", "abierta"));
  b.set(
    db().collection(COL.tareas).doc("w5-cerrada"),
    tarea("individual", "evaluada"),
  );
  for (const id of ["w5-ind", "w5-gru", "w5-cerrada"]) {
    for (const t of [SOLO, CAPITAN, EQUIPO, EQUIPO_2]) {
      b.delete(db().collection(COL.entregas).doc(idEntrega(id, t)));
    }
  }
  await b.commit();
});

describe("enviarEnTransaccion (emulador)", () => {
  test("individual: crea la entrega `entregada` y no se puede enviar dos veces", async () => {
    const envio = {
      tareaId: "w5-ind",
      respuestas: await respuestas("w5-ind", SOLO),
    };
    expect(await enviarEnTransaccion(db(), SOLO, envio, AHORA)).toEqual({
      ok: true,
    });
    const snap = await db()
      .collection(COL.entregas)
      .doc(idEntrega("w5-ind", SOLO))
      .get();
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
    expect(await enviarEnTransaccion(db(), SOLO, envio, AHORA + 1)).toEqual({
      ok: false,
      error: "ya-entregada",
    });
    expect(await permisoSubida(db(), SOLO, "w5-ind", "p1")).toEqual({
      ok: false,
      error: "ya-entregada",
    });
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
    const snap = await db()
      .collection(COL.entregas)
      .doc(idEntrega("w5-gru", EQUIPO))
      .get();
    expect(snap.get("integrantes")).toEqual([CAPITAN, INTEGRANTE, MOVIDO]);
    expect(snap.get("titularId")).toBe(EQUIPO);
  });

  test("grupal: el alumno movido tras la entrega se queda con su equipo viejo (F-A2, D221)", async () => {
    // Depende del test anterior: EQUIPO ya entregó w5-gru con MOVIDO dentro.
    await db()
      .collection(COL.usuarios)
      .doc(MOVIDO)
      .update({ equipoId: EQUIPO_2 });
    const envio = {
      tareaId: "w5-gru",
      respuestas: await respuestas("w5-gru", EQUIPO_2),
    };
    expect(await enviarEnTransaccion(db(), CAPITAN_2, envio, AHORA)).toEqual({
      ok: true,
    });
    const nueva = await db()
      .collection(COL.entregas)
      .doc(idEntrega("w5-gru", EQUIPO_2))
      .get();
    expect(nueva.get("integrantes")).toEqual([CAPITAN_2]);
    const conMovido = await db()
      .collection(COL.entregas)
      .where("tareaId", "==", "w5-gru")
      .where("integrantes", "array-contains", MOVIDO)
      .get();
    expect(conMovido.docs.map((d) => d.id)).toEqual([
      idEntrega("w5-gru", EQUIPO),
    ]);
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
      const s = await db()
        .collection(COL.entregas)
        .doc(idEntrega(t, tit))
        .get();
      expect(s.exists).toBe(false);
    }
  });
});
