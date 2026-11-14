import { describe, expect, test } from "bun:test";
import { perfilDe } from "@/lib/demo/perfil";
import { alumnoPorCedula } from "@/lib/demo/seed";
import {
  baseChipTexto,
  baseSelectorAvatar,
  capitanChipTexto,
  cedulaTexto,
  ESTILOS_AVATAR,
  LARGO_SEMILLA,
  OPCIONES_POR_TANDA,
  partirNombre,
  raizSemilla,
  semillaAvatarNueva,
  semillasAvatar,
  zAvatarElegido,
} from "@/lib/perfil";
import { cn } from "@/lib/utils";

describe("textos", () => {
  test("cédula con puntos de miles solo para mostrar", () => {
    expect(cedulaTexto("33272397")).toBe("C.I. 33.272.397");
    expect(cedulaTexto("9876543")).toBe("C.I. 9.876.543");
  });
  test("capitán y base", () => {
    expect(capitanChipTexto("5a-g2")).toBe("Capitán · 5A-G2");
    expect(capitanChipTexto("5a-g2", true)).toBe("Capitana · 5A-G2");
    expect(baseChipTexto(20)).toBeNull();
    expect(baseChipTexto(15)).toBe("Base 15");
  });
  test("partirNombre: primera palabra + el resto", () => {
    expect(partirNombre("Yeilin Marilyn")).toEqual(["Yeilin", "Marilyn"]);
    expect(partirNombre("María de los Ángeles")).toEqual([
      "María",
      "de los Ángeles",
    ]);
    expect(partirNombre("Jesús")).toEqual(["Jesús", ""]);
  });
});

describe("avatar", () => {
  test("4 estilos en el orden del lienzo", () => {
    expect(ESTILOS_AVATAR.map((e) => e.texto)).toEqual([
      "Aventurero",
      "Emoji",
      "Robot",
      "Retrato",
    ]);
  });
  test("tanda 0 empieza por la semilla actual; las tandas no se repiten", () => {
    const t0 = semillasAvatar("33272397", 0);
    const t1 = semillasAvatar("33272397", 1);
    expect(t0).toHaveLength(OPCIONES_POR_TANDA);
    expect(t0[0]).toBe("33272397");
    expect(new Set([...t0, ...t1]).size).toBe(OPCIONES_POR_TANDA * 2);
    expect(semillasAvatar("33272397", 1)).toEqual(t1);
  });
  test("semilla nueva (D388): 32 hex al azar, sin la cédula, distinta cada vez", () => {
    const CI = "33272397";
    const vistas = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const s = semillaAvatarNueva(CI);
      expect(s).toMatch(new RegExp(`^[0-9a-f]{${LARGO_SEMILLA}}$`));
      expect(s).not.toContain(CI);
      vistas.add(s);
    }
    expect(vistas.size).toBe(200);
    // Si el azar trae la cédula, vuelve a sortear
    const salidas = [
      Uint8Array.from([0x33, 0x27, 0x23, 0x97, ...Array(12).fill(0)]),
      Uint8Array.from(Array(16).fill(0xab)),
    ];
    let n = 0;
    expect(semillaAvatarNueva(CI, () => salidas[n++] as Uint8Array)).toBe(
      "ab".repeat(16),
    );
  });

  test("raíz y base del selector: opaca se conserva; con cédula, una nueva", () => {
    const R = "0a1b2c3d4e5f60718293a4b5c6d7e8f9";
    expect(raizSemilla(R)).toBe(R);
    expect(raizSemilla(`${R}-4-7`)).toBe(R);
    expect(raizSemilla("33272397-12-0")).toBe("33272397");
    expect(baseSelectorAvatar(`${R}-2-3`, "33272397")).toBe(R);
    expect(baseSelectorAvatar("33272397", "33272397", () => R)).toBe(R);
    expect(baseSelectorAvatar("33272397-1-1", "33272397", () => R)).toBe(R);
    expect(baseSelectorAvatar("33272397", "33272397")).not.toContain(
      "33272397",
    );
  });

  test("zAvatarElegido: solo opciones de la raíz guardada y nunca con la cédula", () => {
    const CI = "33272397";
    const R = "0a1b2c3d4e5f60718293a4b5c6d7e8f9";
    const otra = "ffffffffffffffffffffffffffffffff";
    const ok = (actual: string, semilla: string) =>
      zAvatarElegido(actual, CI).safeParse({ estilo: "fun-emoji", semilla })
        .success;
    // Raíz opaca: sus 8 opciones de cualquier tanda, nada más
    for (const s of [...semillasAvatar(R, 0), ...semillasAvatar(R, 3)])
      expect(ok(`${R}-1-1`, s)).toBe(true);
    expect(ok(R, otra)).toBe(false);
    expect(ok(R, `${otra}-1-1`)).toBe(false);
    expect(ok(R, `${R}-1-9`)).toBe(false);
    expect(ok(R, "lo-que-sea")).toBe(false);
    // Guardada aún con la cédula: cualquier raíz nueva con la forma de semillaAvatarNueva
    expect(ok(CI, otra)).toBe(true);
    expect(ok(`${CI}-2-4`, `${otra}-5-6`)).toBe(true);
    // …pero nunca la cédula, ni con sufijo, ni dentro de una «opaca»
    expect(ok(CI, CI)).toBe(false);
    expect(ok(CI, `${CI}-1-2`)).toBe(false);
    expect(ok(CI, `${CI}${"0".repeat(24)}`)).toBe(false);
    // Estilo fuera de los 4
    expect(
      zAvatarElegido(R, CI).safeParse({ estilo: "lorelei", semilla: R })
        .success,
    ).toBe(false);
  });

  test("cn sustituye la sombra del segmentado por los anillos propios", () => {
    expect(
      cn("data-[state=on]:shadow-1", "data-[state=on]:shadow-avatar-opt"),
    ).toBe("data-[state=on]:shadow-avatar-opt");
    expect(cn("shadow-1 rounded-md", "shadow-done rounded-done")).toBe(
      "shadow-done rounded-done",
    );
  });
});

describe("datos de ejemplo (seed)", () => {
  test("Yeilin: 4 campos del lienzo, capitana de 5A-G2, sin base", () => {
    const p = perfilDe();
    expect(p.nombre).toBe("Yeilin Marilyn Duarte Moncayo");
    expect(p.campos.map((c) => c.valor)).toEqual([
      "Yeilin",
      "Marilyn",
      "Duarte",
      "Moncayo",
    ]);
    expect(p.capitan).toBe("Capitán · 5A-G2");
    expect(p.base).toBeNull();
  });
  test("quien no es capitán no lleva el chip", () => {
    expect(perfilDe(alumnoPorCedula("33498239")).capitan).toBeUndefined();
  });
});
