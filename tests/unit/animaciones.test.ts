import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { idsNuevos } from "@/lib/flip";

// D280 (buscador) y D281 (FLIP y entradas de listas de gestión)

const raiz = join(import.meta.dir, "..", "..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");

describe("idsNuevos", () => {
  test("las filas que no estaban, en el orden nuevo", () => {
    const antes = new Map([
      ["a", 0],
      ["b", 40],
    ]);
    const despues = new Map([
      ["c", 0],
      ["a", 40],
      ["d", 80],
    ]);
    expect(idsNuevos(antes, despues)).toEqual(["c", "d"]);
    expect(idsNuevos(despues, despues)).toEqual([]);
  });
});

describe("FLIP en las listas de gestión (guardián por código)", () => {
  const listas: [string, string][] = [
    ["components/sections/alumnos/students-table.tsx", "registrar(a.cedula)"],
    ["components/sections/puntos/adjustment-history.tsx", "registrar(f.id)"],
    ["components/sections/equipos-profe/team-card.tsx", "registrar(m.cedula)"],
  ];
  for (const [ruta, ref] of listas) {
    test(`${ruta}: viaje con --d-normal y entrada de las filas nuevas`, () => {
      const src = leer(ruta);
      expect(src).toMatch(
        /useFlip<[A-Za-z]+>\(\{\s*duracion: "--d-normal",\s*entrada: true,\s*\}\)/,
      );
      expect(src).toContain(`ref={${ref}}`);
    });
  }

  test("useFlip sin opciones sigue como el ranking: --d-rank y sin entrada", () => {
    const src = leer("components/krea/use-flip.ts");
    expect(src).toContain('duracion: variable = "--d-rank"');
    expect(src).toContain("entrada = false");
    // Fotogramas de .animate(): solo transform y opacity
    const props = [...src.matchAll(/(?:\[|\}, )\{ (\w+): /g)].map((m) => m[1]);
    expect(props.length).toBeGreaterThan(0);
    for (const p of props) expect(["transform", "opacity"]).toContain(p);
  });
});

describe("Buscador de Alumnos (guardián por código)", () => {
  const src = leer("components/sections/alumnos/student-filters.tsx");

  test("«Borrar la búsqueda»: con nombre, fuera del Tab cuando no hay texto", () => {
    expect(src).toContain('aria-label="Borrar la búsqueda"');
    expect(src).toContain("inert={!hayConsulta}");
    expect(src).toContain("inputRef.current?.focus()");
  });

  test("aparece solo con opacidad y escala (sin ancho ni posición)", () => {
    expect(src).toContain("transition-[opacity,scale]");
    expect(src).not.toMatch(/transition-\[(width|left|height)/);
  });
});

describe("Sin animar ancho, alto ni posición en lo de W15", () => {
  test("ningún archivo nuevo o tocado anima width/left/height", () => {
    for (const ruta of [
      "components/krea/indicador.tsx",
      "components/ui/tabs.tsx",
      "components/ui/toggle-group.tsx",
      "components/sections/ranking/segmented-links.tsx",
      "components/sections/alumnos/student-filters.tsx",
    ]) {
      const src = leer(ruta);
      expect(src).not.toMatch(/transition-\[[^\]]*(width|left|height)/);
      expect(src).not.toMatch(/transition-(width|all)\b/);
    }
  });
});
