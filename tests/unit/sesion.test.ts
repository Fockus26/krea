import { describe, expect, test } from "bun:test";
import { errorIngresoDeEstado } from "@/lib/auth";
import {
  accesoDeRuta,
  destinoDe,
  inicioDe,
  RUTA_CREAR_PASSWORD,
  redireccion,
  type Sesion,
  sesionDeClaims,
} from "@/lib/sesion";

describe("contraseña temporal y admin (D231, D232)", () => {
  const temporalEst: Sesion = {
    uid: "45009896",
    rol: "estudiante",
    seccion: "5A",
    equipoId: null,
    debeCambiarPassword: true,
  };
  const temporalProfe: Sesion = {
    uid: "45004948",
    rol: "profesor",
    seccion: null,
    equipoId: null,
    debeCambiarPassword: true,
  };

  test("«Crea tu contraseña» pide sesión de cualquier rol", () => {
    expect(accesoDeRuta(RUTA_CREAR_PASSWORD)).toBe("sesion");
    expect(redireccion(RUTA_CREAR_PASSWORD, null)).toBe("/ingresar");
    expect(redireccion(RUTA_CREAR_PASSWORD, temporalEst)).toBeNull();
    expect(redireccion(RUTA_CREAR_PASSWORD, temporalProfe)).toBeNull();
  });

  test("con la temporal, ninguna ruta de su rol (ni Ingresar) carga", () => {
    for (const ruta of ["/", "/notas", "/perfil", "/profe", "/ingresar"])
      expect(redireccion(ruta, temporalEst)).toBe(RUTA_CREAR_PASSWORD);
    for (const ruta of ["/profe", "/profe/profesores", "/profe/perfil"])
      expect(redireccion(ruta, temporalProfe)).toBe(RUTA_CREAR_PASSWORD);
    // Lo público y Salir siguen abiertos
    expect(redireccion("/salir", temporalProfe)).toBeNull();
    expect(redireccion("/recuperar/nueva", temporalProfe)).toBeNull();
  });

  test("sin la marca, «Crea tu contraseña» lleva a su inicio", () => {
    expect(redireccion(RUTA_CREAR_PASSWORD, est)).toBe("/");
    expect(redireccion(RUTA_CREAR_PASSWORD, profe)).toBe("/profe");
  });

  test("destino tras ingresar", () => {
    expect(destinoDe(temporalEst)).toBe(RUTA_CREAR_PASSWORD);
    expect(destinoDe(profe)).toBe("/profe");
  });

  test("claims → marcas; admin solo en un profesor", () => {
    expect(
      sesionDeClaims("45001237", { rol: "profesor", admin: true }),
    ).toEqual({ ...profe, uid: "45001237", admin: true });
    expect(
      sesionDeClaims("45009896", {
        rol: "estudiante",
        seccion: "5A",
        admin: true,
      })?.admin,
    ).toBeUndefined();
    expect(
      sesionDeClaims("45001237", { rol: "profesor", admin: "true" })?.admin,
    ).toBeUndefined();
    expect(
      sesionDeClaims("45004948", {
        rol: "profesor",
        debeCambiarPassword: true,
      })?.debeCambiarPassword,
    ).toBe(true);
  });
});

const est: Sesion = {
  uid: "45009896",
  rol: "estudiante",
  seccion: "5A",
  equipoId: "5a-g2",
};
const profe: Sesion = {
  uid: "10000000",
  rol: "profesor",
  seccion: null,
  equipoId: null,
};

describe("accesoDeRuta", () => {
  test.each([
    ["/", "estudiante"],
    ["/notas", "estudiante"],
    ["/notas/identidad-de-marca", "estudiante"],
    ["/ranking/equipos", "estudiante"],
    ["/tareas/x", "estudiante"],
    ["/profe", "profesor"],
    ["/profe/evaluar/a/b", "profesor"],
    ["/ingresar", "invitado"],
    ["/recuperar", "invitado"],
    ["/recuperar/nueva", null],
    ["/salir", null],
    ["/secciones", null],
    ["/estados", null],
    ["/notasx", null],
    ["/profesor", null],
  ] as const)("%s → %s", (ruta, acceso) => {
    expect(accesoDeRuta(ruta)).toBe(acceso);
  });
});

describe("redireccion", () => {
  test("sin sesión: lo protegido va a /ingresar; lo público y el login pasan", () => {
    expect(redireccion("/", null)).toBe("/ingresar");
    expect(redireccion("/profe/alumnos", null)).toBe("/ingresar");
    expect(redireccion("/ingresar", null)).toBeNull();
    expect(redireccion("/estados", null)).toBeNull();
  });
  test("rol equivocado va a su inicio", () => {
    expect(redireccion("/profe", est)).toBe("/");
    expect(redireccion("/notas", profe)).toBe("/profe");
  });
  test("su rol pasa; con sesión, Ingresar y Recuperar llevan a su inicio", () => {
    expect(redireccion("/notas", est)).toBeNull();
    expect(redireccion("/profe/tareas", profe)).toBeNull();
    expect(redireccion("/ingresar", est)).toBe("/");
    expect(redireccion("/recuperar", profe)).toBe("/profe");
    expect(redireccion("/salir", est)).toBeNull();
  });
  test("inicioDe", () => {
    expect(inicioDe("estudiante")).toBe("/");
    expect(inicioDe("profesor")).toBe("/profe");
  });
});

describe("sesionDeClaims", () => {
  test("claims válidos", () => {
    expect(
      sesionDeClaims("45009896", {
        rol: "estudiante",
        seccion: "5A",
        equipoId: "5a-g2",
      }),
    ).toEqual(est);
    expect(sesionDeClaims("10000000", { rol: "profesor" })).toEqual(profe);
  });
  test("sin rol, rol desconocido, estudiante sin sección o uid que no es cédula → null", () => {
    expect(sesionDeClaims("45009896", {})).toBeNull();
    expect(sesionDeClaims("45009896", { rol: "admin" })).toBeNull();
    expect(sesionDeClaims("45009896", { rol: "estudiante" })).toBeNull();
    expect(sesionDeClaims("abc", { rol: "profesor" })).toBeNull();
  });
  test("la sección es cualquier código año + letra del catálogo (D317); lo demás no", () => {
    expect(
      sesionDeClaims("45009896", { rol: "estudiante", seccion: "4B" })?.seccion,
    ).toBe("4B");
    expect(
      sesionDeClaims("10000000", { rol: "profesor", seccion: "1A" })?.seccion,
    ).toBe("1A");
    for (const mala of ["5a", "0A", "AA", "5", 5]) {
      expect(
        sesionDeClaims("45009896", { rol: "estudiante", seccion: mala }),
      ).toBeNull();
      expect(
        sesionDeClaims("10000000", { rol: "profesor", seccion: mala })?.seccion,
      ).toBeNull();
    }
  });
  test("equipoId vacío o raro → null", () => {
    expect(
      sesionDeClaims("45009896", {
        rol: "estudiante",
        seccion: "5C",
        equipoId: "",
      })?.equipoId,
    ).toBeNull();
    expect(
      sesionDeClaims("45009896", {
        rol: "estudiante",
        seccion: "5C",
        equipoId: 3,
      })?.equipoId,
    ).toBeNull();
  });
});

describe("errores de ingreso", () => {
  test("estados de Better Auth → error sin revelar el campo", () => {
    expect(errorIngresoDeEstado(401)).toBe("credenciales");
    expect(errorIngresoDeEstado(400)).toBe("credenciales");
    expect(errorIngresoDeEstado(403)).toBe("credenciales");
    expect(errorIngresoDeEstado(429)).toBe("bloqueado");
    expect(errorIngresoDeEstado(undefined)).toBe("red");
    expect(errorIngresoDeEstado(0)).toBe("red");
    expect(errorIngresoDeEstado(503)).toBe("no-disponible");
  });
});
