import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Clase D-A1 (QA versión 1): con el texto del sistema al 200 % un rem mide 32 px, así que
 * `min-w-N` (N × 0,25 rem) mide N × 8 px. Desde N = 45 (360 px) no cabe en un móvil de 390
 * con su margen, y la fila produce scroll horizontal. Un ancho mínimo grande se escribe
 * `min-w-[min(--spacing(N),100%)]`: el mismo valor de la escala, sin pasar del contenedor.
 */
const LIMITE = 45;
/** Anchos que viven dentro de su propio contenedor con scroll (no desbordan la página). */
const DENTRO_DE_SCROLL = new Set(["components/ui/table.tsx: min-w-190"]);

function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return tsx(ruta);
    return ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

describe("texto al 200 % en móvil (D-A1)", () => {
  test(`ningún min-w-N con N ≥ ${LIMITE} sin tope del 100 %`, () => {
    const grandes: string[] = [];
    for (const archivo of [...tsx("components"), ...tsx("app")]) {
      const codigo = readFileSync(archivo, "utf8");
      for (const m of codigo.matchAll(/(?<![\w-])min-w-(\d+(?:\.\d+)?)\b/g)) {
        const id = `${archivo.replaceAll("\\", "/")}: ${m[0]}`;
        if (Number(m[1]) >= LIMITE && !DENTRO_DE_SCROLL.has(id))
          grandes.push(id);
      }
    }
    expect(grandes).toEqual([]);
  });
});
