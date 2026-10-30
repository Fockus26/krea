import { describe, expect, test } from "bun:test";
import { maskCedula, maskEmail } from "@/lib/mask";

describe("maskEmail", () => {
  test("primera letra + 4 puntos + dominio", () => {
    expect(maskEmail("yosoy@gmail.com")).toBe("y••••@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a••••@b.co");
  });
  test("sin arroba válida, todo oculto", () => {
    expect(maskEmail("sinarroba")).toBe("••••");
  });
});

describe("maskCedula", () => {
  test("2 primeros + 3 puntos + 3 últimos", () => {
    expect(maskCedula("33217397")).toBe("33•••397");
    expect(maskCedula("123456")).toBe("12•••456");
  });
  test("demasiado corta, todo oculto", () => {
    expect(maskCedula("123")).toBe("•••");
  });
});
