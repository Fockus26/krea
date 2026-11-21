// Evaluar en vivo (D441, D443): la huella de la cola y qué aviso merece la entrega abierta.
import { describe, expect, test } from "bun:test";
import {
  avisoEntrega,
  type EntregaVivo,
  huellaCola,
  RUTA_VERSION_EVALUAR,
  rutaVersionEvaluar,
} from "@/lib/evaluar-vivo";

const base = { total: 3, porEvaluar: 1, maxEnviada: 100, maxEvaluada: 200 };

describe("huellaCola", () => {
  test("cambia con cada parte del resumen", () => {
    const h = huellaCola(base);
    expect(huellaCola({ ...base })).toBe(h);
    expect(huellaCola({ ...base, total: 2 })).not.toBe(h);
    expect(huellaCola({ ...base, porEvaluar: 0 })).not.toBe(h);
    expect(huellaCola({ ...base, maxEnviada: 101 })).not.toBe(h);
    expect(huellaCola({ ...base, maxEvaluada: 201 })).not.toBe(h);
  });

  test("sin entregas ni evaluaciones", () => {
    expect(
      huellaCola({
        total: 0,
        porEvaluar: 0,
        maxEnviada: null,
        maxEvaluada: null,
      }),
    ).toBe("0.0.0.0");
  });
});

describe("rutaVersionEvaluar", () => {
  test("sin nada, con `desde` y con la entrega", () => {
    expect(rutaVersionEvaluar({})).toBe(RUTA_VERSION_EVALUAR);
    expect(rutaVersionEvaluar({ desde: "1.0.5.0" })).toBe(
      `${RUTA_VERSION_EVALUAR}?desde=1.0.5.0`,
    );
    expect(rutaVersionEvaluar({ desde: null, entrega: "t__1" })).toBe(
      `${RUTA_VERSION_EVALUAR}?entrega=t__1`,
    );
  });
});

describe("avisoEntrega", () => {
  const e = (o: Partial<EntregaVivo>): EntregaVivo => ({
    estado: "evaluada",
    evaluadaEn: 500,
    por: "Adela Pérez",
    porMi: false,
    ...o,
  });

  test("sin datos de la entrega o sin cambios, nada", () => {
    expect(avisoEntrega(null, undefined)).toBeNull();
    expect(
      avisoEntrega(null, e({ estado: "entregada", evaluadaEn: null })),
    ).toBeNull();
    expect(avisoEntrega(500, e({}))).toBeNull();
  });

  test("lo propio no avisa", () => {
    expect(avisoEntrega(null, e({ porMi: true }))).toBeNull();
  });

  test("otro la evaluó, la corrigió o la deshizo", () => {
    expect(avisoEntrega(null, e({}))?.texto).toBe(
      "Adela Pérez acaba de evaluar esta entrega.",
    );
    expect(avisoEntrega(300, e({}))?.texto).toBe(
      "Adela Pérez cambió la nota de esta entrega.",
    );
    expect(avisoEntrega(300, e({ por: null }))?.texto).toBe(
      "Otra persona cambió la nota de esta entrega.",
    );
    expect(
      avisoEntrega(300, e({ estado: "entregada", evaluadaEn: null, por: null }))
        ?.tipo,
    ).toBe("evaluada");
    // dos cambios distintos, dos claves distintas
    expect(avisoEntrega(null, e({}))?.clave).not.toBe(
      avisoEntrega(null, e({ evaluadaEn: 600 }))?.clave,
    );
  });

  test("devuelta o eliminada", () => {
    expect(avisoEntrega(null, null)?.tipo).toBe("fuera");
    expect(avisoEntrega(500, e({ estado: "borrador" }))?.tipo).toBe("fuera");
  });
});
