import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * D-M3 y D-A1b (QA versión 1; D226): en la fila del ranking, el chip «Empate» o el delta
 * bajan junto al subtítulo cuando la fila mide menos de `--container-fila` (20rem), y el nombre
 * recupera el ancho. En la tarjeta de equipo del profe, el nombre y «Mover a…» bajan de línea
 * con texto grande.
 */
const css = readFileSync("app/globals.css", "utf8");
const fila = readFileSync("components/krea/rank-row.tsx", "utf8");
const tarjeta = readFileSync(
  "components/sections/equipos-profe/team-card.tsx",
  "utf8",
);

describe("filas estrechas (D226)", () => {
  test("el token del contenedor existe", () => {
    expect(css).toMatch(/--container-fila: 20rem;/);
  });
  test("ranking: la fila es contenedor y la marca va a la derecha o bajo el nombre", () => {
    expect(fila).toContain("@container list-none");
    expect(fila).toContain(
      "@max-fila:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_auto]",
    );
    expect(fila).toContain('<span className="@max-fila:hidden">{marca}</span>');
    expect(fila).toContain("hidden shrink-0 @max-fila:flex");
  });
  test("equipos: cabecera y filas de integrantes envuelven", () => {
    expect(tarjeta).toContain('"flex flex-wrap items-start gap-4"');
    expect(tarjeta).toContain("min-w-[min(--spacing(32),100%)] flex-1");
    expect(tarjeta).toMatch(/min-h-11 flex-wrap items-center/);
    expect(tarjeta).toContain("min-w-[min(--spacing(24),100%)] flex-1");
  });
});
