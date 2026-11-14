// Presencia en «Evaluar entrega» (pedido 8, D408–D410): la clave `entrega:<id>`, el pedido del POST
// y el texto del aviso. Lo de «Editar alumno» lo prueba tests/unit/presencia.test.ts.
import { describe, expect, test } from "bun:test";
import {
  avisoPresenciaEntrega,
  claveDePedido,
  claveEntrega,
  type EntradaPresencia,
  editoresVigentes,
  entregaDeClave,
  esClaveEntrega,
  presenciaEvaluarTexto,
  presenciaTexto,
  zIdEntrega,
  zPedidoPresencia,
} from "@/lib/presencia";

const ENTREGA = "identidad-marca__39740003";

describe("clave de una entrega (D408)", () => {
  test("`entrega:<id>` y su inverso", () => {
    expect(claveEntrega(ENTREGA)).toBe(`entrega:${ENTREGA}`);
    expect(esClaveEntrega(claveEntrega(ENTREGA))).toBe(true);
    expect(entregaDeClave(claveEntrega(ENTREGA))).toBe(ENTREGA);
  });

  test("una cédula nunca se toma por una entrega", () => {
    expect(esClaveEntrega("39740003")).toBe(false);
    expect(entregaDeClave("39740003")).toBeNull();
  });

  test("el id sigue el patrón de `zIdDocumento`", () => {
    expect(zIdEntrega.safeParse(ENTREGA).success).toBe(true);
    expect(zIdEntrega.safeParse("").success).toBe(false);
    expect(zIdEntrega.safeParse("a/b").success).toBe(false);
    expect(zIdEntrega.safeParse("entrega:x").success).toBe(false);
    expect(zIdEntrega.safeParse("x".repeat(201)).success).toBe(false);
  });
});

describe("pedido del POST", () => {
  const ok = (v: unknown) => zPedidoPresencia.safeParse(v).success;

  test("con cédula (Editar alumno), como hasta ahora", () => {
    const p = zPedidoPresencia.parse({ accion: "marcar", cedula: "39740003" });
    expect(claveDePedido(p)).toBe("39740003");
  });

  test("con entrega (Evaluar): la clave lleva el prefijo", () => {
    const p = zPedidoPresencia.parse({ accion: "quitar", entrega: ENTREGA });
    expect(claveDePedido(p)).toBe(`entrega:${ENTREGA}`);
  });

  test("ambos, ninguno o valores inválidos se rechazan", () => {
    expect(ok({ accion: "marcar", cedula: "39740003", entrega: ENTREGA })).toBe(
      false,
    );
    expect(ok({ accion: "marcar" })).toBe(false);
    expect(ok({ accion: "borrar", entrega: ENTREGA })).toBe(false);
    expect(ok({ accion: "marcar", cedula: "entrega:x" })).toBe(false);
    expect(ok({ accion: "marcar", entrega: "a b" })).toBe(false);
    expect(ok(null)).toBe(false);
  });
});

describe("texto del aviso en Evaluar (D410)", () => {
  const n = (nombre: string) => ({ nombre });

  test("vacío sin nadie (no se pinta nada)", () => {
    expect(presenciaEvaluarTexto([])).toBe("");
    expect(avisoPresenciaEntrega("")).toBe("");
  });

  test("uno, dos y tres o más", () => {
    expect(presenciaEvaluarTexto([n("Ana Pérez")])).toBe(
      "Ana Pérez está evaluando",
    );
    expect(presenciaEvaluarTexto([n("Ana Pérez"), n("Luis Díaz")])).toBe(
      "Ana Pérez y Luis Díaz están evaluando",
    );
    expect(
      presenciaEvaluarTexto([n("Ana Pérez"), n("Luis Díaz"), n("Eva Gil")]),
    ).toBe("Ana Pérez y 2 más están evaluando");
  });

  test("el aviso completo", () => {
    expect(avisoPresenciaEntrega(presenciaEvaluarTexto([n("Ana Pérez")]))).toBe(
      "Ana Pérez está evaluando esta entrega. Si guarda antes que tú, te avisaremos.",
    );
  });

  test("el texto de Editar alumno no cambia", () => {
    expect(presenciaTexto([n("Ana Pérez"), n("Luis Díaz"), n("Eva Gil")])).toBe(
      "Ana Pérez y 2 más están editando",
    );
  });

  test("otra pestaña mía no es «otro profe»", () => {
    const e = (profeId: string): EntradaPresencia => ({
      profeId,
      nombre: profeId,
      desde: 0,
      latido: 1_000,
    });
    expect(
      editoresVigentes([e("yo"), e("otro")], 1_000, "yo").map((x) => x.profeId),
    ).toEqual(["otro"]);
  });
});
