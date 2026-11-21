import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { PantallaNotFound } from "@/components/estados/pantallas";
import { RankRow } from "@/components/krea/rank-row";

describe("404 dentro del shell (D504)", () => {
  test("las rutas con sesión tienen su propio not-found", () => {
    expect(existsSync("app/(estudiante)/not-found.tsx")).toBe(true);
    expect(existsSync("app/(profesor)/not-found.tsx")).toBe(true);
  });

  test("en el shell no repite header ni main (el shell ya los trae)", () => {
    const html = renderToStaticMarkup(
      <PantallaNotFound sesion="estudiante" enShell />,
    );
    expect(html).not.toContain("<main");
    expect(html).not.toContain("<header");
    expect(html).not.toContain('aria-label="Tu perfil"');
    expect(html).toContain("<h1");
  });

  test("a pantalla completa conserva header y main", () => {
    const html = renderToStaticMarkup(<PantallaNotFound sesion="estudiante" />);
    expect(html).toContain("<main");
    expect(html).toContain("<header");
  });
});

describe("fila del ranking abrible (D506, WCAG 2.5.3)", () => {
  test("el botón no usa aria-label: su nombre sale del texto visible", () => {
    const html = renderToStaticMarkup(
      <RankRow
        puesto={4}
        nombre="Juana Montero"
        puntos={30.5}
        media={null}
        onAbrir={() => {}}
      />,
    );
    const boton = html.match(/<button[^>]*>/)?.[0] ?? "";
    expect(boton).not.toContain("aria-label");
    expect(html).toContain("Juana Montero");
  });
});
