// Alta y baja de alumnos y gestión de equipos contra los emuladores (W12, D267–D270, D307): las
// transacciones reales del Admin SDK que usan las Server Actions de Alumnos y Equipos. Datos
// propios en 5A (cédulas 3975xxxx, equipos `w12-…`) para no cruzarse con las demás pruebas.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  borrarAuthAlumno,
  eliminarAlumnoEnTransaccion,
  equipoValidoPara,
  incorporarAlumnoEnTransaccion,
  resumenBorradoCon,
} from "@/lib/firebase/alumnos-alta";
import { crearCuentaCon } from "@/lib/firebase/cuentas";
import {
  crearEquipoEnTransaccion,
  editarEquipoEnTransaccion,
  eliminarEquipoEnTransaccion,
} from "@/lib/firebase/equipos-gestion";
import {
  type Ajuste,
  COL,
  type Entrega,
  type Equipo,
  idEntrega,
  type Usuario,
  zEntrega,
  zEquipo,
  zRankingSeccion,
  zUsuario,
} from "@/lib/modelo";
import { notaDeIntegrante } from "@/lib/ranking-datos";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const db = () => getFirestore(app());
const auth = () => getAuth(app());

const AHORA = Date.UTC(2026, 10, 6, 18);
const PROFE = "39759999";
const NUEVO = "39750001";
const CAP = "39750002"; // capitán de E_LLENO: se elimina
const OTRO = "39750003"; // integrante de E_LLENO: hereda el cargo
const E_VACIO = "w12-vacio";
const E_LLENO = "w12-lleno";
const E_CON_ENTREGA = "w12-con-entrega";
const E_CON_AJUSTE = "w12-con-ajuste";
const E_OTRA = "w12-otra-seccion";
const E_DISOLVER = "w12-disolver";
const D1 = "39750004"; // capitán de E_DISOLVER
const D2 = "39750005";

const alumno = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W12",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo = (
  nombre: string,
  capitanId: string | null,
  seccion: "5A" | "5C" = "5A",
): Equipo => ({ nombre, seccion, tema: null, capitanId, logoPath: null });

const evaluacion = (puntaje: number) => ({
  puntos: null,
  comentarios: {},
  puntaje,
  evaluadaPor: PROFE,
  evaluadaEn: 2,
});

const individual = (
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
  evaluacion: puntaje === null ? null : evaluacion(puntaje),
});

const grupal = (tareaId: string, equipoId: string): Entrega => ({
  tareaId,
  tipo: "grupal",
  titularId: equipoId,
  seccion: "5A",
  integrantes: [CAP, OTRO],
  estado: "evaluada",
  respuestas: { p1: { texto: "Lo hicimos juntos" } },
  enviadaPor: CAP,
  enviadaEn: 1,
  evaluacion: evaluacion(16),
});

const ajuste = (
  destino: "alumno" | "equipo",
  destinoId: string,
  anulaA: string | null = null,
): Ajuste => ({
  destino,
  destinoId,
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: anulaA ? -2 : 2,
  nota: null,
  autorId: PROFE,
  en: 3,
  anulaA,
});

const ranking = async () =>
  zRankingSeccion.parse(
    (await db().collection(COL.ranking).doc("5A").get()).data(),
  );
const existe = async (col: string, id: string) =>
  (await db().collection(col).doc(id).get()).exists;

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Sin emulador de Firestore");
  await auth()
    .deleteUser(NUEVO)
    .catch(() => {});
  const b = db().batch();
  const set = (col: string, id: string, data: object) =>
    b.set(db().collection(col).doc(id), data);
  b.delete(db().collection(COL.usuarios).doc(NUEVO));
  b.delete(db().collection(COL.privados).doc(NUEVO));
  set(COL.usuarios, PROFE, {
    ...alumno(PROFE, null),
    rol: "profesor",
    seccion: null,
  });
  set(COL.usuarios, CAP, alumno(CAP, E_LLENO));
  set(COL.usuarios, OTRO, alumno(OTRO, E_LLENO));
  set(COL.privados, CAP, { email: "cap@example.com" });
  set(COL.equipos, E_VACIO, equipo("W12 Vacío", null));
  set(COL.equipos, E_LLENO, equipo("W12 Lleno", CAP));
  set(COL.equipos, E_CON_ENTREGA, equipo("W12 Con entrega", null));
  set(COL.equipos, E_CON_AJUSTE, equipo("W12 Con ajuste", null));
  set(COL.equipos, E_OTRA, equipo("W12 Otra sección", null, "5C"));
  set(COL.entregas, idEntrega("w12-t1", CAP), individual("w12-t1", CAP, 18));
  set(COL.entregas, idEntrega("w12-t2", CAP), individual("w12-t2", CAP, 12));
  set(COL.entregas, idEntrega("w12-t3", CAP), individual("w12-t3", CAP, null));
  set(COL.entregas, idEntrega("w12-t1", OTRO), individual("w12-t1", OTRO, 15));
  set(COL.entregas, idEntrega("w12-g1", E_LLENO), grupal("w12-g1", E_LLENO));
  set(
    COL.entregas,
    idEntrega("w12-g1", E_CON_ENTREGA),
    grupal("w12-g1", E_CON_ENTREGA),
  );
  set(COL.ajustes, "w12-aj-cap", ajuste("alumno", CAP));
  set(COL.ajustes, "w12-aj-cap-anula", ajuste("alumno", CAP, "w12-aj-cap"));
  set(COL.ajustes, "w12-aj-otro", ajuste("alumno", OTRO));
  set(COL.ajustes, "w12-aj-equipo", ajuste("equipo", E_CON_AJUSTE));
  set(COL.historialBase, "w12-hist-cap", {
    alumnoId: CAP,
    de: 20,
    a: 18,
    motivo: "Acuerdo de conducta",
    autorId: PROFE,
    en: 1,
  });
  await b.commit();
}, 30_000);

describe("agregar alumno (D267)", () => {
  test("un equipo de otra sección no vale para un alumno de 5A", async () => {
    expect(await equipoValidoPara(db(), E_VACIO, "5A")).toBe(true);
    expect(await equipoValidoPara(db(), E_OTRA, "5A")).toBe(false);
    expect(await equipoValidoPara(db(), "w12-no-existe", "5A")).toBe(false);
  });

  test("crea la cuenta, entra en un equipo vacío como capitán y en el ranking", async () => {
    const { passwordTemporal } = await crearCuentaCon(
      auth(),
      db(),
      {
        rol: "estudiante",
        cedula: NUEVO,
        nombres: "Nuevo",
        apellidos: "Prueba W12",
        email: null,
        seccion: "5A",
      },
      AHORA,
    );
    expect(passwordTemporal.length).toBeGreaterThanOrEqual(12);
    const r = await incorporarAlumnoEnTransaccion(db(), NUEVO, E_VACIO, AHORA);
    expect(r).toEqual({ ok: true, afectados: [NUEVO] });
    const u = zUsuario.parse(
      (await db().collection(COL.usuarios).doc(NUEVO).get()).data(),
    );
    expect(u.equipoId).toBe(E_VACIO);
    expect(u.debeCambiarPassword).toBe(true);
    const e = zEquipo.parse(
      (await db().collection(COL.equipos).doc(E_VACIO).get()).data(),
    );
    expect(e.capitanId).toBe(NUEVO);
    const rk = await ranking();
    expect(rk.alumnos[NUEVO]).toMatchObject({ equipoId: E_VACIO, puntos: 0 });
  });

  test("sin equipo: igual reescribe el ranking; a un equipo de otra sección, no", async () => {
    expect(
      await incorporarAlumnoEnTransaccion(db(), NUEVO, E_OTRA, AHORA),
    ).toEqual({ ok: false, error: "otra-seccion" });
    // Dejar al nuevo fuera para las pruebas de eliminar equipo
    await db().collection(COL.usuarios).doc(NUEVO).update({ equipoId: null });
    await db().collection(COL.equipos).doc(E_VACIO).update({ capitanId: null });
    const r = await incorporarAlumnoEnTransaccion(db(), NUEVO, null, AHORA + 1);
    expect(r).toEqual({ ok: true, afectados: [] });
    const rk = await ranking();
    expect(rk.actualizadoEn).toBe(AHORA + 1);
    expect(rk.alumnos[NUEVO]?.equipoId).toBeNull();
  });
});

describe("eliminar alumno (D268, D269)", () => {
  test("el resumen cuenta notas, entregas sin nota, ajustes y la capitanía", async () => {
    const r = await resumenBorradoCon(db(), CAP);
    expect(r).toEqual({
      ok: true,
      resumen: {
        notas: 2,
        sinNota: 1,
        ajustes: 1,
        capitania: {
          equipo: "W12 Lleno",
          sucesor: `Alumno ${OTRO} Prueba W12`,
        },
      },
    });
  });

  test("un profe no se elimina por aquí; una cédula sin perfil, no existe", async () => {
    expect(await resumenBorradoCon(db(), PROFE)).toEqual({
      ok: false,
      error: "no-alumno",
    });
    expect(await eliminarAlumnoEnTransaccion(db(), PROFE, AHORA)).toEqual({
      ok: false,
      error: "no-alumno",
    });
    expect(await existe(COL.usuarios, PROFE)).toBe(true);
    expect(await resumenBorradoCon(db(), "39750099")).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("borra todo lo suyo en una transacción; la grupal y el equipo conservan su nota", async () => {
    // Ranking de partida con todos (el alta lo reescribe)
    await incorporarAlumnoEnTransaccion(db(), OTRO, E_LLENO, AHORA);
    const antes = await ranking();
    expect(antes.alumnos[CAP]).toBeDefined();
    const puntosEquipo = antes.equipos[E_LLENO]?.puntos;
    expect(puntosEquipo).toBeGreaterThan(0);

    const r = await eliminarAlumnoEnTransaccion(db(), CAP, AHORA + 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.imagenes.sort()).toEqual([
      `respuestas/w12-t1/${CAP}/p1.jpg`,
      `respuestas/w12-t2/${CAP}/p1.jpg`,
      `respuestas/w12-t3/${CAP}/p1.jpg`,
    ]);

    for (const t of ["w12-t1", "w12-t2", "w12-t3"])
      expect(await existe(COL.entregas, idEntrega(t, CAP))).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-cap")).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-cap-anula")).toBe(false);
    expect(await existe(COL.historialBase, "w12-hist-cap")).toBe(false);
    expect(await existe(COL.usuarios, CAP)).toBe(false);
    expect(await existe(COL.privados, CAP)).toBe(false);

    // Lo de los demás se queda
    expect(await existe(COL.entregas, idEntrega("w12-t1", OTRO))).toBe(true);
    expect(await existe(COL.ajustes, "w12-aj-otro")).toBe(true);
    const g = (
      await db()
        .collection(COL.entregas)
        .doc(idEntrega("w12-g1", E_LLENO))
        .get()
    ).data() as Entrega;
    expect(g.integrantes).toEqual([CAP, OTRO]);
    expect(g.evaluacion?.puntaje).toBe(16);

    // El cargo pasa al siguiente integrante
    const e = zEquipo.parse(
      (await db().collection(COL.equipos).doc(E_LLENO).get()).data(),
    );
    expect(e.capitanId).toBe(OTRO);

    const despues = await ranking();
    expect(despues.actualizadoEn).toBe(AHORA + 5);
    expect(despues.alumnos[CAP]).toBeUndefined();
    expect(despues.alumnos[OTRO]?.puntos).toBe(antes.alumnos[OTRO]?.puntos);
    expect(despues.equipos[E_LLENO]?.puntos).toBe(puntosEquipo);
  });

  test("repetir sobre un alumno ya borrado responde que no existe", async () => {
    expect(await eliminarAlumnoEnTransaccion(db(), CAP, AHORA)).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("borrarAuthAlumno borra al alumno, no a un profe, y es idempotente", async () => {
    await borrarAuthAlumno(auth(), NUEVO);
    expect(
      await auth()
        .getUser(NUEVO)
        .then(() => "sigue")
        .catch((e: { code?: string }) => e.code),
    ).toBe("auth/user-not-found");
    await borrarAuthAlumno(auth(), NUEVO);

    await auth()
      .deleteUser(PROFE)
      .catch(() => {});
    await auth().createUser({ uid: PROFE, password: "Prueba-W12-ok" });
    await auth().setCustomUserClaims(PROFE, {
      rol: "profesor",
      seccion: null,
      equipoId: null,
    });
    await borrarAuthAlumno(auth(), PROFE);
    expect((await auth().getUser(PROFE)).uid).toBe(PROFE);
    await auth().deleteUser(PROFE);
  });
});

describe("equipos (D270, D307–D309)", () => {
  let creado = "";

  test("crea un equipo sin capitán ni logo y lo suma al ranking", async () => {
    const r = await crearEquipoEnTransaccion(
      db(),
      { nombre: "W12 Nuevo", tema: "Cerámica", seccion: "5A" },
      AHORA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    creado = r.id;
    const e = zEquipo.parse(
      (await db().collection(COL.equipos).doc(creado).get()).data(),
    );
    expect(e).toEqual({
      nombre: "W12 Nuevo",
      seccion: "5A",
      tema: "Cerámica",
      capitanId: null,
      logoPath: null,
    });
    expect((await ranking()).equipos[creado]).toEqual({
      nombre: "W12 Nuevo",
      logoPath: null,
      puntos: 0,
    });
  });

  test("un nombre repetido en la sección (sin mirar mayúsculas ni tildes) no se crea", async () => {
    expect(
      await crearEquipoEnTransaccion(
        db(),
        { nombre: "w12 nuevo", tema: null, seccion: "5A" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "repetido" });
    expect(
      await editarEquipoEnTransaccion(
        db(),
        { equipoId: E_VACIO, nombre: "W12 NUEVO", tema: null },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "repetido" });
  });

  test("renombra y cambia el tema; el ranking lleva el nombre nuevo", async () => {
    const r = await editarEquipoEnTransaccion(
      db(),
      { equipoId: creado, nombre: "W12 Renombrado", tema: null },
      AHORA,
    );
    expect(r).toEqual({ ok: true, id: creado });
    const e = zEquipo.parse(
      (await db().collection(COL.equipos).doc(creado).get()).data(),
    );
    expect(e.nombre).toBe("W12 Renombrado");
    expect(e.tema).toBeNull();
    expect((await ranking()).equipos[creado]?.nombre).toBe("W12 Renombrado");
  });

  test("con integrantes, entregas y ajustes también se elimina: se deshace todo (D307)", async () => {
    // Datos propios: 2 integrantes, 1 grupal evaluada, 1 ajuste del equipo y 1 de un alumno
    const b = db().batch();
    b.set(db().collection(COL.usuarios).doc(D1), alumno(D1, E_DISOLVER));
    b.set(db().collection(COL.usuarios).doc(D2), alumno(D2, E_DISOLVER));
    b.set(
      db().collection(COL.equipos).doc(E_DISOLVER),
      equipo("W12 Disolver", D1),
    );
    b.set(db().collection(COL.entregas).doc(idEntrega("w12-g2", E_DISOLVER)), {
      ...grupal("w12-g2", E_DISOLVER),
      integrantes: [D1, D2],
      enviadaPor: D1,
    });
    b.set(
      db().collection(COL.ajustes).doc("w12-aj-disolver"),
      ajuste("equipo", E_DISOLVER),
    );
    b.set(db().collection(COL.ajustes).doc("w12-aj-d1"), ajuste("alumno", D1));
    await b.commit();
    await incorporarAlumnoEnTransaccion(db(), D2, E_DISOLVER, AHORA);
    const antes = await ranking();
    expect(antes.equipos[E_DISOLVER]?.puntos).toBeGreaterThan(0);
    const puntosD1 = antes.alumnos[D1]?.puntos;
    expect(puntosD1).toBeGreaterThan(0);

    const r = await eliminarEquipoEnTransaccion(db(), E_DISOLVER, AHORA + 9);
    expect(r.resultado).toEqual({ ok: true, id: E_DISOLVER });
    expect(r.afectados.sort()).toEqual([D1, D2]);
    expect(await existe(COL.equipos, E_DISOLVER)).toBe(false);

    // Integrantes «Sin equipo»
    for (const c of [D1, D2]) {
      const u = zUsuario.parse(
        (await db().collection(COL.usuarios).doc(c).get()).data(),
      );
      expect(u.equipoId).toBeNull();
      expect(u.actualizadoEn).toBe(AHORA + 9);
    }

    // La entrega se queda intacta con el nombre del equipo
    const g = zEntrega.parse(
      (
        await db()
          .collection(COL.entregas)
          .doc(idEntrega("w12-g2", E_DISOLVER))
          .get()
      ).data(),
    );
    expect(g.titularNombre).toBe("W12 Disolver");
    expect(g.titularId).toBe(E_DISOLVER);
    expect(g.integrantes).toEqual([D1, D2]);
    expect(g.evaluacion?.puntaje).toBe(16);

    // El ajuste del equipo se borra; el del alumno, no
    expect(await existe(COL.ajustes, "w12-aj-disolver")).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-d1")).toBe(true);

    // Ranking: sin el equipo; los alumnos conservan sus puntos y quedan sin equipo
    const despues = await ranking();
    expect(despues.actualizadoEn).toBe(AHORA + 9);
    expect(despues.equipos[E_DISOLVER]).toBeUndefined();
    expect(despues.alumnos[D1]).toMatchObject({
      equipoId: null,
      puntos: puntosD1,
    });

    // Su nota en la grupal sigue saliendo: la busca por `integrantes`, como el DAL
    const suyas = await db()
      .collection(COL.entregas)
      .where("integrantes", "array-contains", D2)
      .get();
    const deD2 = suyas.docs.map((d) => zEntrega.parse(d.data()));
    const nota = deD2.find((e) => e.tareaId === "w12-g2");
    expect(nota && notaDeIntegrante(nota, 20)).toBe(16);
  });

  test("con solo entregas o solo ajustes, igual: la entrega se queda y el ajuste se va", async () => {
    for (const id of [E_CON_ENTREGA, E_CON_AJUSTE]) {
      const r = await eliminarEquipoEnTransaccion(db(), id, AHORA);
      expect(r.resultado).toEqual({ ok: true, id });
      expect(r.afectados).toEqual([]);
      expect(await existe(COL.equipos, id)).toBe(false);
    }
    const g = (
      await db()
        .collection(COL.entregas)
        .doc(idEntrega("w12-g1", E_CON_ENTREGA))
        .get()
    ).data() as Entrega;
    expect(g.titularNombre).toBe("W12 Con entrega");
    expect(g.evaluacion?.puntaje).toBe(16);
    expect(await existe(COL.ajustes, "w12-aj-equipo")).toBe(false);
  });

  test("un equipo vacío se elimina y sale del ranking; repetir: no existe", async () => {
    const r = await eliminarEquipoEnTransaccion(db(), creado, AHORA);
    expect(r).toEqual({
      resultado: { ok: true, id: creado },
      logo: null,
      afectados: [],
    });
    expect(await existe(COL.equipos, creado)).toBe(false);
    expect((await ranking()).equipos[creado]).toBeUndefined();
    expect(
      (await eliminarEquipoEnTransaccion(db(), creado, AHORA)).resultado,
    ).toEqual({ ok: false, error: "no-existe" });
  });
});
