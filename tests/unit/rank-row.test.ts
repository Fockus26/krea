import { describe, expect, test } from "bun:test";
import {
  agruparAnuncios,
  anuncioTexto,
  conectoresVs,
  conectoresVsPodio,
  deltaDir,
  deltaTexto,
  deltaVisible,
  podiumLabel,
  puntosTexto,
  RIESGO_SEPARADOR,
  rankRowKind,
  rankRowLabel,
  splitRiesgo,
} from "@/lib/rank-row";
import { rankCompetition } from "@/lib/ranking";

const e = (id: string, puntos: number) => ({ id, puntos, primerApellido: id });

describe("deltaTexto / deltaVisible / deltaDir (§2.9)", () => {
  test("singular y plural", () => {
    expect(deltaTexto(2)).toBe("subió 2 puestos");
    expect(deltaTexto(1)).toBe("subió 1 puesto");
    expect(deltaTexto(-1)).toBe("bajó 1 puesto");
    expect(deltaTexto(-3)).toBe("bajó 3 puestos");
    expect(deltaTexto(0)).toBe("sin cambios");
  });

  test("texto visible: número o igual", () => {
    expect(deltaVisible(4)).toBe("4");
    expect(deltaVisible(-2)).toBe("2");
    expect(deltaVisible(0)).toBe("=");
  });

  test("sentido", () => {
    expect(deltaDir(2)).toBe("up");
    expect(deltaDir(-2)).toBe("down");
    expect(deltaDir(0)).toBe("eq");
  });
});

describe("puntosTexto", () => {
  test("coma es-VE y singular", () => {
    expect(puntosTexto(30.5)).toBe("30,5 puntos");
    expect(puntosTexto(17)).toBe("17 puntos");
    expect(puntosTexto(1)).toBe("1 punto");
    expect(puntosTexto(0)).toBe("0 puntos");
  });
});

describe("rankRowLabel", () => {
  test("ejemplo del handoff", () => {
    expect(
      rankRowLabel({
        puesto: 4,
        nombre: "Juana Montero",
        puntos: 30.5,
        delta: 2,
      }),
    ).toBe("Puesto 4, Juana Montero, 30,5 puntos, subió 2 puestos");
  });

  test("sin delta no lo menciona; empate y tú se añaden", () => {
    expect(
      rankRowLabel({
        puesto: 3,
        nombre: "Araceli Figueroa",
        puntos: 38,
        empate: true,
        esTu: true,
      }),
    ).toBe("Puesto 3, Araceli Figueroa, 38 puntos, empatado, eres tú");
  });

  test("podio", () => {
    expect(podiumLabel({ puesto: 1, nombre: "Noemí Rojas", puntos: 42 })).toBe(
      "Puesto 1, Noemí Rojas, 42 puntos",
    );
  });
});

describe("rankRowKind", () => {
  const lista = rankCompetition(
    Array.from({ length: 20 }, (_, i) =>
      e(`a${String(i).padStart(2, "0")}`, 100 - i),
    ),
  );

  test("top 10, normal y riesgo", () => {
    expect(rankRowKind(lista[0])).toBe("top");
    expect(rankRowKind(lista[9])).toBe("top");
    expect(rankRowKind(lista[10])).toBe("normal");
    expect(rankRowKind(lista[14])).toBe("normal");
    expect(rankRowKind(lista[15])).toBe("riesgo");
  });

  test("riesgo gana al top 10 cuando se solapan", () => {
    const corta = rankCompetition([e("a", 10), e("b", 9), e("c", 8)]);
    expect(corta.map(rankRowKind)).toEqual(["riesgo", "riesgo", "riesgo"]);
  });

  test("un 10.º empatado sigue siendo top", () => {
    const l = rankCompetition([
      ...Array.from({ length: 9 }, (_, i) => e(`t${i}`, 100 - i)),
      e("x", 50),
      e("y", 50),
      ...Array.from({ length: 6 }, (_, i) => e(`z${i}`, 10 - i)),
    ]);
    expect(rankRowKind(l[9])).toBe("top");
    expect(rankRowKind(l[10])).toBe("top");
  });
});

describe("splitRiesgo", () => {
  test("corta justo antes de la primera fila en riesgo, con empate en el borde", () => {
    const l = rankCompetition([
      ...Array.from({ length: 6 }, (_, i) => e(`t${i}`, 100 - i)),
      e("b1", 20),
      e("b2", 20),
      e("c", 15),
      e("d", 14),
      e("f", 13),
    ]);
    const { principal, riesgo } = splitRiesgo(l);
    expect(principal.length).toBe(6);
    expect(riesgo.map((f) => f.id)).toEqual(["b1", "b2", "c", "d", "f"]);
  });

  test("sin riesgo o todo en riesgo", () => {
    expect(splitRiesgo([{ enRiesgo: false }]).riesgo).toEqual([]);
    expect(splitRiesgo([{ enRiesgo: true }]).principal).toEqual([]);
    expect(splitRiesgo([])).toEqual({ principal: [], riesgo: [] });
  });
});

describe("separador y duelo VS (D256, D288)", () => {
  test("el separador dice solo «Zona de riesgo»", () => {
    expect(RIESGO_SEPARADOR).toBe("Zona de riesgo");
  });

  test("VS entre filas consecutivas con el mismo puesto", () => {
    const l = rankCompetition([
      ...Array.from({ length: 6 }, (_, i) => e(`t${i}`, 100 - i)),
      e("b1", 20),
      e("b2", 20),
      e("c", 15),
      e("d", 14),
      e("f", 13),
    ]);
    const { riesgo } = splitRiesgo(l);
    expect(conectoresVs(riesgo)).toEqual([true, false, false, false, false]);
  });

  test("tres empatados: dos conectores; sin empates, ninguno", () => {
    expect(
      conectoresVs([
        { puesto: 7 },
        { puesto: 7 },
        { puesto: 7 },
        { puesto: 10 },
      ]),
    ).toEqual([true, true, false, false]);
    expect(conectoresVs([{ puesto: 1 }, { puesto: 2 }])).toEqual([
      false,
      false,
    ]);
    expect(conectoresVs([])).toEqual([]);
  });

  test("VS también en la lista principal, fuera de la zona (D288)", () => {
    const l = rankCompetition([
      e("a", 90),
      e("b", 80),
      e("c", 80),
      e("d", 80),
      ...Array.from({ length: 6 }, (_, i) => e(`t${i}`, 70 - i)),
    ]);
    const { principal } = splitRiesgo(l);
    const vs = conectoresVs(principal);
    expect(vs.slice(0, 4)).toEqual([false, true, true, false]);
  });

  test("podio: el VS solo va entre columnas vecinas (2-1-3) (D289)", () => {
    // [1.º, 2.º, 3.º] por índice de lista; visualmente: lista[1] | lista[0] | lista[2]
    expect(conectoresVsPodio([1, 2, 3])).toEqual([false, false, false]);
    expect(conectoresVsPodio([1, 1, 3])).toEqual([false, true, false]);
    expect(conectoresVsPodio([1, 1, 1])).toEqual([true, true, false]);
    expect(conectoresVsPodio([1, 2, 2])).toEqual([false, false, false]);
    expect(conectoresVsPodio([1, 1])).toEqual([false, true]);
    expect(conectoresVsPodio([])).toEqual([]);
  });
});

describe("anuncios (§6)", () => {
  test("frases individuales", () => {
    expect(anuncioTexto({ tipo: "sube", nombre: "Adela", puesto: 4 })).toBe(
      "Adela subió al puesto 4",
    );
    expect(anuncioTexto({ tipo: "podio", nombre: "Adela" })).toBe(
      "Adela entró al podio",
    );
    expect(anuncioTexto({ tipo: "riesgo", nombre: "Adela" })).toBe(
      "Adela bajó a la zona de riesgo",
    );
  });

  test("uno solo, varios agrupados y ninguno", () => {
    expect(agruparAnuncios([])).toBe("");
    expect(agruparAnuncios([{ tipo: "podio", nombre: "Adela" }])).toBe(
      "Adela entró al podio",
    );
    expect(
      agruparAnuncios([
        { tipo: "sube", nombre: "Adela", puesto: 4 },
        { tipo: "podio", nombre: "Luis" },
        { tipo: "riesgo", nombre: "Eva" },
      ]),
    ).toBe(
      "3 cambios en el ranking: Adela subió al puesto 4; Luis entró al podio; Eva bajó a la zona de riesgo",
    );
  });
});
