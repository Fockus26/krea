import { describe, expect, test } from "bun:test";
import { perfilDe } from "@/lib/demo/perfil";
import { alumnoPorCedula } from "@/lib/demo/seed";
import {
  baseChipTexto,
  capitanChipTexto,
  cedulaTexto,
  ESTILOS_AVATAR,
  OPCIONES_POR_TANDA,
  partirNombre,
  semillasAvatar,
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
