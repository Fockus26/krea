import { describe, expect, test } from "bun:test";
import { entregaDe, tareasDe } from "@/lib/demo/entrega";
import {
  avanceEntrega,
  avisoCapitanTexto,
  borradorTexto,
  claveBorrador,
  entregadaTexto,
  eyebrowTarea,
  faltaTexto,
  horaTexto,
  leerBorrador,
  puedeEntregar,
  puntosPreguntasTexto,
  venceTexto,
} from "@/lib/tareas";

describe("encabezado", () => {
  test("textos del lienzo", () => {
    expect(puntosPreguntasTexto([6, 4, 4, 3, 3])).toBe("20 pts · 5 preguntas");
    expect(eyebrowTarea("grupal", "5A-G2 Repostería")).toBe(
      "Grupal · 5A-G2 Repostería",
    );
    expect(eyebrowTarea("individual", "5A-G2 Repostería")).toBe("Individual");
    expect(venceTexto("2026-10-30")).toBe("Vence 30/10/2026");
    expect(entregadaTexto("2026-10-25")).toBe("entregada el 25/10/2026");
  });
});

describe("avance de la entrega", () => {
  const r = [
    { formato: "imagen" as const, completa: true },
    { formato: "texto" as const, completa: true },
    { formato: "imagen" as const, completa: false, subiendo: true },
    { formato: "texto" as const, completa: false },
  ];
  test("una imagen subiendo no cuenta como hecha ni como faltante", () => {
    expect(avanceEntrega(r)).toEqual({ faltan: 1, subiendo: 1 });
    expect(puedeEntregar(r)).toBe(false);
    expect(faltaTexto(1, 1)).toBe("Te falta 1 respuesta · 1 imagen subiendo");
  });
  test("plurales y listo", () => {
    expect(faltaTexto(2, 0)).toBe("Te faltan 2 respuestas");
    expect(faltaTexto(0, 3)).toBe("3 imágenes subiendo");
    expect(faltaTexto(0, 0)).toBe("Todo respondido.");
    expect(puedeEntregar([{ formato: "texto", completa: true }])).toBe(true);
  });
});

describe("hora y borrador", () => {
  test("12 horas como el lienzo", () => {
    expect(horaTexto(new Date(2026, 9, 25, 16, 12))).toBe("4:12 p. m.");
    expect(horaTexto(new Date(2026, 9, 25, 10, 42))).toBe("10:42 a. m.");
    expect(horaTexto(new Date(2026, 9, 25, 0, 5))).toBe("12:05 a. m.");
    expect(horaTexto(new Date(2026, 9, 25, 12, 0))).toBe("12:00 p. m.");
    expect(borradorTexto(new Date(2026, 9, 25, 10, 42))).toBe(
      "Borrador guardado en este teléfono · 10:42 a. m.",
    );
  });
  test("leerBorrador descarta lo que no es id → texto", () => {
    expect(leerBorrador(null)).toEqual({});
    expect(leerBorrador("no es json")).toEqual({});
    expect(leerBorrador("[1,2]")).toEqual({});
    expect(leerBorrador('{"p1":"hola","p2":3}')).toEqual({ p1: "hola" });
    expect(claveBorrador("competencia")).toBe("krea-borrador-competencia");
  });
});

describe("aviso de capitán", () => {
  test("por defecto «capitán» (D075); femenino como el lienzo", () => {
    expect(avisoCapitanTexto("Raquel Figueroa").titulo).toBe(
      "La entrega Raquel Figueroa, capitán de tu equipo.",
    );
    expect(avisoCapitanTexto("Raquel Figueroa", true)).toEqual({
      titulo: "La entrega Raquel Figueroa, capitana de tu equipo.",
      texto:
        "Puedes ver las preguntas. Las respuestas aparecen aquí cuando se envíen.",
    });
  });
});

describe("datos de ejemplo", () => {
  test("la capitana responde; la integrante solo lee", () => {
    expect(entregaDe("capitan").capitan).toBeUndefined();
    const lector = entregaDe("no-capitan");
    expect(lector.capitan?.corto).toBe("Raquel");
    expect(lector.premio).toBeTruthy();
  });
  test("individual sin premio ni capitán", () => {
    const d = entregaDe("individual");
    expect(d.premio).toBeUndefined();
    expect(d.capitan).toBeUndefined();
    expect(d.puntos).toBe("20 pts · 3 preguntas");
  });
  test("entregada: una respuesta por pregunta", () => {
    const d = entregaDe("entregada");
    expect(d.entregada?.respuestas).toHaveLength(d.preguntas.length);
    expect(d.entregada?.hora).toBe("4:12 p. m.");
  });
  test("/tareas: pendientes y entregadas", () => {
    const t = tareasDe();
    expect(t.pendientes.length).toBeGreaterThan(0);
    expect(t.entregadas.every((f) => f.fecha.startsWith("entregada el"))).toBe(
      true,
    );
  });
});
