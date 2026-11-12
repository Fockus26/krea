import { describe, expect, test } from "bun:test";
import alumnosJson from "@/data/seed/alumnos.json";
import gruposJson from "@/data/seed/grupos.json";
import tareaJson from "@/data/seed/tarea-identidad-marca.json";
import { rankingAlumnos, rankingEquipos } from "@/lib/demo/seed";
import { NOTA_MIN } from "@/lib/grades";
import type { Ajuste, Entrega } from "@/lib/modelo";
import {
  calcularRanking,
  noParticipo,
  notaDeIntegrante,
  puntosDeAlumno,
  puntosDeEquipoDatos,
} from "@/lib/ranking-datos";
import { docsDesdeSeed } from "@/lib/seed-firestore";

const evaluada = (over: Partial<Entrega> & { puntaje: number }): Entrega => ({
  tareaId: "t1",
  tipo: "individual",
  titularId: "11111111",
  seccion: "5A",
  integrantes: ["11111111"],
  estado: "evaluada",
  respuestas: {},
  enviadaPor: null,
  enviadaEn: null,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje: over.puntaje,
    evaluadaPor: null,
    evaluadaEn: 0,
  },
  ...over,
});

/** Grupal de eq1 (18/20) con `marcados` «No participó» (D364). */
const grupalSin = (marcados: string[]): Entrega => {
  const g = evaluada({
    puntaje: 18,
    tipo: "grupal",
    titularId: "eq1",
    integrantes: ["11111111", "22222222"],
  });
  return {
    ...g,
    evaluacion: g.evaluacion && { ...g.evaluacion, noParticiparon: marcados },
  };
};

const ajuste = (over: Partial<Ajuste>): Ajuste => ({
  destino: "alumno",
  destinoId: "11111111",
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: 2,
  nota: null,
  autorId: null,
  en: 0,
  anulaA: null,
  ...over,
});

describe("notaDeIntegrante", () => {
  test("aplica la base del integrante (D006, D013)", () => {
    expect(notaDeIntegrante(evaluada({ puntaje: 18.5 }), 15, "11111111")).toBe(
      13.9,
    );
  });
  test("sin evaluar → null", () => {
    expect(
      notaDeIntegrante(
        { ...evaluada({ puntaje: 10 }), estado: "entregada", evaluacion: null },
        20,
        "11111111",
      ),
    ).toBeNull();
  });
  test("grupal: el marcado «No participó» queda con NOTA_MIN, sin base; los demás no cambian (D365)", () => {
    const g = grupalSin(["22222222"]);
    expect(notaDeIntegrante(g, 15, "22222222")).toBe(NOTA_MIN);
    expect(notaDeIntegrante(g, 20, "22222222")).toBe(NOTA_MIN);
    // 18 × 15/20 = 13,5
    expect(notaDeIntegrante(g, 15, "11111111")).toBe(13.5);
    expect(noParticipo(g, "22222222")).toBe(true);
    expect(noParticipo(g, "11111111")).toBe(false);
  });
  test("una individual ignora la marca (solo existe en grupales)", () => {
    const base = evaluada({ puntaje: 18 });
    const ind: Entrega = {
      ...base,
      evaluacion: base.evaluacion && {
        ...base.evaluacion,
        noParticiparon: ["11111111"],
      },
    };
    expect(noParticipo(ind, "11111111")).toBe(false);
    expect(notaDeIntegrante(ind, 20, "11111111")).toBe(18);
  });
  test("evaluación vieja sin el campo: nadie marcado", () => {
    const g = evaluada({
      puntaje: 18,
      tipo: "grupal",
      titularId: "eq1",
      integrantes: ["11111111", "22222222"],
    });
    expect(notaDeIntegrante(g, 20, "22222222")).toBe(18);
  });
});

describe("puntosDeAlumno", () => {
  test("suma individuales y grupales que aportan, con su base también en la grupal (D177)", () => {
    const grupal = evaluada({
      puntaje: 18,
      tipo: "grupal",
      titularId: "eq1",
      integrantes: ["11111111", "22222222"],
    });
    // individual 16 × 15/20 = 12; grupal 18 × 15/20 = 13,5
    expect(
      puntosDeAlumno(
        { cedula: "11111111", base: 15 },
        [evaluada({ puntaje: 16 }), grupal],
        [],
      ),
    ).toBe(25.5);
  });
  test("una nota < 10 tras la base aporta 0 (D007)", () => {
    // 12 × 10/20 = 6
    expect(
      puntosDeAlumno(
        { cedula: "11111111", base: 10 },
        [evaluada({ puntaje: 12 })],
        [],
      ),
    ).toBe(0);
  });
  test("suma ajustes propios (con la anulación como inverso) y no los de otros", () => {
    const ajustes = [
      ajuste({ valor: 2 }),
      ajuste({ valor: -2, motivoId: "anulacion", anulaA: "x" }),
      ajuste({ valor: -1.5 }),
      ajuste({ destinoId: "22222222", valor: 5 }),
      ajuste({ destino: "equipo", destinoId: "11111111", valor: 5 }),
    ];
    expect(puntosDeAlumno({ cedula: "11111111", base: 20 }, [], ajustes)).toBe(
      -1.5,
    );
  });
  test("sin errores de coma flotante", () => {
    const entregas = [0.1, 0.2].map((_, i) =>
      evaluada({ puntaje: 13.5, tareaId: `t${i}` }),
    );
    // 13,5 × 13/20 = 8,775 → 8,8 (< 10 → 0); con base 17: 11,475 → 11,5 ×2 = 23
    expect(puntosDeAlumno({ cedula: "11111111", base: 17 }, entregas, [])).toBe(
      23,
    );
  });
});

describe("«No participó» en el ranking (D365)", () => {
  test("el marcado aporta 0 por esa grupal; el otro integrante, su nota", () => {
    const g = grupalSin(["22222222"]);
    expect(puntosDeAlumno({ cedula: "22222222", base: 20 }, [g], [])).toBe(0);
    expect(puntosDeAlumno({ cedula: "11111111", base: 20 }, [g], [])).toBe(18);
  });
  test("los puntos del equipo no cambian", () => {
    expect(puntosDeEquipoDatos("eq1", [grupalSin(["22222222"])], [])).toBe(
      puntosDeEquipoDatos("eq1", [grupalSin([])], []),
    );
    expect(puntosDeEquipoDatos("eq1", [grupalSin(["22222222"])], [])).toBe(18);
  });
});

describe("puntosDeEquipoDatos", () => {
  test("notas grupales sin base + ajustes del equipo", () => {
    const g = evaluada({
      puntaje: 17,
      tipo: "grupal",
      titularId: "eq1",
      integrantes: ["11111111"],
    });
    const ind = evaluada({ puntaje: 20 });
    expect(
      puntosDeEquipoDatos(
        "eq1",
        [g, ind],
        [ajuste({ destino: "equipo", destinoId: "eq1", valor: 1 })],
      ),
    ).toBe(18);
  });
});

describe("calcularRanking con el seed", () => {
  const docs = docsDesdeSeed(alumnosJson, gruposJson, tareaJson, 1);
  const datos = {
    usuarios: docs.usuarios.map((u) => u.data),
    equipos: docs.equipos.map((e) => ({ id: e.id, ...e.data })),
    entregas: docs.entregas.map((e) => e.data),
    ajustes: docs.ajustes.map((a) => a.data),
  };

  for (const s of ["5A", "5C"] as const) {
    test(`${s}: coincide con el ranking de las vistas previas (base 20, sin ajustes)`, () => {
      const r = calcularRanking(s, { ...datos, ajustes: [] }, 7);
      expect(r.actualizadoEn).toBe(7);
      for (const f of rankingAlumnos(s))
        expect(r.alumnos[f.cedula]?.puntos).toBe(f.puntos);
      for (const e of rankingEquipos(s))
        expect(r.equipos[e.id]?.puntos).toBe(e.puntos);
      expect(Object.keys(r.alumnos)).toHaveLength(rankingAlumnos(s).length);
    });
  }

  test("el ajuste del capitán del Excel resta al capitán", () => {
    const g = gruposJson.find((x) => x.ajusteCapitan !== 0);
    if (!g) return;
    const con = calcularRanking(g.seccion as "5A", datos, 0);
    const sin = calcularRanking(
      g.seccion as "5A",
      { ...datos, ajustes: [] },
      0,
    );
    expect(con.alumnos[g.capitanCedula]?.puntos).toBe(
      (sin.alumnos[g.capitanCedula]?.puntos ?? 0) + g.ajusteCapitan,
    );
  });
});
