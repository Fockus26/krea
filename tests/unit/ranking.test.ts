import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { puntosRanking } from "@/lib/grades";
import {
  mostrarChipEmpate,
  primerApellido,
  puntosEquipo,
  rankCompetition,
  ZONA_RIESGO,
  ZONA_RIESGO_EQUIPOS,
} from "@/lib/ranking";

const e = (id: string, puntos: number, apellido = id) => ({
  id,
  puntos,
  primerApellido: apellido,
});

describe("primerApellido", () => {
  test("primera palabra", () => {
    expect(primerApellido("Paredes Aranda")).toBe("Paredes");
    expect(primerApellido("  Nieto  Lucena ")).toBe("Nieto");
    expect(primerApellido("")).toBe("");
  });
});

describe("rankCompetition", () => {
  test("puestos 1-2-2-4 y empate", () => {
    const r = rankCompetition([e("a", 15), e("b", 19), e("c", 15), e("d", 10)]);
    expect(r.map((x) => [x.id, x.puesto, x.empate])).toEqual([
      ["b", 1, false],
      ["a", 2, true],
      ["c", 2, true],
      ["d", 4, false],
    ]);
  });

  test("desempata por primer apellido, con tildes en español", () => {
    const r = rankCompetition([
      e("1", 12, "Zapata"),
      e("2", 12, "Álvarez"),
      e("3", 12, "Blanco"),
      e("4", 12, "Ávila"),
    ]);
    expect(r.map((x) => x.primerApellido)).toEqual([
      "Álvarez",
      "Ávila",
      "Blanco",
      "Zapata",
    ]);
    expect(r.every((x) => x.puesto === 1 && x.empate)).toBe(true);
  });

  test("no muta la lista de entrada", () => {
    const lista = [e("a", 1), e("b", 2)];
    rankCompetition(lista);
    expect(lista.map((x) => x.id)).toEqual(["a", "b"]);
  });

  test("zona de riesgo: 5 últimos puestos", () => {
    const r = rankCompetition(
      [20, 19, 18, 17, 16, 15, 14, 13].map((p) => e(`p${p}`, p)),
    );
    expect(r.filter((x) => x.enRiesgo).map((x) => x.puntos)).toEqual([
      17, 16, 15, 14, 13,
    ]);
  });

  test("zona de riesgo incluye empatados en el borde (> 5 filas)", () => {
    // 8 filas; la 4.ª (5.ª desde el final) empata con la 3.ª y 4.ª → puesto 3.
    const r = rankCompetition([
      e("a", 20),
      e("b", 19),
      e("c", 15),
      e("d", 15),
      e("e", 14),
      e("f", 13),
      e("g", 12),
      e("h", 11),
    ]);
    // Últimos 5: d(3) e f g h → borde puesto 3 → entra también c(3).
    expect(r.filter((x) => x.enRiesgo).map((x) => x.id)).toEqual([
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
    ]);
    expect(r.find((x) => x.id === "b")?.enRiesgo).toBe(false);
  });

  test("zona por vista: estudiantes 5, equipos 1 (D255)", () => {
    expect(ZONA_RIESGO).toBe(5);
    expect(ZONA_RIESGO_EQUIPOS).toBe(1);
    const lista = [20, 19, 18, 17, 16, 15].map((p) => e(`p${p}`, p));
    expect(
      rankCompetition(lista, ZONA_RIESGO_EQUIPOS)
        .filter((x) => x.enRiesgo)
        .map((x) => x.puntos),
    ).toEqual([15]);
    expect(rankCompetition(lista).filter((x) => x.enRiesgo).length).toBe(5);
  });

  test("equipos: el último con sus empatados en el borde", () => {
    const r = rankCompetition(
      [e("a", 30), e("b", 22), e("c", 10), e("d", 10), e("f", 10)],
      ZONA_RIESGO_EQUIPOS,
    );
    expect(r.filter((x) => x.enRiesgo).map((x) => x.id)).toEqual([
      "c",
      "d",
      "f",
    ]);
    expect(r.filter((x) => x.enRiesgo).every((x) => x.puesto === 3)).toBe(true);
  });

  test("equipos: un solo equipo está en riesgo; lista vacía no falla", () => {
    expect(rankCompetition([e("a", 3)], ZONA_RIESGO_EQUIPOS)[0].enRiesgo).toBe(
      true,
    );
    expect(rankCompetition([], ZONA_RIESGO_EQUIPOS)).toEqual([]);
  });

  test("5 filas o menos: todas en riesgo; lista vacía no falla", () => {
    expect(
      rankCompetition([e("a", 3), e("b", 2)]).every((x) => x.enRiesgo),
    ).toBe(true);
    expect(rankCompetition([])).toEqual([]);
  });

  test("chip Empate solo en el top 10", () => {
    expect(
      mostrarChipEmpate({ puesto: 2, empate: true, enRiesgo: false }),
    ).toBe(true);
    expect(
      mostrarChipEmpate({ puesto: 10, empate: true, enRiesgo: false }),
    ).toBe(true);
    expect(
      mostrarChipEmpate({ puesto: 11, empate: true, enRiesgo: false }),
    ).toBe(false);
    expect(
      mostrarChipEmpate({ puesto: 2, empate: false, enRiesgo: false }),
    ).toBe(false);
  });
});

describe("puntosEquipo", () => {
  test("suma notas grupales >= 10 más ajustes", () => {
    expect(puntosEquipo([17])).toBe(17);
    expect(puntosEquipo([17, 9, null])).toBe(17);
    expect(puntosEquipo([14, 12], [2, -1])).toBe(27);
    expect(puntosEquipo([])).toBe(0);
  });

  test("seed: G2 19 · G3 18 · G1 17 · G5 17 · G4 15 · G6 14 (HANDOFF §8)", () => {
    const seed = join(import.meta.dir, "../../data/seed");
    const grupos = JSON.parse(
      readFileSync(join(seed, "grupos.json"), "utf8"),
    ) as Array<{
      id: string;
      seccion: string;
      notaGrupal: number | null;
      ajusteCapitan: number;
    }>;
    const de5A = grupos.filter((g) => g.seccion === "5A");
    const puntos = Object.fromEntries(
      de5A.map((g) => [
        g.id.split("-")[1].toUpperCase(),
        puntosEquipo([g.notaGrupal]),
      ]),
    );
    expect(puntos).toEqual({ G2: 19, G3: 18, G1: 17, G5: 17, G4: 15, G6: 14 });
    expect(puntosRanking(null)).toBe(0);
  });
});
