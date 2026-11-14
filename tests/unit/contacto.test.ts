import { describe, expect, test } from "bun:test";
import { EMAIL_INVALIDO } from "@/lib/alumnos";
import {
  avatarVisibleProfe,
  contactoAFormulario,
  enlaceCorreo,
  enlaceWhatsApp,
  erroresContacto,
  type FilaContactoProfe,
  normalizarTelefono,
  OPERADORAS_MOVILES,
  TELEFONO_INVALIDO,
  tarjetasProfes,
  telefonoTexto,
  zContacto,
} from "@/lib/contacto";
import { estiloDe } from "@/lib/vistas-estudiante";

describe("avatarVisibleProfe (D389)", () => {
  const CI = "30262232";
  test("semilla con la cédula (sola o con sufijo de tanda) → null: iniciales", () => {
    expect(
      avatarVisibleProfe({ estilo: "fun-emoji", semilla: CI }, CI),
    ).toBeNull();
    expect(
      avatarVisibleProfe({ estilo: "fun-emoji", semilla: `${CI}-3-5` }, CI),
    ).toBeNull();
  });
  test("semilla opaca → el avatar tal cual, sin la cédula", () => {
    const a = {
      estilo: "fun-emoji",
      semilla: "0a1b2c3d4e5f60718293a4b5c6d7e8f9",
    };
    expect(avatarVisibleProfe(a, CI)).toEqual(a);
    expect(JSON.stringify(avatarVisibleProfe(a, CI))).not.toContain(CI);
  });
});

describe("normalizarTelefono", () => {
  test("las formas habituales de escribirlo dan el mismo E.164 sin +", () => {
    for (const t of [
      "0412-1234567",
      "0412 123 4567",
      "04121234567",
      "(0412) 123.45.67",
      "+58 412 1234567",
      "+58-412-123-45-67",
      "+58 0412 1234567",
      "00584121234567",
      "584121234567",
      "4121234567",
      "  0412-123 45 67  ",
    ])
      expect(normalizarTelefono(t)).toBe("584121234567");
  });

  test("las seis operadoras móviles valen", () => {
    expect(OPERADORAS_MOVILES).toEqual([
      "412",
      "414",
      "416",
      "422",
      "424",
      "426",
    ]);
    for (const op of OPERADORAS_MOVILES)
      expect(normalizarTelefono(`0${op}-7654321`)).toBe(`58${op}7654321`);
  });

  test("fijos, otras operadoras, largos equivocados y basura no", () => {
    for (const t of [
      "",
      "0212-1234567", // fijo de Caracas
      "0418-1234567", // operadora que no existe
      "0412-123456", // falta una cifra
      "0412-12345678", // sobra una
      "+57 412 1234567", // otro país
      "+1 412 123 4567",
      "0412-123456a",
      "0412/1234567",
      "teléfono",
    ])
      expect(normalizarTelefono(t)).toBeNull();
  });
});

describe("textos y enlaces", () => {
  test("se muestra como se dicta en Venezuela", () => {
    expect(telefonoTexto("584121234567")).toBe("0412-123 45 67");
    expect(telefonoTexto("584267654321")).toBe("0426-765 43 21");
    expect(telefonoTexto("raro")).toBe("raro");
  });
  test("wa.me con solo cifras y mailto", () => {
    expect(enlaceWhatsApp("584121234567")).toBe("https://wa.me/584121234567");
    expect(enlaceCorreo("profe@gmail.com")).toBe("mailto:profe@gmail.com");
  });
});

describe("zContacto", () => {
  test("normaliza el teléfono y el correo; vacío = borrar", () => {
    expect(
      zContacto.parse({
        telefono: "0414 765 4321",
        email: " Profe@Liceo.EDU.ve ",
      }),
    ).toEqual({
      telefono: "584147654321",
      emailContacto: "profe@liceo.edu.ve",
    });
    expect(zContacto.parse({ telefono: "  ", email: "" })).toEqual({
      telefono: null,
      emailContacto: null,
    });
  });
  test("rechaza un teléfono o correo inválido, y campos que faltan", () => {
    expect(
      zContacto.safeParse({ telefono: "0212-1234567", email: "" }).success,
    ).toBe(false);
    expect(zContacto.safeParse({ telefono: "", email: "profe@" }).success).toBe(
      false,
    );
    expect(zContacto.safeParse({ telefono: "" }).success).toBe(false);
  });
  test("errores del formulario por campo", () => {
    expect(erroresContacto({ telefono: "0412", email: "x" })).toEqual({
      telefono: TELEFONO_INVALIDO,
      email: EMAIL_INVALIDO,
    });
    expect(erroresContacto({ telefono: "04121234567", email: "" })).toEqual({});
  });
  test("lo guardado vuelve al formulario como se muestra", () => {
    expect(
      contactoAFormulario({
        telefono: "584121234567",
        emailContacto: "a@b.co",
      }),
    ).toEqual({ telefono: "0412-123 45 67", email: "a@b.co" });
    expect(
      contactoAFormulario({ telefono: null, emailContacto: null }),
    ).toEqual({
      telefono: "",
      email: "",
    });
    // Ida y vuelta: el texto mostrado se vuelve a aceptar
    expect(normalizarTelefono("0412-123 45 67")).toBe("584121234567");
  });
});

describe("tarjetasProfes", () => {
  const fila = (
    nombres: string,
    apellidos: string,
    telefono: string | null,
    emailContacto: string | null,
    avatar: FilaContactoProfe["avatar"] = null,
  ): FilaContactoProfe => ({
    nombres,
    apellidos,
    telefono,
    emailContacto,
    avatar,
  });

  test("avatar del profe (D389): estilo válido y su semilla, o null → iniciales", () => {
    const [con, sin, raro] = tarjetasProfes([
      fila("Ana", "Díaz", "584241112233", null, {
        estilo: "bottts-neutral",
        semilla: "9f2c4e7a1b3d5f6081a2b3c4d5e6f708",
      }),
      fila("Beto", "Luna", "584241112233", null),
      fila("Carla", "Mora", "584241112233", null, {
        estilo: "estilo-que-ya-no-existe",
        semilla: "abc",
      }),
    ]);
    expect(con?.avatar).toEqual({
      estilo: "bottts-neutral",
      seed: "9f2c4e7a1b3d5f6081a2b3c4d5e6f708",
    });
    expect(sin?.avatar).toBeNull();
    expect(raro?.avatar?.estilo).toBe(estiloDe("estilo-que-ya-no-existe"));
  });

  test("solo los profes con algún dato válido, por nombre corto", () => {
    const t = tarjetasProfes([
      fila("Yolanda María", "Pérez Gil", null, "yolanda@gmail.com"),
      fila("Carlos", "Ruiz", null, null),
      fila("Ana", "Díaz", "584241112233", null),
      fila("Beto", "Luna", "basura", "no-es-correo"),
    ]);
    expect(t.map((x) => x.nombre)).toEqual(["Ana Díaz", "Yolanda Pérez"]);
    expect(t[0]?.whatsapp).toEqual({
      href: "https://wa.me/584241112233",
      texto: "0424-111 22 33",
    });
    expect(t[0]?.correo).toBeNull();
    expect(t[1]?.whatsapp).toBeNull();
    expect(t[1]?.correo).toEqual({
      href: "mailto:yolanda@gmail.com",
      texto: "yolanda@gmail.com",
    });
    expect(new Set(t.map((x) => x.clave)).size).toBe(2);
  });

  test("sin profes con contacto: lista vacía (la tarjeta no se muestra)", () => {
    expect(tarjetasProfes([])).toEqual([]);
    expect(tarjetasProfes([fila("Carlos", "Ruiz", null, null)])).toEqual([]);
  });
});
