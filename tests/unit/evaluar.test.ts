import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewHeader } from "@/components/sections/evaluar/review-header";
import { ReviewIndex } from "@/components/sections/evaluar/review-index";
import { COLA, evaluarVista } from "@/lib/demo/evaluar";
import {
  activaTexto,
  baseChipTexto,
  baseEfectiva,
  conIndice,
  DESHACER_MS,
  entregaLinea,
  esAtajoGuardar,
  estaCompleta,
  eyebrowEvaluar,
  faltanCortoTexto,
  horaCivilTexto,
  indiceChips,
  indiceTitulo,
  normalizarPuntajes,
  notaGuardada,
  notaGuardadaTexto,
  sigueCortoTexto,
  tipoChipTexto,
  tituloEntrega,
  vecinos,
} from "@/lib/evaluar";

describe("cabecera (lienzo Evaluar)", () => {
  test("posición en la cola", () => {
    expect(eyebrowEvaluar(0, 7)).toBe("Por evaluar · entrega 1 de 7");
    expect(tituloEntrega(6, 7)).toBe("Entrega 7 de 7");
  });

  test("hora civil a 12 horas, sin huso", () => {
    expect(horaCivilTexto("16:12")).toBe("4:12 p. m.");
    expect(horaCivilTexto("9:05")).toBe("9:05 a. m.");
    expect(horaCivilTexto("00:30")).toBe("12:30 a. m.");
    expect(horaCivilTexto("12:00")).toBe("12:00 p. m.");
    expect(() => horaCivilTexto("25:00")).toThrow(RangeError);
    expect(() => horaCivilTexto("4 pm")).toThrow(RangeError);
  });

  test("línea de entrega: grupal con capitán, individual sin autor", () => {
    expect(
      entregaLinea({
        tarea: "Logo y paleta del emprendimiento",
        tipo: "grupal",
        autor: "Raquel Figueroa",
        femenino: true,
        fecha: "2026-10-25",
        hora: "16:12",
      }),
    ).toBe(
      "Logo y paleta del emprendimiento · entregó Raquel Figueroa (capitana) el 25/10/2026, 4:12 p. m.",
    );
    expect(
      entregaLinea({
        tarea: "Plan",
        tipo: "grupal",
        autor: "Yolanda Calderón",
        fecha: "2026-10-23",
        hora: "17:00",
      }),
    ).toContain("(capitán)");
    expect(
      entregaLinea({
        tarea: "Identidad de marca",
        tipo: "individual",
        fecha: "2026-10-25",
        hora: "15:05",
      }),
    ).toBe("Identidad de marca · entregó el 25/10/2026, 3:05 p. m.");
  });

  test("chips de tipo y base (D014: grupal sin base)", () => {
    expect(tipoChipTexto("grupal", 4)).toBe("Grupal · 4 integrantes");
    expect(tipoChipTexto("grupal", 1)).toBe("Grupal · 1 integrante");
    expect(tipoChipTexto("individual")).toBe("Individual");
    expect(baseChipTexto("grupal", 15)).toBe("Base 20 · todos");
    expect(baseChipTexto("individual", 15)).toBe("Base 15");
    expect(baseChipTexto("individual", 17.5)).toBe("Base 17,5");
    expect(baseEfectiva("grupal", 15)).toBe(20);
    expect(baseEfectiva("individual", 15)).toBe(15);
  });
});

describe("completitud y nota", () => {
  test("completa solo con todas puntuadas; un 0 sí cuenta (≠ null, D003)", () => {
    expect(estaCompleta([5.5, 3.5, null])).toBe(false);
    expect(estaCompleta([0, 0, 0])).toBe(true);
    expect(estaCompleta([])).toBe(false);
  });

  test("nota con base por notaFinal (D013); null sin puntuar", () => {
    expect(notaGuardada([6, 4, 4, 3, 1.5], 20)).toBe(18.5);
    expect(notaGuardada([6, 4, 4, 3, 1.5], 15)).toBe(13.9);
    expect(notaGuardada([null, null], 20)).toBeNull();
    expect(notaGuardadaTexto(18.5)).toBe("Nota guardada · 18,5");
  });

  test("normaliza lo que el stepper dejó sin ajustar antes de guardar", () => {
    expect(normalizarPuntajes([3.2, null, 9], [4, 4, 7])).toEqual([3, null, 7]);
  });

  test("deshacer dura 5 s (§3)", () => {
    expect(DESHACER_MS).toBe(5000);
  });
});

describe("textos de la acción", () => {
  const sig = { nombre: "Mateo Paredes", tarea: "Identidad de marca" };

  test("escritorio: motivo y siguiente", () => {
    expect(activaTexto(5, false, sig)).toBe(
      "Se activa al puntuar las 5. Sigue: Mateo Paredes · Identidad de marca",
    );
    expect(activaTexto(5, true, sig)).toBe(
      "Sigue: Mateo Paredes · Identidad de marca",
    );
    expect(activaTexto(1, false, null)).toBe(
      "Se activa al puntuar la pregunta. Es la última entrega por evaluar.",
    );
  });

  test("móvil: faltan y sigue", () => {
    expect(faltanCortoTexto(3)).toBe("Faltan 3 por puntuar");
    expect(faltanCortoTexto(1)).toBe("Falta 1 por puntuar");
    expect(faltanCortoTexto(0)).toBe("Todo puntuado");
    expect(sigueCortoTexto(sig)).toBe("Sigue: Mateo Paredes");
    expect(sigueCortoTexto(null)).toBe("Es la última entrega");
  });
});

describe("índice de preguntas (Contenido extremo)", () => {
  test("aparece desde 6 preguntas", () => {
    expect(conIndice(5)).toBe(false);
    expect(conIndice(6)).toBe(true);
  });

  test("estado en el nombre accesible, no solo en el color", () => {
    const chips = indiceChips([2, null, null], 1);
    expect(chips.map((c) => c.label)).toEqual([
      "Pregunta 1, puntuada",
      "Pregunta 2, sin puntuar, actual",
      "Pregunta 3, sin puntuar",
    ]);
    expect(indiceTitulo([1, 2, null, null])).toBe(
      "Preguntas · 2 de 4 puntuadas",
    );
  });

  test("HTML: enlaces a #pregunta-n y aria-current en la actual", () => {
    const html = renderToStaticMarkup(
      createElement(ReviewIndex, { scores: [1, null], actual: 1 }),
    );
    expect(html).toContain('aria-label="Ir a la pregunta"');
    expect(html).toContain('href="#pregunta-1"');
    expect(html.match(/aria-current="step"/g)?.length).toBe(1);
  });
});

describe("cola y atajo", () => {
  test("vecinos en los extremos", () => {
    expect(vecinos(0, 7)).toEqual({ anterior: null, siguiente: 1 });
    expect(vecinos(3, 7)).toEqual({ anterior: 2, siguiente: 4 });
    expect(vecinos(6, 7)).toEqual({ anterior: 5, siguiente: null });
  });

  const tecla = (o: Partial<Parameters<typeof esAtajoGuardar>[0]>) => ({
    key: "Enter",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...o,
  });

  test("Ctrl+Enter o Cmd+Enter guardan; Enter solo, nunca", () => {
    expect(esAtajoGuardar(tecla({ ctrlKey: true }))).toBe(true);
    expect(esAtajoGuardar(tecla({ metaKey: true }))).toBe(true);
    expect(esAtajoGuardar(tecla({}))).toBe(false);
    expect(esAtajoGuardar(tecla({ ctrlKey: true, shiftKey: true }))).toBe(
      false,
    );
    expect(esAtajoGuardar(tecla({ key: "5", ctrlKey: true }))).toBe(false);
  });
});

describe("cola de ejemplo (brief: 7 entregas, 4 individuales · 3 grupales)", () => {
  test("forma fijada por el brief", () => {
    expect(COLA.length).toBe(7);
    expect(COLA.filter((e) => e.tipo === "individual").length).toBe(4);
    expect(COLA.filter((e) => e.tipo === "grupal").length).toBe(3);
  });

  test("cada entrega suma exactamente 20 (D004)", () => {
    for (const e of COLA) {
      expect(e.preguntas.reduce((a, p) => a + p.valor, 0)).toBe(20);
    }
  });

  test("1.ª: 5A-G2 Repostería, 2 de 5 puntuadas = 9 / 20 (lienzo)", () => {
    const v = evaluarVista(0);
    expect(v.titulo).toBe("5A-G2 Repostería");
    expect(v.linea).toBe(
      "Logo y paleta del emprendimiento · entregó Raquel Figueroa (capitana) el 25/10/2026, 4:12 p. m.",
    );
    expect(v.chips.tipoTexto).toBe("Grupal · 4 integrantes");
    expect(v.chips.base).toBe("Base 20 · todos");
    expect(v.chips.premio).toBe("Salida al cine con todo pago");
    expect(v.siguiente).toEqual({
      nombre: "Mateo Paredes",
      tarea: "Identidad de marca",
    });
    const puntajes = v.entrega.preguntas.map((p) => p.puntaje ?? null);
    expect(puntajes.filter((p) => p !== null)).toEqual([5.5, 3.5]);
  });

  test("2.ª: Mateo Paredes · Identidad de marca, individual", () => {
    const v = evaluarVista(1);
    expect(v.titulo).toBe("Mateo Paredes");
    expect(v.entrega.tipo).toBe("individual");
    expect(v.chips.tipoTexto).toBe("Individual");
  });

  test("extremo: ≥ 6 preguntas y una de valor > 6 (stepper)", () => {
    const v = evaluarVista(6);
    expect(conIndice(v.entrega.preguntas.length)).toBe(true);
    expect(v.entrega.preguntas.some((p) => p.valor > 6)).toBe(true);
    expect(v.siguiente).toBeNull();
  });

  test("los puntajes de ejemplo caben en su pregunta y van en pasos de 0,5", () => {
    for (const e of COLA)
      for (const p of e.preguntas) {
        if (p.puntaje == null) continue;
        expect(p.puntaje).toBeLessThanOrEqual(p.valor);
        expect((p.puntaje * 2) % 1).toBe(0);
      }
  });

  test("HTML de la cabecera: un h1 y Anterior deshabilitado en la 1.ª", () => {
    const v = evaluarVista(0);
    const html = renderToStaticMarkup(
      createElement(ReviewHeader, {
        eyebrow: v.eyebrow,
        titulo: v.titulo,
        tituloId: "t",
        identidad: v.identidad,
        linea: v.linea,
        chips: v.chips,
        anteriorHref: null,
        saltarHref: "/x",
      }),
    );
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*Anterior/);
    expect(html).toContain('href="/x"');
  });
});
