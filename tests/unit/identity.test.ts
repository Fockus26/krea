import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { avatarUrl, DICEBEAR_ESTILOS, esEstiloDicebear } from "@/lib/dicebear";
import {
  hashString,
  initials,
  teamColorIndex,
  teamInitial,
} from "@/lib/identity";

describe("avatarUrl (HANDOFF §2.5, D010)", () => {
  test("los 4 estilos de D010", () => {
    expect([...DICEBEAR_ESTILOS]).toEqual([
      "adventurer-neutral",
      "fun-emoji",
      "bottts-neutral",
      "notionists-neutral",
    ]);
  });

  test("arma la URL de DiceBear 9.x", () => {
    expect(avatarUrl({ estilo: "fun-emoji", seed: "luna" })).toBe(
      "https://api.dicebear.com/9.x/fun-emoji/svg?seed=luna",
    );
  });

  test("codifica el seed", () => {
    expect(avatarUrl({ estilo: "bottts-neutral", seed: "a b&c=ñ/é" })).toBe(
      "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=a%20b%26c%3D%C3%B1%2F%C3%A9",
    );
  });

  test("estilo inválido lanza", () => {
    // @ts-expect-error estilo fuera de la lista
    expect(() => avatarUrl({ estilo: "pixel-art", seed: "x" })).toThrow();
    expect(esEstiloDicebear("fun-emoji")).toBe(true);
    expect(esEstiloDicebear("pixel-art")).toBe(false);
    expect(esEstiloDicebear(undefined)).toBe(false);
  });
});

describe("teamColorIndex", () => {
  test("es estable y va de 1 a 6", () => {
    expect(teamColorIndex("5a-g1")).toBe(teamColorIndex("5a-g1"));
    for (const id of ["5a-g1", "5a-g2", "5c-g6", "", "ñandú", "x".repeat(200)])
      expect([1, 2, 3, 4, 5, 6]).toContain(teamColorIndex(id));
  });

  test("hash de FNV-1a conocido", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });

  test("reparte: 120 ids distintos usan los 6 colores sin que ninguno domine", () => {
    const cuenta = [0, 0, 0, 0, 0, 0];
    for (const sec of ["5a", "5c"])
      for (let g = 1; g <= 60; g++)
        cuenta[teamColorIndex(`${sec}-g${g}`) - 1]++;
    for (const n of cuenta) {
      expect(n).toBeGreaterThan(8);
      expect(n).toBeLessThan(35);
    }
  });
});

describe("teamInitial / initials", () => {
  test("conserva la tilde y mayusculiza", () => {
    expect(teamInitial("Ñandú")).toBe("Ñ");
    expect(teamInitial("álbum")).toBe("Á");
    expect(teamInitial("  repostería")).toBe("R");
  });

  test("salta signos y emojis iniciales si hay una letra", () => {
    expect(teamInitial("¡Moda!")).toBe("M");
    expect(teamInitial("🍰 Repostería")).toBe("R");
  });

  test("sin letras, el primer grafema; vacío, vacío", () => {
    expect(teamInitial("🍰")).toBe("🍰");
    expect(teamInitial("")).toBe("");
  });

  test("iniciales del nombre: máximo dos", () => {
    expect(initials("Jorge Enrique")).toBe("JE");
    expect(initials("Ana")).toBe("A");
    expect(initials("  ")).toBe("");
    expect(initials("Luniel Alessandro Morón")).toBe("LA");
  });
});

describe("globals.css: tokens de identidad (§2.5)", () => {
  const css = readFileSync(
    join(import.meta.dir, "..", "..", "app", "globals.css"),
    "utf8",
  );
  test("6 colores de respaldo con los hex del handoff", () => {
    const esperado = [
      "#8a3b12",
      "#1f5e8c",
      "#6a3fb0",
      "#0e6b5c",
      "#a3361f",
      "#295ac3",
    ];
    esperado.forEach((hex, i) => {
      expect(css).toContain(`--team-${i + 1}: ${hex};`);
    });
  });
});
