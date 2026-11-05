import { describe, expect, test } from "bun:test";
import {
  accionesNotFound,
  codigoError,
  digestDe,
  formatFechaHora,
  formatUltimaActualizacion,
  galeriaEstadosVisible,
  inicioDe,
  PANTALLAS_ESTADO,
  pantallaDe,
  sesionPorRuta,
} from "@/lib/estados";

describe("sesionPorRuta (D160, provisional hasta la fase 07)", () => {
  test("profesor por el prefijo /profe", () => {
    expect(sesionPorRuta("/profe")).toBe("profesor");
    expect(sesionPorRuta("/profe/tareas/no-existe")).toBe("profesor");
  });
  test("estudiante en sus rutas y en /", () => {
    for (const r of [
      "/",
      "/notas/x",
      "/tareas/y",
      "/equipo",
      "/ranking",
      "/perfil",
    ])
      expect(sesionPorRuta(r)).toBe("estudiante");
  });
  test("sin sesión en lo demás (no confunde prefijos parecidos)", () => {
    expect(sesionPorRuta("/xyz")).toBeNull();
    expect(sesionPorRuta("/profesores")).toBeNull();
    expect(sesionPorRuta("/notasx")).toBeNull();
  });
});

describe("accionesNotFound (§5b)", () => {
  test("estudiante: Ir al inicio · Mis notas", () => {
    expect(accionesNotFound("estudiante").map((a) => a.label)).toEqual([
      "Ir al inicio",
      "Mis notas",
    ]);
  });
  test("profesor: Ir al inicio (/profe) · Evaluar", () => {
    expect(accionesNotFound("profesor")).toEqual([
      { label: "Ir al inicio", href: "/profe" },
      { label: "Evaluar", href: "/profe/evaluar" },
    ]);
  });
  test("sin sesión: Ir al inicio · Iniciar sesión", () => {
    expect(accionesNotFound(null)[1]).toEqual({
      label: "Iniciar sesión",
      href: "/ingresar",
    });
  });
  test("inicioDe", () => {
    expect(inicioDe("profesor")).toBe("/profe");
    expect(inicioDe("estudiante")).toBe("/");
  });
});

describe("codigoError (D161)", () => {
  test("KR-{status}-{6 primeros del digest en mayúsculas}", () => {
    expect(codigoError(500, "7f3a9c12ab")).toBe("KR-500-7F3A9C");
    expect(codigoError(500, "2345678901")).toBe("KR-500-234567");
  });
  test("sin digest o sin 6 hex al inicio: sin código", () => {
    expect(codigoError(500)).toBeNull();
    expect(codigoError(500, null)).toBeNull();
    expect(codigoError(500, "")).toBeNull();
    expect(codigoError(500, "abc")).toBeNull();
    expect(codigoError(500, "NEXT_NOT_FOUND")).toBeNull();
  });
  test("digestDe solo lee un digest de texto", () => {
    expect(digestDe(Object.assign(new Error("x"), { digest: "abc123" }))).toBe(
      "abc123",
    );
    expect(digestDe(new Error("x"))).toBeNull();
    expect(digestDe("texto")).toBeNull();
    expect(digestDe(null)).toBeNull();
    expect(digestDe({ digest: 42 })).toBeNull();
  });
});

describe("fechas del estado", () => {
  test("formatFechaHora: dd/mm/aaaa, h:mm a. m./p. m.", () => {
    expect(formatFechaHora(new Date(2026, 9, 25, 16, 22))).toBe(
      "25/10/2026, 4:22 p. m.",
    );
    expect(formatFechaHora(new Date(2026, 0, 5, 0, 7))).toBe(
      "05/01/2026, 12:07 a. m.",
    );
    expect(formatFechaHora(new Date(2026, 0, 5, 12, 0))).toBe(
      "05/01/2026, 12:00 p. m.",
    );
  });
  test("formatUltimaActualizacion: «hoy, …» el mismo día", () => {
    const ahora = new Date(2026, 9, 25, 18, 0);
    expect(
      formatUltimaActualizacion(new Date(2026, 9, 25, 16, 20), ahora),
    ).toBe("hoy, 4:20 p. m.");
    expect(
      formatUltimaActualizacion(new Date(2026, 9, 24, 16, 20), ahora),
    ).toBe("24/10/2026, 4:20 p. m.");
  });
});

describe("galería /estados (D162)", () => {
  test("pantallaDe: valor válido, o la primera", () => {
    expect(pantallaDe("500-codigo")).toBe("500-codigo");
    expect(pantallaDe(["sin-conexion", "x"])).toBe("sin-conexion");
    expect(pantallaDe("nope")).toBe(PANTALLAS_ESTADO[0].id);
    expect(pantallaDe(undefined)).toBe(PANTALLAS_ESTADO[0].id);
  });
  test("ids únicos", () => {
    const ids = PANTALLAS_ESTADO.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test("visible en desarrollo y en vistas previas; nunca en producción", () => {
    expect(galeriaEstadosVisible({ NODE_ENV: "development" })).toBe(true);
    expect(
      galeriaEstadosVisible({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toBe(true);
    expect(
      galeriaEstadosVisible({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
    expect(galeriaEstadosVisible({ NODE_ENV: "production" })).toBe(false);
  });
});

describe("banner sin conexión (D164)", () => {
  test("mensaje por rol con la hora de los datos", async () => {
    const { mensajeSinConexion, formatHora, TOAST_EN_LINEA_MS } = await import(
      "@/lib/estados"
    );
    const h = new Date(2026, 9, 25, 16, 20);
    expect(formatHora(h)).toBe("4:20 p. m.");
    expect(mensajeSinConexion("estudiante", h)).toBe(
      "Sin conexión. Ves tus notas de las 4:20 p. m.",
    );
    expect(mensajeSinConexion("profesor", h)).toBe(
      "Sin conexión. Ves los datos de las 4:20 p. m.",
    );
    expect(TOAST_EN_LINEA_MS).toBe(3000);
  });
});

describe("carga (D167)", () => {
  test("aviso de carga lenta a los 8 s", async () => {
    const { CARGA_LENTA_MS } = await import("@/lib/estados");
    expect(CARGA_LENTA_MS).toBe(8000);
  });
  test("cada ruta de los dos grupos tiene su loading.tsx", async () => {
    const { existsSync, readdirSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    // Se descubren solas: el `loading` del padre no cubre las subrutas (D219)
    const sinCarga = ["app/(estudiante)", "app/(profesor)"].flatMap((grupo) =>
      readdirSync(grupo, { recursive: true, encoding: "utf8" })
        .filter((f) => f.endsWith("page.tsx"))
        .map((f) => join(grupo, dirname(f)))
        .filter((d) => !existsSync(join(d, "loading.tsx"))),
    );
    expect(sinCarga).toEqual([]);
  });
});
