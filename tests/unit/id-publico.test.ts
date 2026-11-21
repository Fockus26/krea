// Id público de los alumnos (QA v2 F-M1, D493–D496): estable, distinto por cédula, sin la cédula
// dentro y atado al secreto; el ranking que recibe un alumno no lleva ninguna cédula.
import { describe, expect, test } from "bun:test";
import alumnosJson from "@/data/seed/alumnos.json";
import {
  cedulaDeId,
  conSemillaPublica,
  crearIdPublico,
  LARGO_ID_PUBLICO,
  rankingPublico,
} from "@/lib/id-publico";
import {
  type RankingSeccion,
  zIdPublico,
  zRankingPublico,
  zRankingSeccion,
} from "@/lib/modelo";
import { infoDeEquipos, itemsDeRanking } from "@/lib/ranking-en-vivo";

const SECRETO = "secreto-de-prueba-id-publico";
const ID = crearIdPublico(SECRETO);
const CEDULAS = alumnosJson.map((a) => String(a.cedula));
const [A = "", B = "", C = ""] = CEDULAS;

describe("crearIdPublico (D493)", () => {
  test("estable: la misma cédula da el mismo id, también con otra instancia del mismo secreto", () => {
    expect(ID(A)).toBe(ID(A));
    expect(crearIdPublico(SECRETO)(A)).toBe(ID(A));
  });

  test("22 caracteres base64url, con la forma que valida el cliente", () => {
    for (const c of CEDULAS) {
      expect(ID(c)).toHaveLength(LARGO_ID_PUBLICO);
      expect(zIdPublico.safeParse(ID(c)).success).toBe(true);
    }
  });

  test("distinto por cédula y sin la cédula dentro", () => {
    const ids = CEDULAS.map(ID);
    expect(new Set(ids).size).toBe(CEDULAS.length);
    for (const c of CEDULAS) {
      expect(ID(c)).not.toContain(c);
      // Ni un trozo largo de cifras que se le parezca
      expect(ID(c)).not.toMatch(/\d{7}/);
    }
  });

  test("atado al secreto: otro secreto da otros ids; sin secreto no hay id", () => {
    const otro = crearIdPublico("otro-secreto");
    for (const c of CEDULAS) expect(otro(c)).not.toBe(ID(c));
    expect(() => crearIdPublico("")).toThrow();
  });

  test("cedulaDeId: traduce solo entre las cédulas dadas (D495)", () => {
    expect(cedulaDeId(ID(B), [A, B], ID)).toBe(B);
    expect(cedulaDeId(ID(C), [A, B], ID)).toBeNull();
    expect(cedulaDeId(B, [A, B], ID)).toBeNull();
  });
});

describe("rankingPublico (D494)", () => {
  const fila = (semilla?: string) => ({
    nombres: "Prueba",
    apellidos: "Ranking",
    equipoId: "g1",
    estilo: "fun-emoji",
    ...(semilla === undefined ? {} : { semilla }),
    puntos: 10,
  });
  const r: RankingSeccion = {
    alumnos: {
      [A]: fila(`${A}-1-2`),
      [B]: fila("0f1e2d3c4b5a69788796a5b4c3d2e1f0"),
      [C]: fila(),
    },
    equipos: { g1: { nombre: "5A-G1", logoPath: null, puntos: 3 } },
    actualizadoEn: 5,
  };

  test("cada fila con su id público; la semilla con la cédula no sale (el avatar usa el id)", () => {
    const p = rankingPublico(r, ID);
    expect(Object.keys(p.alumnos).sort()).toEqual([ID(A), ID(B), ID(C)].sort());
    expect(p.alumnos[ID(A)]?.semilla).toBeUndefined();
    expect(p.alumnos[ID(B)]?.semilla).toBe("0f1e2d3c4b5a69788796a5b4c3d2e1f0");
    expect(p.equipos).toEqual(r.equipos);
    expect(p.actualizadoEn).toBe(5);
    const json = JSON.stringify(p);
    for (const c of [A, B, C]) expect(json).not.toContain(c);
    // La forma que valida el sondeo del alumno, y no la del profe
    expect(zRankingPublico.safeParse(p).success).toBe(true);
    expect(zRankingSeccion.safeParse(p).success).toBe(false);
  });

  test("las filas del alumno: «tú» por su id, el capitán por el suyo, el avatar sin cédula", () => {
    const info = infoDeEquipos(
      [{ id: "g1", tema: null, capitanId: A, logoPath: null }],
      new Map(),
      ID,
    );
    expect(info.g1?.capitan).toBe(ID(A));
    const tu = { id: ID(B), equipoId: "g1" };
    const p = rankingPublico(r, ID);
    const estudiantes = itemsDeRanking(p, "estudiantes", tu, info);
    expect(estudiantes.filter((i) => i.esTu).map((i) => i.id)).toEqual([ID(B)]);
    const equipos = itemsDeRanking(p, "equipos", tu, info);
    expect(equipos[0]?.subtitulo).toContain("capitán Prueba Ranking");
    const json = JSON.stringify({ info, estudiantes, equipos });
    for (const c of [A, B, C]) expect(json).not.toContain(c);
  });

  test("conSemillaPublica: cambia solo la semilla que contiene la cédula (D496)", () => {
    const u = (semilla: string) => ({
      cedula: A,
      avatar: { estilo: "fun-emoji", semilla },
    });
    expect(conSemillaPublica(u(`${A}-t-1`), ID).avatar.semilla).toBe(ID(A));
    const opaca = u("0f1e2d3c4b5a69788796a5b4c3d2e1f0");
    expect(conSemillaPublica(opaca, ID)).toBe(opaca);
  });
});
