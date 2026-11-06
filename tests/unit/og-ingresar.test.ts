import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { OPEN_GRAPH_BASE, TWITTER_BASE } from "@/lib/site";

// La página importa módulos de servidor: se revisa su código, no se importa.
const pagina = readFileSync("app/(auth)/ingresar/page.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

/**
 * D-M2 (QA versión 1): `/ingresar`, la única página indexable, se compartía sin imagen ni tarjeta
 * grande porque su `openGraph`/`twitter` reemplazaban los del layout (fusión superficial, D223).
 */
describe("Open Graph de /ingresar (D-M2)", () => {
  test("extiende la base del layout: tipo, idioma, sitio y tarjeta grande", () => {
    expect(OPEN_GRAPH_BASE).toEqual({
      type: "website",
      locale: "es_VE",
      siteName: "KREA",
    });
    expect(TWITTER_BASE).toEqual({ card: "summary_large_image" });
    for (const codigo of [pagina, layout]) {
      expect(codigo).toMatch(/openGraph: \{\s*\.\.\.OPEN_GRAPH_BASE,/);
      expect(codigo).toMatch(/twitter: \{\s*\.\.\.TWITTER_BASE,/);
    }
  });
  test("el segmento tiene su opengraph-image (la del sitio)", () => {
    const ruta = "app/(auth)/ingresar/opengraph-image.tsx";
    expect(existsSync(ruta)).toBe(true);
    expect(readFileSync(ruta, "utf8")).toMatch(
      /export \{[^}]*default[^}]*\} from "\.\.\/\.\.\/opengraph-image"/,
    );
  });
});
