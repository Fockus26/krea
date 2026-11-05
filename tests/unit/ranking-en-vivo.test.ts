import { describe, expect, test } from "bun:test";
import type { RankingSeccion } from "@/lib/modelo";
import {
  eventosEntre,
  infoDeEquipos,
  itemsDeRanking,
  movimientosEntre,
  puestosDe,
} from "@/lib/ranking-en-vivo";

const fila = (
  nombres: string,
  apellidos: string,
  puntos: number,
  equipoId: string | null = "g1",
  extra: { estilo?: string; semilla?: string } = {},
) => ({
  nombres,
  apellidos,
  equipoId,
  estilo: extra.estilo ?? "fun-emoji",
  ...(extra.semilla ? { semilla: extra.semilla } : {}),
  puntos,
});

const ranking = (puntos: Record<string, number>): RankingSeccion => ({
  alumnos: {
    "11111111": fila("Ana María", "Pérez Gil", puntos.a ?? 30, "g1", {
      semilla: "11111111-1-2",
    }),
    "22222222": fila("Luis", "Bravo", puntos.b ?? 20, "g2", {
      estilo: "pixel-art",
    }),
    "33333333": fila("Eva", "Cano", puntos.c ?? 10, null),
    "44444444": fila("Iris", "Díaz", puntos.d ?? 5, "g1"),
  },
  equipos: {
    g1: { nombre: "5A-G1 Barbería", logoPath: null, puntos: 17 },
    g2: { nombre: "5A-G2 Repostería", logoPath: null, puntos: 19 },
  },
  actualizadoEn: 0,
});

const tu = { cedula: "22222222", equipoId: "g2" };
const info = {
  g1: { tema: "Barbería", capitan: "11111111" },
  g2: { tema: null, capitan: null },
};

describe("itemsDeRanking", () => {
  test("estudiantes: orden, «tú», equipo, avatar con su semilla (o la cédula)", () => {
    const items = itemsDeRanking(ranking({}), "estudiantes", tu, info);
    expect(items.map((i) => i.id)).toEqual([
      "11111111",
      "22222222",
      "33333333",
      "44444444",
    ]);
    const [ana, luis, eva] = items;
    expect(ana).toMatchObject({
      nombre: "Ana Pérez",
      subtitulo: "5A-G1 Barbería",
      seed: "11111111-1-2",
      esTu: false,
      delta: undefined,
    });
    expect(luis).toMatchObject({
      esTu: true,
      seed: "22222222",
      estilo: "adventurer-neutral",
    });
    expect(eva?.subtitulo).toBe("Sin equipo");
  });

  test("equipos: integrantes, capitán y tema de la info del servidor", () => {
    const items = itemsDeRanking(ranking({}), "equipos", tu, info);
    expect(items.map((i) => i.id)).toEqual(["g2", "g1"]);
    expect(items[0]).toMatchObject({
      esTu: true,
      subtitulo: "1 integrante",
      tema: "5A-G2 Repostería",
    });
    expect(items[1]).toMatchObject({
      subtitulo: "2 integrantes · capitán Ana Pérez",
      tema: "Barbería",
    });
  });

  test("el chip es lo que cambió desde que se abrió la página", () => {
    const antes = puestosDe(
      itemsDeRanking(ranking({}), "estudiantes", tu, info),
    );
    const ahora = itemsDeRanking(
      ranking({ c: 40 }),
      "estudiantes",
      tu,
      info,
      antes,
    );
    expect(ahora.map((i) => [i.id, i.delta])).toEqual([
      ["33333333", 2],
      ["11111111", -1],
      ["22222222", -1],
      ["44444444", undefined],
    ]);
  });
});

describe("movimientos y anuncios", () => {
  const antes = itemsDeRanking(ranking({}), "estudiantes", tu, info);
  const despues = itemsDeRanking(ranking({ d: 35 }), "estudiantes", tu, info);

  test("una fila por cambio de puesto, subidas primero", () => {
    const m = movimientosEntre(antes, despues, 1000);
    expect(m.map((x) => [x.tipo, x.id])).toEqual([
      ["sube", "1000-44444444"],
      ["baja", "1000-11111111"],
      ["baja", "1000-22222222"],
      ["baja", "1000-33333333"],
    ]);
    expect(m[0]).toMatchObject({ nombre: "Iris Díaz", puesto: 1, cambio: 3 });
    expect(movimientosEntre(antes, antes, 1)).toEqual([]);
  });

  test("anuncia quién entra al podio y quién cae a riesgo; no las bajadas sin más", () => {
    // Con 4 filas todas están en riesgo (zona de 5): ninguna «entra» a riesgo
    expect(eventosEntre(antes, despues)).toEqual([
      { tipo: "podio", nombre: "Iris Díaz" },
    ]);
  });
});

describe("logos de equipo (D212)", () => {
  const conLogo = (logoPath: string | null): RankingSeccion => {
    const r = ranking({});
    return {
      ...r,
      equipos: {
        ...r.equipos,
        g1: { nombre: "5A-G1 Barbería", logoPath, puntos: 17 },
      },
    };
  };
  const infoLogos = infoDeEquipos(
    [
      {
        id: "g1",
        tema: "Barbería",
        capitanId: null,
        logoPath: "equipos/g1/a.webp",
      },
      { id: "g2", tema: null, capitanId: null, logoPath: null },
    ],
    new Map([["equipos/g1/a.webp", "https://firmada/a"]]),
  );

  test("pinta la URL firmada si el documento en vivo trae la misma ruta", () => {
    const items = itemsDeRanking(
      conLogo("equipos/g1/a.webp"),
      "equipos",
      tu,
      infoLogos,
    );
    const g1 = items.find((i) => i.id === "g1");
    expect(g1 && "src" in g1 ? g1.src : "x").toBe("https://firmada/a");
  });

  test("si el logo cambió con la página abierta: iniciales hasta recargar", () => {
    const items = itemsDeRanking(
      conLogo("equipos/g1/b.webp"),
      "equipos",
      tu,
      infoLogos,
    );
    const g1 = items.find((i) => i.id === "g1");
    expect(g1 && "src" in g1 ? g1.src : "x").toBeNull();
  });
});
