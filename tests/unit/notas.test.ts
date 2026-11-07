import { describe, expect, test } from "bun:test";
import {
  CEDULA_DETALLE,
  CEDULA_RASPADO,
  detalleDe,
  misNotasDe,
} from "@/lib/demo/notas";
import { gradeColor } from "@/lib/grades";
import {
  alertaBaseTexto,
  aporteTexto,
  escalaDegradado,
  fechaNotaTexto,
  filtrarNotas,
  formulaBaseTexto,
  MARCA_10_PCT,
  marcaTuTexto,
  posicionEnEscala,
  preguntasResumenTexto,
  promedioNotas,
  puntajeTexto,
  tituloLista,
} from "@/lib/notas";

const filas = [
  { id: "a", tipo: "individual" as const },
  { id: "b", tipo: "grupal" as const },
  { id: "c", tipo: "individual" as const },
];

describe("filtrarNotas", () => {
  test("todas, individuales y grupales conservan el orden", () => {
    expect(filtrarNotas(filas, "todas").map((f) => f.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(filtrarNotas(filas, "individual").map((f) => f.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filtrarNotas(filas, "grupal").map((f) => f.id)).toEqual(["b"]);
  });
  test("título por filtro (lienzo: «Todas las notas»)", () => {
    expect(tituloLista("todas")).toBe("Todas las notas");
    expect(tituloLista("grupal")).toBe("Notas grupales");
  });
});

describe("leyenda", () => {
  test("el 10 queda al 47,4 % (§3)", () => {
    expect(Math.round(MARCA_10_PCT * 10) / 10).toBe(47.4);
  });
  test("el degradado sale de gradeColor, de 1 a 20", () => {
    const g = escalaDegradado();
    expect(g.startsWith("linear-gradient(90deg, ")).toBe(true);
    expect(g).toContain(`${gradeColor(1)} 0%`);
    expect(g).toContain(`${gradeColor(10)} 47.4%`);
    expect(g).toContain(`${gradeColor(20)} 100%`);
    expect(g).not.toContain("#295AC3");
  });
});

describe("resumen del detalle", () => {
  test("textos del lienzo", () => {
    expect(puntajeTexto(18.5)).toBe("18,5 / 20");
    expect(formulaBaseTexto(18.5, 15, 13.9)).toBe("18,5 × 15 / 20 = 13,9");
    expect(aporteTexto(13.9)).toBe("+13,9 pts");
    expect(alertaBaseTexto(15)).toBe(
      "Por acuerdo de conducta tu nota se calcula sobre 15. Lo que lograste en cada pregunta no cambia.",
    );
    expect(preguntasResumenTexto(8, 2)).toBe("8 preguntas · 2 con comentario");
    expect(preguntasResumenTexto(1, 0)).toBe("1 pregunta");
  });
  test("menos de 10 aporta 0 pts (D007)", () => {
    expect(aporteTexto(9.5)).toBe("0 pts");
  });
  test("meta de la fila: evaluada o vence", () => {
    expect(fechaNotaTexto(true, "2026-10-21")).toBe("evaluada el 21/10/2026");
    expect(fechaNotaTexto(false, "2026-11-06")).toBe("vence el 06/11/2026");
  });
});

describe("datos de ejemplo", () => {
  test("Heymi Sierra: 18,5 con los puntajes del lienzo y 2 comentarios", () => {
    const d = detalleDe(CEDULA_DETALLE);
    expect(d.puntaje).toBe(18.5);
    expect(d.final).toBe(18.5);
    expect(d.preguntas.map((p) => p.obtenido)).toEqual([
      1, 1, 3, 3, 2, 4, 4, 0.5,
    ]);
    expect(d.preguntas.filter((p) => p.comentario)).toHaveLength(2);
    expect(d.preguntas[0]?.enunciado).toBe("¿Cómo se llama la marca?");
  });
  test("con base 15: 13,9 y los puntos por pregunta sin escalar (§8)", () => {
    const d = detalleDe(CEDULA_DETALLE, 15);
    expect(d.final).toBe(13.9);
    expect(d.preguntas[2]?.obtenido).toBe(3);
  });
  test("raspado real: Angeles Mendez, 8", () => {
    expect(detalleDe(CEDULA_RASPADO).final).toBe(8);
  });
  test("Mis notas: evaluadas primero, luego pendientes; pendiente nunca 0 (D003)", () => {
    const n = misNotasDe();
    const primeraPendiente = n.findIndex((f) => f.nota === null);
    expect(primeraPendiente).toBeGreaterThan(0);
    expect(n.slice(primeraPendiente).every((f) => f.nota === null)).toBe(true);
    expect(
      n.slice(primeraPendiente).every((f) => f.fecha.startsWith("vence el")),
    ).toBe(true);
  });
});

describe("marcador «Tú» de la leyenda (D273)", () => {
  test("posicionEnEscala: 1 → 0 %, 10 → MARCA_10_PCT, 20 → 100 %", () => {
    expect(posicionEnEscala(1)).toBe(0);
    expect(posicionEnEscala(10)).toBe(MARCA_10_PCT);
    expect(posicionEnEscala(20)).toBe(100);
  });

  test("posicionEnEscala recorta fuera de 1–20", () => {
    expect(posicionEnEscala(0)).toBe(0);
    expect(posicionEnEscala(25)).toBe(100);
  });

  test("promedioNotas ignora Pendiente y redondea a la décima", () => {
    expect(promedioNotas([])).toBeNull();
    expect(promedioNotas([null, null])).toBeNull();
    expect(promedioNotas([15, null, 16])).toBe(15.5);
    expect(promedioNotas([10, 10, 11])).toBe(10.3);
  });

  test("marcaTuTexto usa coma decimal", () => {
    expect(marcaTuTexto(15.5)).toBe("Tú: 15,5");
    expect(marcaTuTexto(12)).toBe("Tú: 12");
  });
});
