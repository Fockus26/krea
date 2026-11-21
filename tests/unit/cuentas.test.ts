import { describe, expect, test } from "bun:test";
import { validarPassword } from "@/lib/auth";
import {
  ALFABETO_TEMPORAL,
  errorProfesorTexto,
  filasProfesores,
  generarPasswordTemporal,
  LARGO_TEMPORAL,
  usuarioNuevo,
  zCrearProfesor,
  zEntradaCuenta,
  zMisDatos,
} from "@/lib/cuentas-datos";
import { claimsDe, type Usuario, zUsuario } from "@/lib/modelo";
import { semillaAvatarNueva, zCrearPassword } from "@/lib/perfil";

describe("contraseña temporal (D232)", () => {
  test("12 símbolos del alfabeto en 3 bloques de 4 con guion", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generarPasswordTemporal();
      expect(pw).toMatch(/^[^-]{4}-[^-]{4}-[^-]{4}$/);
      const simbolos = pw.replaceAll("-", "");
      expect(simbolos).toHaveLength(LARGO_TEMPORAL);
      for (const c of simbolos) expect(ALFABETO_TEMPORAL).toContain(c);
      expect(validarPassword(pw).estado).toBe("ok");
    }
  });

  test("sin caracteres ambiguos (0/O/o, 1/l/I)", () => {
    for (const c of "0Oo1lI") expect(ALFABETO_TEMPORAL).not.toContain(c);
    expect(new Set(ALFABETO_TEMPORAL).size).toBe(ALFABETO_TEMPORAL.length);
  });

  test("muestreo por rechazo: descarta los bytes que sesgarían el reparto", () => {
    const n = ALFABETO_TEMPORAL.length; // 56 → se aceptan 0..223
    let llamada = 0;
    const fijo = (len: number) => {
      llamada++;
      // Primera tanda: todo ≥ 224 (se descarta); la segunda, 0, 1, 2…
      return llamada === 1
        ? new Uint8Array(len).fill(250)
        : Uint8Array.from({ length: len }, (_, i) => i);
    };
    const pw = generarPasswordTemporal(fijo);
    expect(llamada).toBe(2);
    expect(pw.replaceAll("-", "")).toBe(ALFABETO_TEMPORAL.slice(0, 12));
    expect(Math.floor(256 / n) * n).toBe(224);
  });

  test("dos contraseñas seguidas no se repiten", () => {
    const vistas = new Set(
      Array.from({ length: 50 }, () => generarPasswordTemporal()),
    );
    expect(vistas.size).toBe(50);
  });
});

describe("entrada de una cuenta (genérica por rol)", () => {
  test("profesor: trim, email vacío → null, en minúsculas", () => {
    const r = zEntradaCuenta.parse({
      rol: "profesor",
      cedula: " 45004948 ",
      nombres: "  Adela Juana ",
      apellidos: "Pérez",
      email: "",
    });
    expect(r).toEqual({
      rol: "profesor",
      cedula: "45004948",
      nombres: "Adela Juana",
      apellidos: "Pérez",
      email: null,
    });
    expect(
      zEntradaCuenta.parse({ ...r, email: " Adela@Gmail.com " }).email,
    ).toBe("adela@gmail.com");
  });

  test("rechaza cédula inválida, nombres vacíos y email mal escrito", () => {
    const ok = {
      rol: "profesor",
      cedula: "45004948",
      nombres: "Adela",
      apellidos: "Pérez",
      email: "",
    };
    expect(zEntradaCuenta.safeParse(ok).success).toBe(true);
    expect(zEntradaCuenta.safeParse({ ...ok, cedula: "123" }).success).toBe(
      false,
    );
    expect(zEntradaCuenta.safeParse({ ...ok, nombres: "   " }).success).toBe(
      false,
    );
    expect(zEntradaCuenta.safeParse({ ...ok, email: "adela@" }).success).toBe(
      false,
    );
    expect(zEntradaCuenta.safeParse({ ...ok, rol: "admin" }).success).toBe(
      false,
    );
  });

  test("estudiante: exige sección; base opcional", () => {
    const e = {
      rol: "estudiante",
      cedula: "39800001",
      nombres: "Luis",
      apellidos: "Gómez",
      email: "",
    };
    expect(zEntradaCuenta.safeParse(e).success).toBe(false);
    expect(zEntradaCuenta.safeParse({ ...e, seccion: "5A" }).success).toBe(
      true,
    );
    expect(
      zEntradaCuenta.safeParse({ ...e, seccion: "5A", base: 9 }).success,
    ).toBe(false);
  });

  test("formularios de Profesores y Perfil", () => {
    expect(
      zCrearProfesor.safeParse({
        cedula: "45004948",
        nombres: "Adela",
        apellidos: "Pérez",
        email: "",
      }).success,
    ).toBe(true);
    expect(zMisDatos.safeParse({ nombres: "", apellidos: "P" }).success).toBe(
      false,
    );
    expect(zCrearPassword.safeParse({ nueva: "corta" }).success).toBe(false);
    expect(zCrearPassword.safeParse({ nueva: "Kx7m-Pq4r-T9wz" }).success).toBe(
      true,
    );
  });
});

describe("usuarioNuevo", () => {
  test("profesor: sin sección, sin equipo, base 20, semilla opaca, cambio obligatorio", () => {
    const semilla = semillaAvatarNueva("45004948");
    const u = usuarioNuevo(
      {
        rol: "profesor",
        cedula: "45004948",
        nombres: "Adela",
        apellidos: "Pérez",
        email: null,
      },
      42,
      semilla,
    );
    expect(zUsuario.safeParse(u).success).toBe(true);
    expect(u.avatar.semilla).not.toContain("45004948");
    expect(u).toMatchObject({
      seccion: null,
      equipoId: null,
      base: 20,
      avatar: { semilla },
      debeCambiarPassword: true,
      actualizadoEn: 42,
    });
    expect(u.admin).toBeUndefined();
    expect(claimsDe(u)).toEqual({
      rol: "profesor",
      seccion: null,
      equipoId: null,
      debeCambiarPassword: true,
    });
  });

  test("estudiante: su sección y base 20 por defecto", () => {
    const u = usuarioNuevo(
      {
        rol: "estudiante",
        cedula: "39800001",
        nombres: "Luis",
        apellidos: "Gómez",
        email: null,
        seccion: "5C",
      },
      1,
      semillaAvatarNueva("39800001"),
    );
    expect(zUsuario.safeParse(u).success).toBe(true);
    expect(u.seccion).toBe("5C");
    expect(u.base).toBe(20);
  });

  test("nunca con una semilla que contenga la cédula (D388)", () => {
    const c = {
      rol: "estudiante" as const,
      cedula: "39800001",
      nombres: "Luis",
      apellidos: "Gómez",
      email: null,
      seccion: "5C" as const,
    };
    expect(() => usuarioNuevo(c, 1, "39800001")).toThrow();
    expect(() => usuarioNuevo(c, 1, "x39800001-1-2")).toThrow();
  });
});

describe("filasProfesores", () => {
  const base = {
    seccion: null,
    equipoId: null,
    base: 20,
    avatar: { estilo: "adventurer-neutral", semilla: "x" },
    actualizadoEn: 1,
  } as const;
  const usuarios: Usuario[] = [
    {
      ...base,
      cedula: "45001237",
      rol: "profesor",
      nombres: "César",
      apellidos: "Zapata",
      admin: true,
    },
    {
      ...base,
      cedula: "45004948",
      rol: "profesor",
      nombres: "Adela",
      apellidos: "Álvarez",
      debeCambiarPassword: true,
    },
    {
      ...base,
      cedula: "39800001",
      rol: "estudiante",
      nombres: "Luis",
      apellidos: "Gómez",
      seccion: "5A",
    },
  ];

  test("solo profesores, por apellido (con tildes), con marcas", () => {
    const f = filasProfesores(
      usuarios,
      { "45004948": "adela@gmail.com" },
      "45001237",
    );
    expect(f.map((p) => p.cedula)).toEqual(["45004948", "45001237"]);
    expect(f[0]).toMatchObject({
      email: "adela@gmail.com",
      admin: false,
      pendiente: true,
      tu: false,
    });
    expect(f[1]).toMatchObject({ email: null, admin: true, tu: true });
  });
});

test("errores con texto para cada código", () => {
  for (const e of [
    "invalida",
    "existe",
    "no-existe",
    "no-profesor",
    "tu-cuenta",
    "red",
  ] as const)
    expect(errorProfesorTexto(e).length).toBeGreaterThan(10);
  expect(errorProfesorTexto("existe")).toBe(
    "Ya existe una cuenta con esa cédula.",
  );
});
