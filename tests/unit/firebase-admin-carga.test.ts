// El Admin SDK va externo (Next no lo empaqueta) y en Vercel se carga con `require` sin soporte de
// require(esm): si una dependencia pasa a ser solo ESM, todas las rutas dan 500 por el proxy (D214).
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";

const MODULOS = [
  "firebase-admin/app",
  "firebase-admin/auth",
  "firebase-admin/firestore",
];

describe("firebase-admin sin require(esm)", () => {
  for (const modulo of MODULOS) {
    test(`${modulo} carga con require`, () => {
      const r = spawnSync(
        "node",
        [
          "--no-experimental-require-module",
          "-e",
          `require(${JSON.stringify(modulo)})`,
        ],
        { encoding: "utf8" },
      );
      expect(r.stderr).not.toContain("ERR_REQUIRE_ESM");
      expect(r.status).toBe(0);
      // Lanzar node y cargar el SDK en frío supera el límite de 5 s de bun.
    }, 60_000);
  }
});
