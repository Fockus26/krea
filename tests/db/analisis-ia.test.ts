// % orientativo de IA sobre Postgres en memoria (tanda 11-14 Z1, D425–D429): el texto se lee en
// el servidor, un análisis por respuesta (se sobrescribe) y la lectura tolera filas raras.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  guardarAnalisis,
  leerAnalisis,
  leerAnalisisDe,
  textoDeRespuesta,
} from "@/lib/data/analisis-ia";
import type { Db } from "@/lib/db";
import { analisisIa } from "@/lib/db/schema";
import type { Entrega } from "@/lib/modelo";
import { baseNueva } from "./base";
import { ponerEntrega } from "./docs";

let base: Db;
const db = () => base;

const PROFE = "45001237";
const A1 = "39711001";
const E1 = "z1-t1_39711001";
const BORRADOR = "z1-t1_39711002";

function entrega(estado: Entrega["estado"], titular: string): Entrega {
  return {
    tareaId: "z1-t1",
    tipo: "individual",
    titularId: titular,
    seccion: "5A",
    integrantes: [titular],
    estado,
    respuestas: {
      p1: { texto: "Mi respuesta de texto." },
      p2: { imagenPath: "entregas/z1/p2.webp" },
    },
    enviadaPor: estado === "borrador" ? null : titular,
    enviadaEn: estado === "borrador" ? null : 1,
    evaluacion: null,
  };
}

beforeAll(async () => {
  base = await baseNueva();
  await ponerEntrega(db(), E1, entrega("entregada", A1));
  await ponerEntrega(db(), BORRADOR, entrega("borrador", "39711002"));
});

describe("análisis de IA (Postgres)", () => {
  test("lee el texto de la respuesta en el servidor", async () => {
    expect(await textoDeRespuesta(db(), E1, "p1")).toEqual({
      ok: true,
      texto: "Mi respuesta de texto.",
    });
    expect(await textoDeRespuesta(db(), E1, "p2")).toEqual({
      ok: false,
      error: "no-texto",
    });
    expect(await textoDeRespuesta(db(), E1, "p9")).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(await textoDeRespuesta(db(), "no-hay_1", "p1")).toEqual({
      ok: false,
      error: "no-existe",
    });
    // Un borrador todavía no es una entrega (D196)
    expect(await textoDeRespuesta(db(), BORRADOR, "p1")).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("guarda, lee y sobrescribe: uno por respuesta", async () => {
    const fila = {
      entregaId: E1,
      preguntaId: "p1",
      porcentaje: 40,
      huella: "a".repeat(64),
      modelo: "claude-haiku-5-5",
      autorId: PROFE,
      analizadoEn: 10,
    };
    await guardarAnalisis(db(), fila);
    expect(await leerAnalisisDe(db(), E1, "p1")).toEqual(fila);
    await guardarAnalisis(db(), {
      ...fila,
      porcentaje: 85,
      huella: "b".repeat(64),
      analizadoEn: 20,
    });
    const m = await leerAnalisis(db(), E1);
    expect(m.size).toBe(1);
    expect(m.get("p1")).toEqual({
      porcentaje: 85,
      huella: "b".repeat(64),
      analizadoEn: 20,
    });
  });

  test("una fila con un porcentaje fuera de 0–100 no se muestra; otra entrega, nada", async () => {
    await db()
      .insert(analisisIa)
      .values({
        entregaId: E1,
        preguntaId: "p3",
        porcentaje: 300,
        huella: "c".repeat(64),
        modelo: "claude-haiku-5-5",
        autorId: PROFE,
        analizadoEn: 30,
      });
    const m = await leerAnalisis(db(), E1);
    expect(m.has("p3")).toBe(false);
    expect((await leerAnalisis(db(), "otra_1")).size).toBe(0);
  });
});
