import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveTotal } from "@/components/krea/live-total";
import { ScorePicker } from "@/components/krea/score-picker";
import { SumMeter } from "@/components/krea/sum-meter";

// Sin DOM: se comprueba el HTML real que publican (roles, nombres, estado).
const render = (props: {
  value: number | null;
  max: number;
  disabled?: boolean;
}) =>
  renderToStaticMarkup(
    createElement(ScorePicker, {
      ...props,
      labelledBy: "q1",
      onChange: () => {},
    }),
  );

describe("ScorePicker · botones (≤ 6)", () => {
  const html = render({ value: 3.5, max: 4 });

  test("radiogroup nombrado por el título de la pregunta", () => {
    expect(html.match(/role="radiogroup"/g)?.length).toBe(1);
    expect(html).toContain('aria-labelledby="q1"');
  });

  test("un radio por paso de 0,5, con nombre legible", () => {
    expect(html.match(/role="radio"/g)?.length).toBe(9);
    expect(html).toContain('aria-label="3,5 puntos"');
    expect(html).toContain('aria-label="1 punto"');
    expect(html).toContain(">3,5</button>");
  });

  test("solo el elegido está marcado; el máximo lleva data-max", () => {
    expect(html.match(/aria-checked="true"/g)?.length).toBe(1);
    expect(html.match(/data-max="true"/g)?.length).toBe(1);
  });

  test("null = ninguno marcado (Pendiente, D003)", () => {
    const vacio = render({ value: null, max: 2 });
    expect(vacio).not.toContain('aria-checked="true"');
    expect(vacio.match(/role="radio"/g)?.length).toBe(5);
  });

  test("deshabilitado: todos los radios deshabilitados", () => {
    const dis = render({ value: 2, max: 2, disabled: true });
    // `\sdisabled` deja fuera el `data-disabled` de Radix
    expect(dis.match(/\sdisabled=""/g)?.length).toBe(5);
  });
});

describe("ScorePicker · stepper (> 6)", () => {
  const html = render({ value: 16.5, max: 20 });

  test("grupo nombrado por la pregunta, sin radios", () => {
    expect(html).toContain('aria-labelledby="q1"');
    expect(html).not.toContain('role="radio"');
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('value="16,5"');
  });

  test("5 atajos al paso", () => {
    for (const l of [
      "0 puntos",
      "5 puntos",
      "10 puntos",
      "15 puntos",
      "20 puntos",
    ])
      expect(html).toContain(`aria-label="${l}"`);
  });

  test("el campo se nombra con la pregunta, sin un «Puntaje» aparte (D103)", () => {
    expect(html).toMatch(/role="spinbutton"[^>]*aria-labelledby="q1"/);
    expect(html).not.toContain('aria-label="Puntaje"');
  });

  test("sin puntuar: campo vacío, sin valuenow y «Sin puntuar» (D003, D103)", () => {
    const vacio = render({ value: null, max: 8 });
    expect(vacio).toContain('value=""');
    expect(vacio).not.toContain('value="0"');
    expect(vacio).not.toContain("aria-valuenow");
    expect(vacio).toContain('aria-valuetext="Sin puntuar"');
  });
});

describe("medidores: una sola región viva con la frase completa", () => {
  test("SumMeter", () => {
    const html = renderToStaticMarkup(createElement(SumMeter, { sum: 14 }));
    expect(html.match(/<output/g)?.length).toBe(1);
    expect(html).toContain("Suma de valores: 14 de 20. Faltan 6.");
    expect(html).toContain('data-state="under"');
  });

  test("LiveTotal en sus dos presentaciones", () => {
    for (const variant of ["bar", "card"] as const) {
      const html = renderToStaticMarkup(
        createElement(LiveTotal, { scores: [4, 5, null], variant }),
      );
      expect(html.match(/<output/g)?.length).toBe(1);
      expect(html).toContain("Total 9 de 20, nota 9. 2 de 3 puntuadas.");
    }
  });
});
