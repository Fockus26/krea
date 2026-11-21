import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  ACENTOS_CORREO,
  COLORES_CORREO_POR_ACENTO,
  estiloCorreo,
  TEMAS_CORREO,
} from "@/lib/correo/paleta";
import {
  ASUNTO_RESTABLECER,
  COLORES_CORREO,
  correoRestablecer,
  escaparHtml,
  VARIANTE_CORREO,
  VARIANTES_CORREO,
} from "@/lib/correo/restablecer";
import { contraste } from "@/lib/grades";

/**
 * Presentaciones del correo de restablecer (D341) con el acento y el tema del perfil (D342): cada
 * variante × acento × tema lleva el asunto, el enlace escapado y el texto plano, y cada par de
 * colores de la tabla llega a 4,5:1.
 */
const ENLACE =
  "https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=A<B>";
const TEMA_PERFIL = { claro: "light", oscuro: "dark" } as const;
const MIN_TEXTO = 4.5;

describe("tabla de colores por acento y tema (D342)", () => {
  for (const tema of TEMAS_CORREO) {
    for (const acento of ACENTOS_CORREO) {
      const c = COLORES_CORREO_POR_ACENTO[tema][acento];
      const pares: [string, string, string][] = [
        ["texto / tarjeta", c.texto, c.tarjeta],
        ["texto / fondo", c.texto, c.fondo],
        ["texto 2 / tarjeta", c.texto2, c.tarjeta],
        ["texto 2 / fondo", c.texto2, c.fondo],
        ["texto 2 / pie", c.texto2, c.pie],
        ["botón: sobre marca / marca", c.sobreMarca, c.marca],
        ["enlace / tarjeta", c.enlace, c.tarjeta],
        ["enlace / fondo", c.enlace, c.fondo],
        ["enlace / pie", c.enlace, c.pie],
        ["píldora splash", c.sobreSplash, c.splash],
      ];
      for (const [par, a, b] of pares) {
        test(`${tema} · ${acento} · ${par} ≥ 4,5:1`, () => {
          expect(contraste(a, b)).toBeGreaterThanOrEqual(MIN_TEXTO);
        });
      }
    }
  }

  test("los valores son espejo de los tokens de app/globals.css", () => {
    const css = readFileSync("app/globals.css", "utf8").toLowerCase();
    for (const tema of TEMAS_CORREO)
      for (const acento of ACENTOS_CORREO) {
        const c = COLORES_CORREO_POR_ACENTO[tema][acento];
        for (const v of [
          c.fondo,
          c.tarjeta,
          c.pie,
          c.texto,
          c.texto2,
          c.marca,
          c.enlace,
          c.splash,
        ])
          expect(css).toContain(v.toLowerCase());
      }
  });

  test("azul en claro = los colores de la presentación original (HANDOFF §5c)", () => {
    expect(COLORES_CORREO).toMatchObject({
      fondo: "#F6F4FA",
      tarjeta: "#FFFFFF",
      marca: "#295AC3",
      sobreMarca: "#FFFFFF",
      texto: "#221D2B",
      texto2: "#5E5869",
      pie: "#F0EDF6",
    });
  });
});

describe("apariencia del perfil → estilo del correo", () => {
  test("sin apariencia: azul en claro, con la media query oscura", () => {
    expect(estiloCorreo(null)).toEqual({
      acento: "azul",
      tema: "claro",
      conModoOscuro: true,
    });
    expect(estiloCorreo(undefined).acento).toBe("azul");
  });

  test("sistema → claro con media query; oscuro → colores oscuros fijos, sin media query", () => {
    expect(estiloCorreo({ tema: "system", acento: "rojo" })).toEqual({
      acento: "rojo",
      tema: "claro",
      conModoOscuro: true,
    });
    expect(estiloCorreo({ tema: "light", acento: "verde" }).tema).toBe("claro");
    expect(estiloCorreo({ tema: "dark", acento: "morado" })).toEqual({
      acento: "morado",
      tema: "oscuro",
      conModoOscuro: false,
    });
  });

  test("un acento desconocido cae en azul", () => {
    expect(
      estiloCorreo({ acento: "naranja" as unknown as "azul" }).acento,
    ).toBe("azul");
  });
});

describe("variantes × acento × tema (D341)", () => {
  test("se envía Banda de color, la que eligió César (D341)", () => {
    expect(VARIANTE_CORREO).toBe("banda");
    expect(VARIANTES_CORREO.map((v) => v.id)).toEqual([
      "tarjeta",
      "banda",
      "minimal",
      "ludica",
    ]);
  });

  for (const { id } of VARIANTES_CORREO)
    for (const tema of TEMAS_CORREO)
      for (const acento of ACENTOS_CORREO) {
        test(`${id} · ${acento} · ${tema}`, () => {
          const c = COLORES_CORREO_POR_ACENTO[tema][acento];
          const correo = correoRestablecer(
            {
              nombre: "<Adela>",
              cedula: "45009896",
              enlace: ENLACE,
              apariencia: { tema: TEMA_PERFIL[tema], acento },
            },
            id,
          );
          expect(correo.asunto).toBe(ASUNTO_RESTABLECER);
          const { html, texto } = correo;
          expect(html).toContain(`<title>${ASUNTO_RESTABLECER}</title>`);
          expect(html).toContain(`href="${escaparHtml(ENLACE)}"`);
          expect(html).not.toContain(ENLACE);
          expect(html).toContain("Hola, &lt;Adela&gt;");
          expect(html).not.toContain("<Adela>");
          expect(html).toContain("45•••896");
          expect(html).not.toContain("45009896");
          expect(html).toContain("Crear nueva contraseña");
          expect(html).toContain("v:roundrect");
          expect(html).toContain(`fillcolor="${c.marca}"`);
          expect(html).toContain(`background:${c.marca}`);
          expect(html).toContain(`color:${c.sobreMarca}`);
          expect(html).not.toContain("[correo");
          // El texto plano es el mismo en las cuatro presentaciones.
          expect(texto).toContain("Hola, <Adela>");
          expect(texto).toContain(ENLACE);
          expect(texto).not.toContain("45009896");
          // Claro: media query para los clientes que la leen; oscuro: colores fijos.
          if (tema === "claro") {
            expect(html).toContain("prefers-color-scheme: dark");
            expect(html).toContain(
              COLORES_CORREO_POR_ACENTO.oscuro[acento].fondo,
            );
            expect(html).toContain('content="light dark"');
          } else {
            expect(html).not.toContain("prefers-color-scheme");
            expect(html).toContain('content="dark"');
          }
        });
      }

  test("la galería puede quitar la media query oscura (el claro queda fijo)", () => {
    const { html } = correoRestablecer(
      { nombre: "Adela", cedula: "45009896", enlace: ENLACE },
      "banda",
      { modoOscuroDelCliente: false },
    );
    expect(html).not.toContain("prefers-color-scheme");
    expect(html).toContain('content="light"');
  });

  test("el texto plano no cambia entre presentaciones", () => {
    const datos = { nombre: "Adela", cedula: "45009896", enlace: ENLACE };
    const textos = new Set(
      VARIANTES_CORREO.map(({ id }) => correoRestablecer(datos, id).texto),
    );
    expect(textos.size).toBe(1);
  });

  test("las cuatro presentaciones son distintas", () => {
    const datos = { nombre: "Adela", cedula: "45009896", enlace: ENLACE };
    const htmls = new Set(
      VARIANTES_CORREO.map(({ id }) => correoRestablecer(datos, id).html),
    );
    expect(htmls.size).toBe(4);
  });
});
