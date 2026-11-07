import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SegmentedLinks } from "@/components/sections/ranking/segmented-links";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  cajaRelativa,
  flipIndicador,
  INDICADOR_MEMORIA_MS,
  memoriaVigente,
  transformDe,
} from "@/lib/indicador";

// D279: el indicador de pestañas y segmentados se desliza con transform (reemplaza a D039)

describe("cajaRelativa", () => {
  test("posición dentro del contenido de la lista: suma el scroll y resta el borde", () => {
    const lista = { left: 100, top: 50, width: 300, height: 48 };
    const item = { left: 180, top: 54, width: 90, height: 40 };
    expect(cajaRelativa(item, lista)).toEqual({ x: 80, y: 4, w: 90, h: 40 });
    expect(
      cajaRelativa(item, lista, { left: 30, top: 0 }, { left: 1, top: 1 }),
    ).toEqual({ x: 109, y: 3, w: 90, h: 40 });
  });
});

describe("flipIndicador", () => {
  const a = { x: 4, y: 4, w: 100, h: 40 };
  const b = { x: 108, y: 4, w: 50, h: 40 };

  test("viaja desde la opción anterior: translate a la vieja y escala al ancho viejo", () => {
    expect(flipIndicador(a, b)).toBe("translate(4px, 4px) scale(2, 1)");
    expect(transformDe(b)).toBe("translate(108px, 4px)");
  });

  test("línea (eje x): ni sube ni cambia de alto", () => {
    const abajo = { ...b, y: 40, h: 3 };
    expect(flipIndicador(a, abajo, "x")).toBe(
      "translate(4px, 0px) scale(2, 1)",
    );
    expect(transformDe(abajo, "x")).toBe("translate(108px, 0px)");
  });

  test("segmentado que envuelve (eje xy): también cambia de fila", () => {
    const otraFila = { x: 4, y: 48, w: 100, h: 40 };
    expect(flipIndicador(a, otraFila)).toBe("translate(4px, 4px) scale(1, 1)");
  });

  test("sin caja anterior, sin tamaño o sin movimiento → nada que animar", () => {
    expect(flipIndicador(null, b)).toBeNull();
    expect(flipIndicador({ ...a, w: 0 }, b)).toBeNull();
    expect(flipIndicador(b, { ...b, x: b.x + 0.2 })).toBeNull();
  });
});

describe("memoriaVigente (segmentado de enlaces)", () => {
  const caja = { x: 4, y: 4, w: 60, h: 40 };
  test("sirve solo si es de la navegación que acaba de pasar", () => {
    expect(memoriaVigente({ caja, t: 1000 }, 1200)).toEqual(caja);
    expect(
      memoriaVigente({ caja, t: 1000 }, 1000 + INDICADOR_MEMORIA_MS + 1),
    ).toBeNull();
    expect(memoriaVigente({ caja, t: 2000 }, 1000)).toBeNull();
    expect(memoriaVigente(undefined, 1000)).toBeNull();
  });
});

describe("HTML del servidor: el estilo propio manda hasta que el indicador mide", () => {
  test("ToggleGroup: indicador oculto a la AT, opción con fondo propio y cesión con data-ind", () => {
    const html = renderToStaticMarkup(
      createElement(
        ToggleGroup,
        { defaultValue: "5A", "aria-label": "Sección" },
        createElement(ToggleGroupItem, { value: "5A" }, "5A"),
        createElement(ToggleGroupItem, { value: "5C" }, "5C"),
      ),
    );
    expect(html).toMatch(/<span aria-hidden="true" data-slot="indicador"/);
    expect(html).not.toContain("data-ind=");
    expect(html).toContain("data-[state=on]:bg-surface");
    expect(html).toContain(
      "group-data-[ind]/toggle-group:data-[state=on]:bg-transparent",
    );
    // los radios siguen siendo los únicos hijos con rol
    expect(html.match(/role="radio"/g)?.length).toBe(2);
  });

  test("ToggleGroup indicador={false}: sin indicador (dado, avatares, acentos)", () => {
    const html = renderToStaticMarkup(
      createElement(
        ToggleGroup,
        { defaultValue: "1", "aria-label": "Nota", indicador: false },
        createElement(ToggleGroupItem, { value: "1" }, "1"),
      ),
    );
    expect(html).not.toContain('data-slot="indicador"');
  });

  test("Tabs: barra de línea y fondo segmentado ceden con data-ind", () => {
    const linea = renderToStaticMarkup(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          { "aria-label": "Vista" },
          createElement(TabsTrigger, { value: "a" }, "A"),
          createElement(TabsTrigger, { value: "b" }, "B"),
        ),
      ),
    );
    expect(linea).toContain('data-slot="indicador"');
    expect(linea).toContain("bottom-0 h-0.75");
    expect(linea).toContain(
      "group-data-[variant=line]/tabs-list:group-data-[ind]/tabs-list:data-[state=active]:after:opacity-0",
    );
    expect(linea.match(/role="tab"/g)?.length).toBe(2);
  });

  test("SegmentedLinks: el indicador no va dentro de la <ul> (solo <li>)", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedLinks, {
        label: "Sección",
        actual: "5A",
        opciones: [
          { clave: "5A", texto: "5A", href: "/profe/ranking" },
          { clave: "5C", texto: "5C", href: "/profe/ranking/5c" },
        ],
      }),
    );
    const ul = html.slice(html.indexOf("<ul"), html.indexOf("</ul>"));
    expect(ul).not.toContain("indicador");
    expect(html.indexOf('data-slot="indicador"')).toBeLessThan(
      html.indexOf("<ul"),
    );
    expect(html).toContain('aria-current="page"');
  });
});

describe("Solo transform/opacity (guardián por código)", () => {
  test("el indicador no anima ancho, alto ni posición", () => {
    const src = readFileSync(
      join(import.meta.dir, "..", "..", "components", "krea", "indicador.tsx"),
      "utf8",
    );
    const animate = src.slice(src.indexOf(".animate("));
    expect(animate).toMatch(
      /^\.animate\(\s*\[\{ transform: desde \}, \{ transform: [^}]*\}\],/,
    );
    expect(src).not.toMatch(/transition-\[(width|left|height)/);
  });
});
