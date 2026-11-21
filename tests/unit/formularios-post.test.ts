import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Clase F-A1 (QA versión 1): un `<form onSubmit>` sin `method="post"` que se envía antes de
 * hidratar hace un GET nativo y deja los campos (contraseñas incluidas) en la URL. Todo
 * `<form>` del proyecto declara `method="post"`.
 */
function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return tsx(ruta);
    return ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

describe("formularios con method=post (F-A1)", () => {
  test('ningún <form> queda sin method="post"', () => {
    const sinPost: string[] = [];
    for (const archivo of [...tsx("components"), ...tsx("app")]) {
      const codigo = readFileSync(archivo, "utf8");
      // La etiqueta de apertura completa, aunque ocupe varias líneas.
      for (const m of codigo.matchAll(/<form\b[^>]*>/g)) {
        if (!/\bmethod="post"/.test(m[0])) sinPost.push(archivo);
      }
    }
    expect(sinPost).toEqual([]);
  }, 20_000);
});
