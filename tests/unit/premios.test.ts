import { describe, expect, test } from "bun:test";
import { NOMBRES_EQUIPO, TARJETAS_PREMIOS } from "@/lib/demo/premios";
import {
  agregarPremioHref,
  agregarPremioLabel,
  avancePremioTexto,
  compartidoChipTexto,
  darPremioLabel,
  decisionAviso,
  empateChipTexto,
  estadoPremio,
  ganoTexto,
  listaY,
  menuPremioLabel,
  nombreCortoEquipo,
  notaFechaTexto,
  resolverEmpate,
  subtituloPremio,
} from "@/lib/premios";

const notas = [
  { id: "a", nota: 19 },
  { id: "b", nota: 17 },
  { id: "c", nota: null },
];

describe("estadoPremio", () => {
  test("ganado con equipo único en la mejor nota", () => {
    expect(
      estadoPremio(
        { estado: "evaluada", premio: "P", fecha: "2026-10-17" },
        notas,
      ),
    ).toEqual({
      tipo: "ganado",
      titularId: "a",
      nota: 19,
      fecha: "2026-10-17",
    });
  });
  test("empate: todos los de la mejor nota", () => {
    expect(
      estadoPremio({ estado: "evaluada", premio: "P", fecha: "2026-10-24" }, [
        { id: "a", nota: 18.5 },
        { id: "b", nota: 18.5 },
        { id: "c", nota: 17 },
      ]),
    ).toEqual({
      tipo: "empate",
      titularIds: ["a", "b"],
      nota: 18.5,
      fecha: "2026-10-24",
    });
  });
  test("en juego (abierta) con avance", () => {
    expect(
      estadoPremio(
        {
          estado: "abierta",
          premio: "P",
          fecha: "2026-11-07",
          avance: { entregaron: 3, total: 12 },
        },
        notas,
      ),
    ).toEqual({
      tipo: "en-juego",
      entregaron: 3,
      total: 12,
      vence: "2026-11-07",
    });
  });
  test("por definir: sin premio o borrador", () => {
    expect(estadoPremio({ estado: "borrador", fecha: null }, [])).toEqual({
      tipo: "por-definir",
    });
    expect(
      estadoPremio({ estado: "evaluada", fecha: "2026-10-17" }, notas),
    ).toEqual({ tipo: "por-definir" });
  });
  test("evaluada sin notas aún: sigue en juego", () => {
    expect(
      estadoPremio({ estado: "evaluada", premio: "P", fecha: "2026-10-17" }, [
        { id: "a", nota: null },
      ]).tipo,
    ).toBe("en-juego");
  });
});

describe("resolverEmpate", () => {
  const empate = {
    tipo: "empate",
    titularIds: ["a", "b"],
    nota: 18.5,
    fecha: "2026-10-24",
  } as const;
  test("dar a un equipo", () => {
    expect(resolverEmpate(empate, { tipo: "dar", equipoId: "b" })).toEqual({
      tipo: "ganado",
      titularId: "b",
      nota: 18.5,
      fecha: "2026-10-24",
    });
  });
  test("compartir", () => {
    expect(resolverEmpate(empate, { tipo: "compartir" })).toEqual({
      ...empate,
      tipo: "compartido",
    });
  });
  test("equipo que no empató o estado distinto: sin cambios", () => {
    expect(resolverEmpate(empate, { tipo: "dar", equipoId: "z" })).toBe(empate);
    const ganado = {
      tipo: "ganado",
      titularId: "a",
      nota: 19,
      fecha: "x",
    } as const;
    expect(resolverEmpate(ganado, { tipo: "compartir" })).toBe(ganado);
  });
});

describe("textos", () => {
  test("lienzo", () => {
    expect(ganoTexto("5A-G2 Repostería")).toBe("Ganó 5A-G2 Repostería");
    expect(notaFechaTexto(19, "2026-10-24")).toBe("nota 19 · 24/10/2026");
    expect(notaFechaTexto(18.5, "2026-10-24")).toBe("nota 18,5 · 24/10/2026");
    expect(avancePremioTexto(3, 12, "2026-10-30")).toBe(
      "3 de 12 equipos entregaron · vence 30/10/2026",
    );
    expect(subtituloPremio("Logo", "5A", false)).toBe("Logo · 5A");
    expect(subtituloPremio("Plan de redes sociales", "5A", true)).toBe(
      "Plan de redes sociales · borrador",
    );
    expect(empateChipTexto(["G2", "G5"])).toBe("Empate: G2 y G5");
    expect(compartidoChipTexto(["G1", "G2", "G5"])).toBe(
      "Compartido: G1, G2 y G5",
    );
    expect(nombreCortoEquipo("5A-G2 Repostería")).toBe("G2");
    expect(nombreCortoEquipo("Equipo raro")).toBe("Equipo raro");
    expect(listaY([])).toBe("");
    expect(menuPremioLabel("Cine")).toBe("Opciones del premio Cine");
    expect(darPremioLabel("5A-G2 Repostería")).toBe(
      "Dar el premio a 5A-G2 Repostería",
    );
    expect(agregarPremioLabel("Plan de redes sociales")).toBe(
      "Agregar premio a Plan de redes sociales",
    );
    expect(agregarPremioHref("plan-redes")).toBe("/profe/tareas/plan-redes");
    expect(
      decisionAviso({ tipo: "dar", equipoId: "a" }, "5A-G2 Repostería", []),
    ).toBe("Premio para 5A-G2 Repostería");
    expect(decisionAviso({ tipo: "compartir" }, "", ["G2", "G5"])).toBe(
      "Premio compartido: G2 y G5",
    );
  });
});

describe("datos de ejemplo", () => {
  test("hay una tarjeta de cada estado base", () => {
    const tipos = TARJETAS_PREMIOS.map((t) => t.estado.tipo);
    expect(tipos).toEqual(["ganado", "en-juego", "empate", "por-definir"]);
  });
  test("el ganado es 5A-G2 con 19; el empate es G2 y G5", () => {
    const g = TARJETAS_PREMIOS[0]?.estado;
    expect(g).toMatchObject({ tipo: "ganado", titularId: "5a-g2", nota: 19 });
    expect(NOMBRES_EQUIPO["5a-g2"]).toBe("5A-G2 Repostería");
    expect(TARJETAS_PREMIOS[2]?.estado).toMatchObject({
      titularIds: ["5a-g2", "5a-g5"],
    });
  });
});
