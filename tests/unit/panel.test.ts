import { describe, expect, test } from "bun:test";
import { AJUSTES } from "@/lib/demo/ajustes";
import { ENTREGAS_PANEL, panelDe } from "@/lib/demo/panel";
import { alumnoPorCedula, equipoPorId } from "@/lib/demo/seed";
import {
  ajusteMetaTexto,
  chipAjuste,
  detallePorEvaluar,
  detalleRaspados,
  entregaMetaTexto,
  evaluadosTexto,
  evaluarAriaLabel,
  fechaAjusteTexto,
  filtrarPorSeccion,
  filtroTexto,
  porcentajeEvaluados,
  saludoPorHora,
  saludoTexto,
  verTodasTexto,
} from "@/lib/panel";

describe("saludoPorHora", () => {
  test("cortes: 4/5, 11/12 y 18/19", () => {
    expect(saludoPorHora(4)).toBe("Buenas noches");
    expect(saludoPorHora(5)).toBe("Buenos días");
    expect(saludoPorHora(11)).toBe("Buenos días");
    expect(saludoPorHora(12)).toBe("Buenas tardes");
    expect(saludoPorHora(18)).toBe("Buenas tardes");
    expect(saludoPorHora(19)).toBe("Buenas noches");
    expect(saludoPorHora(0)).toBe("Buenas noches");
    expect(saludoPorHora(23)).toBe("Buenas noches");
  });
  test("hora inválida lanza", () => {
    expect(() => saludoPorHora(-1)).toThrow(RangeError);
    expect(() => saludoPorHora(24)).toThrow(RangeError);
    expect(() => saludoPorHora(9.5)).toThrow(RangeError);
  });
  test("texto del h1", () => {
    expect(saludoTexto(9)).toBe("Buenos días, profe");
    expect(saludoTexto(15, "Ana")).toBe("Buenas tardes, Ana");
  });
});

describe("filtro de sección", () => {
  const items = [
    { id: 1, seccion: "5A" as const },
    { id: 2, seccion: "5C" as const },
    { id: 3, seccion: "5A" as const },
  ];
  test("5A, 5C y ambas", () => {
    expect(filtrarPorSeccion(items, "5A").map((i) => i.id)).toEqual([1, 3]);
    expect(filtrarPorSeccion(items, "5C").map((i) => i.id)).toEqual([2]);
    expect(filtrarPorSeccion(items, "ambas")).toHaveLength(3);
    expect(filtrarPorSeccion(items, "ambas")).not.toBe(items);
  });
  test("frase de la región viva", () => {
    expect(filtroTexto("5A")).toBe("Mostrando la sección 5A");
    expect(filtroTexto("ambas")).toBe("Mostrando ambas secciones");
  });
});

describe("métricas", () => {
  test("detalle de Por evaluar con plurales", () => {
    expect(
      detallePorEvaluar([
        ...Array(4).fill({ tipo: "individual" }),
        ...Array(3).fill({ tipo: "grupal" }),
      ]),
    ).toBe("4 individuales · 3 grupales");
    expect(
      detallePorEvaluar([{ tipo: "individual" }, { tipo: "grupal" }]),
    ).toBe("1 individual · 1 grupal");
    expect(detallePorEvaluar([])).toBe("Nada por evaluar");
  });
  test("evaluados", () => {
    expect(porcentajeEvaluados(12, 69)).toBe(17.4);
    expect(porcentajeEvaluados(0, 0)).toBe(0);
    expect(porcentajeEvaluados(5, 4)).toBe(100);
    expect(evaluadosTexto(12, 69)).toBe("12 de 69 evaluados");
    expect(evaluadosTexto(1, 1)).toBe("1 de 1 evaluado");
  });
  test("raspados", () => {
    expect(detalleRaspados([])).toBe("Nadie por debajo de 10");
    expect(
      detalleRaspados([{ nombre: "María de los Ángeles Méndez", nota: 8 }]),
    ).toBe("María de los Ángeles Méndez · 8");
    expect(
      detalleRaspados([
        { nombre: "Ana Pérez", nota: 7.5 },
        { nombre: "Luis Gil", nota: 9 },
        { nombre: "Eva Rojas", nota: 3 },
      ]),
    ).toBe("Ana Pérez · 7,5 y 2 más");
  });
  test("pie y botón", () => {
    expect(verTodasTexto(7)).toBe("Ver las 7");
    expect(verTodasTexto(1)).toBe("Ver la 1");
    expect(evaluarAriaLabel("Jorge Quintero")).toBe("Evaluar a Jorge Quintero");
  });
});

describe("ajustes", () => {
  test("signo tipográfico y texto accesible (D007: puntos, no nota)", () => {
    expect(chipAjuste(2)).toEqual({
      signo: "mas",
      texto: "2 pts",
      accesible: "más 2 puntos",
      conSigno: "+2",
    });
    expect(chipAjuste(-1)).toEqual({
      signo: "menos",
      texto: "1 pts",
      accesible: "menos 1 punto",
      conSigno: "−1",
    });
    expect(chipAjuste(-0.5).accesible).toBe("menos 0,5 puntos");
  });
  test("fecha es-VE con y sin hora", () => {
    expect(fechaAjusteTexto("2026-10-25T10:15")).toBe(
      "25/10/2026, 10:15 a. m.",
    );
    expect(fechaAjusteTexto("2026-10-25T09:40")).toBe("25/10/2026, 9:40 a. m.");
    expect(fechaAjusteTexto("2026-10-24T11:05")).toBe(
      "24/10/2026, 11:05 a. m.",
    );
    expect(fechaAjusteTexto("2026-10-25T16:12")).toBe("25/10/2026, 4:12 p. m.");
    expect(fechaAjusteTexto("2026-10-25T12:00")).toBe(
      "25/10/2026, 12:00 p. m.",
    );
    expect(fechaAjusteTexto("2026-10-25T00:30")).toBe(
      "25/10/2026, 12:30 a. m.",
    );
    expect(fechaAjusteTexto("2026-10-23")).toBe("23/10/2026");
    expect(() => fechaAjusteTexto("ayer")).toThrow(RangeError);
    expect(() => fechaAjusteTexto("2026-10-25T25:00")).toThrow(RangeError);
  });
  test("meta del ajuste", () => {
    expect(ajusteMetaTexto("Uso del celular", "2026-10-25T09:40")).toBe(
      "Uso del celular · 25/10/2026, 9:40 a. m.",
    );
  });
});

describe("entregaMetaTexto", () => {
  test("grupal e individual", () => {
    expect(
      entregaMetaTexto({
        tarea: "Logo y paleta",
        tipo: "grupal",
        fecha: "25/10/2026",
        entrego: "Yeilin",
      }),
    ).toBe("Logo y paleta · Grupal · entregó Yeilin el 25/10/2026");
    expect(
      entregaMetaTexto({
        tarea: "Identidad de marca",
        tipo: "individual",
        fecha: "24/10/2026",
      }),
    ).toBe("Identidad de marca · Individual · 24/10/2026");
  });
});

describe("datos de ejemplo", () => {
  test("DemoAjuste: los 4 del lienzo con la forma del brief", () => {
    expect(AJUSTES.map((a) => a.valor)).toEqual([2, -1, 1, -1]);
    for (const a of AJUSTES) {
      expect(Object.keys(a).sort()).toEqual(
        ["destino", "fecha", "id", "motivo", "valor"].sort(),
      );
      if (a.destino.tipo === "alumno") alumnoPorCedula(a.destino.cedula);
      else equipoPorId(a.destino.id);
    }
  });
  test("7 entregas: 4 individuales y 3 grupales; la 1.ª y la 2.ª fijadas por el brief", () => {
    expect(ENTREGAS_PANEL).toHaveLength(7);
    expect(ENTREGAS_PANEL.filter((e) => e.tipo === "grupal")).toHaveLength(3);
    const d = panelDe();
    expect(d.entregas[0]?.nombre).toBe("5A-G2 Repostería");
    expect(d.entregas[0]?.meta).toBe(
      "Logo y paleta del emprendimiento · Grupal · entregó Yeilin el 25/10/2026",
    );
    expect(d.entregas[1]?.nombre).toBe("Jorge Quintero · 5A");
  });
  test("métricas reales del seed: 12 / 69 evaluados y 1 raspado", () => {
    const d = panelDe();
    expect(d.avance["5A"].evaluados + d.avance["5C"].evaluados).toBe(12);
    expect(d.avance["5A"].total + d.avance["5C"].total).toBe(69);
    expect(d.raspados).toEqual([
      { seccion: "5A", nombre: "María de los Ángeles Méndez", nota: 8 },
    ]);
  });
  test("ajustes con nombres del seed", () => {
    expect(panelDe().ajustes.map((a) => a.nombre)).toEqual([
      "Jorge Quintero",
      "Klenyerber Corredor",
      "Equipo 5A-G3 Ropa",
      "Equipo 5C-G1",
    ]);
  });
});
