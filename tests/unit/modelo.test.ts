import { describe, expect, test } from "bun:test";
import alumnosJson from "@/data/seed/alumnos.json";
import gruposJson from "@/data/seed/grupos.json";
import tareaJson from "@/data/seed/tarea-identidad-marca.json";
import { leerConfig, PROYECTO_DEMO } from "@/lib/firebase/config";
import { credencialesAdmin } from "@/lib/firebase/credenciales";
import {
  claimsDe,
  emailInterno,
  idEntrega,
  sumaValores,
  zAjuste,
  zEntrega,
  zTarea,
} from "@/lib/modelo";
import { docsDesdeSeed, TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";

const tareaBase = {
  titulo: "Plan de redes",
  tipo: "individual" as const,
  secciones: ["5A" as const],
  estado: "abierta" as const,
  fechaEntrega: "2026-11-07",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Uno", formato: "texto" as const, valor: 12.5 },
    { id: "p2", enunciado: "Dos", formato: "imagen" as const, valor: 7.5 },
  ],
  autorId: "10000000",
  actualizadoEn: 1,
};

describe("zTarea", () => {
  test("publicada suma exactamente 20 (D004)", () => {
    expect(zTarea.safeParse(tareaBase).success).toBe(true);
    const mal = { ...tareaBase, preguntas: tareaBase.preguntas.slice(0, 1) };
    expect(zTarea.safeParse(mal).success).toBe(false);
    expect(zTarea.safeParse({ ...mal, estado: "borrador" }).success).toBe(true);
  });
  test("premio también en individuales (D263); títulos con solo espacios no pasan", () => {
    expect(zTarea.safeParse({ ...tareaBase, premio: "Cine" }).success).toBe(
      true,
    );
    expect(
      zTarea.safeParse({ ...tareaBase, tipo: "grupal", premio: "Cine" })
        .success,
    ).toBe(true);
    expect(zTarea.safeParse({ ...tareaBase, titulo: "   " }).success).toBe(
      false,
    );
  });
  test("valores en pasos de 0,5 y fecha con año de 4 cifras", () => {
    const p = [{ id: "p1", enunciado: "x", formato: "texto", valor: 19.75 }];
    expect(
      zTarea.safeParse({ ...tareaBase, preguntas: p, estado: "borrador" })
        .success,
    ).toBe(false);
    expect(
      zTarea.safeParse({ ...tareaBase, fechaEntrega: "26-11-07" }).success,
    ).toBe(false);
  });
  test("sumaValores sin coma flotante", () => {
    expect(sumaValores([{ valor: 0.5 }, { valor: 19.5 }])).toBe(20);
  });
});

describe("zEntrega y zAjuste", () => {
  test("evaluada ⇔ con evaluación; individual = solo su titular", () => {
    const e = {
      tareaId: "t",
      tipo: "individual",
      titularId: "12345678",
      seccion: "5A",
      integrantes: ["12345678"],
      estado: "entregada",
      respuestas: { p1: { texto: "Hola" } },
      enviadaPor: "12345678",
      enviadaEn: 5,
      evaluacion: null,
    };
    expect(zEntrega.safeParse(e).success).toBe(true);
    expect(zEntrega.safeParse({ ...e, estado: "evaluada" }).success).toBe(
      false,
    );
    expect(
      zEntrega.safeParse({ ...e, integrantes: ["87654321"] }).success,
    ).toBe(false);
  });
  test("un ajuste no vale 0 ni fuera de pasos de 0,5", () => {
    const a = {
      destino: "alumno",
      destinoId: "12345678",
      seccion: "5A",
      motivoId: "otro",
      motivo: "Otro",
      valor: 0,
      nota: "x",
      autorId: null,
      en: 0,
      anulaA: null,
    };
    expect(zAjuste.safeParse(a).success).toBe(false);
    expect(zAjuste.safeParse({ ...a, valor: 0.25 }).success).toBe(false);
    expect(zAjuste.safeParse({ ...a, valor: -1.5 }).success).toBe(true);
  });
});

describe("utilidades", () => {
  test("email interno e id de entrega (D008)", () => {
    expect(emailInterno(" 12345678 ")).toBe("12345678@alumnos.krea.app");
    expect(() => emailInterno("12a")).toThrow();
    expect(idEntrega("t1", "5a-g1")).toBe("t1__5a-g1");
  });
  test("claims", () => {
    expect(
      claimsDe({ rol: "estudiante", seccion: "5A", equipoId: "5a-g1" }),
    ).toEqual({
      rol: "estudiante",
      seccion: "5A",
      equipoId: "5a-g1",
    });
  });
  test("claims: admin solo en un profesor; las marcas solo cuando son true (D231, D232)", () => {
    const profe = { rol: "profesor", seccion: null, equipoId: null } as const;
    expect(claimsDe({ ...profe, admin: true })).toEqual({
      ...profe,
      admin: true,
    });
    expect(Object.keys(claimsDe({ ...profe, admin: false }))).toEqual([
      "rol",
      "seccion",
      "equipoId",
    ]);
    expect(
      claimsDe({
        rol: "estudiante",
        seccion: "5A",
        equipoId: null,
        admin: true,
        debeCambiarPassword: true,
      }),
    ).toEqual({
      rol: "estudiante",
      seccion: "5A",
      equipoId: null,
      debeCambiarPassword: true,
    });
  });
});

describe("docsDesdeSeed", () => {
  const docs = docsDesdeSeed(alumnosJson, gruposJson, tareaJson, 42);
  test("un usuario y un privado por alumno, sin emails inventados", () => {
    expect(docs.usuarios).toHaveLength(alumnosJson.length);
    expect(docs.privados.every((p) => p.data.email === null)).toBe(true);
  });
  test("entrega individual solo de quien tiene nota (D003), con desglose si existe", () => {
    const conNota = alumnosJson.filter((a) => a.notaIndividual !== null);
    const ind = docs.entregas.filter((e) => e.data.tipo === "individual");
    expect(ind).toHaveLength(conNota.length);
    const conDesglose = ind.filter((e) => e.data.evaluacion?.puntos !== null);
    expect(conDesglose).toHaveLength(tareaJson.evaluaciones.length);
  });
  test("entrega grupal con la foto de integrantes del equipo", () => {
    const g = docs.entregas.find(
      (e) => e.id === idEntrega(TAREA_GRUPAL_SEED.id, "5a-g2"),
    );
    const esperados = alumnosJson
      .filter((a) => a.grupoId === "5a-g2")
      .map((a) => a.cedula);
    expect(g?.data.integrantes).toEqual(esperados);
  });
});

describe("config de Firebase", () => {
  test("sin variables y sin emuladores → null (no inventa claves)", () => {
    expect(leerConfig({})).toBeNull();
    expect(credencialesAdmin({})).toBeNull();
  });
  test("con emuladores completa el proyecto demo", () => {
    expect(leerConfig({ NEXT_PUBLIC_USE_EMULATORS: "true" })?.projectId).toBe(
      PROYECTO_DEMO,
    );
    expect(
      credencialesAdmin({ FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }),
    ).toEqual({
      tipo: "emulador",
      projectId: PROYECTO_DEMO,
    });
  });
  test("emulador con un proyecto real → null (nunca la base real)", () => {
    expect(
      credencialesAdmin({
        FIRESTORE_EMULATOR_HOST: "x",
        GCLOUD_PROJECT: "krea-prod",
      }),
    ).toBeNull();
  });
  test("cuenta de servicio: la clave con \\n literales se normaliza", () => {
    const c = credencialesAdmin({
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "krea",
      FIREBASE_CLIENT_EMAIL: "a@b.iam.gserviceaccount.com",
      FIREBASE_PRIVATE_KEY: "-----BEGIN-----\\nabc\\n-----END-----",
    });
    expect(c?.tipo === "servicio" && c.privateKey.includes("\n")).toBe(true);
  });
});
