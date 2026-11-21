import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("404 dentro del shell (D504)", () => {
  test("las rutas con sesión tienen su propio not-found, en el shell", () => {
    for (const g of ["(estudiante)", "(profesor)"]) {
      const ruta = `app/${g}/not-found.tsx`;
      expect(existsSync(ruta)).toBe(true);
      expect(leer(ruta)).toContain("enShell");
    }
  });

  test("StatusScreen en el shell no pinta header ni main propios", () => {
    const fuente = leer("components/estados/status-screen.tsx");
    const enShell = fuente.slice(
      fuente.indexOf("if (enShell)"),
      fuente.indexOf("return (", fuente.indexOf("if (enShell)") + 40),
    );
    expect(enShell).not.toContain("<main");
    expect(enShell).not.toContain("<header");
  });
});

describe("un solo noindex en la 404 (D523)", () => {
  test("los not-found no declaran robots: lo añade Next y el layout del grupo", () => {
    for (const ruta of [
      "app/not-found.tsx",
      "app/(estudiante)/not-found.tsx",
      "app/(profesor)/not-found.tsx",
    ]) {
      expect(leer(ruta)).not.toMatch(/robots/);
    }
  });

  test("el noindex de las páginas con sesión sale del layout, una sola vez", () => {
    for (const g of [
      "(estudiante)/layout.tsx",
      "(profesor)/profe/layout.tsx",
    ]) {
      expect(leer(`app/${g}`).match(/robots:/g)).toHaveLength(1);
    }
  });
});

describe("nombre accesible de filas abribles (D506, WCAG 2.5.3)", () => {
  test("el enlace y el botón del ranking no llevan aria-label", () => {
    for (const f of [
      "components/krea/rank-row.tsx",
      "components/krea/podium.tsx",
    ]) {
      const fuente = leer(f);
      expect(fuente).not.toMatch(/<(Link|button)[^>]*aria-label/);
    }
  });
});
