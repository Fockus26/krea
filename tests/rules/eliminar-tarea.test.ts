// Eliminar una tarea contra el emulador de Firestore (D242): la transacción real del Admin SDK que
// usa la Server Action `eliminarTarea`. Borra la tarea y sus entregas, recalcula el ranking de las
// secciones sin esas notas y deja los ajustes (D007). Datos propios en 5A para no cruzarse con
// las pruebas de 5C.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { eliminarTareaEnTransaccion } from "@/lib/firebase/tareas";
import {
  type Ajuste,
  COL,
  type Entrega,
  idEntrega,
  type Tarea,
  type Usuario,
  zRankingSeccion,
} from "@/lib/modelo";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const db = () => getFirestore(app());

const AHORA = Date.UTC(2026, 11, 6, 15);
const PROFE = "30262232";
const A1 = "39740001";
const A2 = "39740002";
const T_BORRAR = "w4-borrar";
const T_QUEDA = "w4-queda";
const AJUSTE = "w4-ajuste";

const alumno = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W4",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea = (titulo: string): Tarea => ({
  titulo,
  tipo: "individual",
  secciones: ["5A"],
  estado: "evaluada",
  fechaEntrega: "2026-11-01",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "imagen", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
});

const evaluada = (
  tareaId: string,
  cedula: string,
  puntaje: number | null,
): Entrega => ({
  tareaId,
  tipo: "individual",
  titularId: cedula,
  seccion: "5A",
  integrantes: [cedula],
  estado: puntaje === null ? "entregada" : "evaluada",
  respuestas: { p1: { imagenPath: `respuestas/${tareaId}/${cedula}/p1.jpg` } },
  enviadaPor: cedula,
  enviadaEn: 1,
  evaluacion:
    puntaje === null
      ? null
      : {
          puntos: null,
          comentarios: {},
          puntaje,
          evaluadaPor: PROFE,
          evaluadaEn: 2,
        },
});

const ajuste: Ajuste = {
  destino: "alumno",
  destinoId: A1,
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: 2,
  nota: null,
  autorId: PROFE,
  en: 3,
  anulaA: null,
};

async function puntosDe(cedula: string) {
  const snap = await db().collection(COL.ranking).doc("5A").get();
  return zRankingSeccion.parse(snap.data()).alumnos[cedula]?.puntos;
}

const existe = async (col: string, id: string) =>
  (await db().collection(col).doc(id).get()).exists;

beforeAll(async () => {
  const b = db().batch();
  b.set(db().collection(COL.usuarios).doc(A1), alumno(A1));
  b.set(db().collection(COL.usuarios).doc(A2), alumno(A2));
  b.set(db().collection(COL.tareas).doc(T_BORRAR), tarea("Se borra"));
  b.set(db().collection(COL.tareas).doc(T_QUEDA), tarea("Se queda"));
  b.set(
    db().collection(COL.entregas).doc(idEntrega(T_BORRAR, A1)),
    evaluada(T_BORRAR, A1, 18),
  );
  b.set(
    db().collection(COL.entregas).doc(idEntrega(T_BORRAR, A2)),
    evaluada(T_BORRAR, A2, null),
  );
  b.set(
    db().collection(COL.entregas).doc(idEntrega(T_QUEDA, A1)),
    evaluada(T_QUEDA, A1, 15),
  );
  b.set(db().collection(COL.ajustes).doc(AJUSTE), ajuste);
  await b.commit();
  // El primer archivo paga el arranque en frío del emulador
}, 30_000);

describe("eliminar una tarea (emulador)", () => {
  test("borra la tarea y sus entregas, recalcula el ranking y deja los ajustes", async () => {
    const r = await eliminarTareaEnTransaccion(db(), T_BORRAR, AHORA);
    expect(r.resultado).toEqual({ ok: true, id: T_BORRAR });
    expect(r.imagenes.sort()).toEqual([
      `respuestas/${T_BORRAR}/${A1}/p1.jpg`,
      `respuestas/${T_BORRAR}/${A2}/p1.jpg`,
    ]);

    expect(await existe(COL.tareas, T_BORRAR)).toBe(false);
    expect(await existe(COL.entregas, idEntrega(T_BORRAR, A1))).toBe(false);
    expect(await existe(COL.entregas, idEntrega(T_BORRAR, A2))).toBe(false);
    // La otra tarea, su entrega y el ajuste siguen
    expect(await existe(COL.tareas, T_QUEDA)).toBe(true);
    expect(await existe(COL.entregas, idEntrega(T_QUEDA, A1))).toBe(true);
    expect(await existe(COL.ajustes, AJUSTE)).toBe(true);

    // 15 de la tarea que queda + 2 del ajuste; los 18 de la borrada ya no cuentan
    expect(await puntosDe(A1)).toBe(17);
    expect(await puntosDe(A2)).toBe(0);
  });

  test("una tarea que ya no existe: no-existe, sin tocar nada", async () => {
    const r = await eliminarTareaEnTransaccion(db(), T_BORRAR, AHORA + 1);
    expect(r).toEqual({
      resultado: { ok: false, error: "no-existe" },
      imagenes: [],
    });
  });

  test("sin entregas: borra la tarea y no escribe el ranking", async () => {
    const antes = (await db().collection(COL.ranking).doc("5A").get()).data();
    const vacia = "w4-vacia";
    await db().collection(COL.tareas).doc(vacia).set(tarea("Sin entregas"));
    const r = await eliminarTareaEnTransaccion(db(), vacia, AHORA + 2);
    expect(r).toEqual({ resultado: { ok: true, id: vacia }, imagenes: [] });
    expect(await existe(COL.tareas, vacia)).toBe(false);
    expect((await db().collection(COL.ranking).doc("5A").get()).data()).toEqual(
      antes,
    );
  });
});
