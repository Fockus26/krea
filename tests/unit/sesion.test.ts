import { describe, expect, test } from "bun:test";
import { errorIngresoDeCodigo } from "@/lib/auth";
import {
  accesoDeRuta,
  inicioDe,
  LOGIN_RECIENTE_MS,
  loginReciente,
  redireccion,
  type Sesion,
  sesionDeClaims,
} from "@/lib/sesion";

const est: Sesion = {
  uid: "33272397",
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
      sesionDeClaims("33272397", {
        rol: "estudiante",
        seccion: "5A",
        equipoId: "5a-g2",
      }),
    ).toEqual(est);
    expect(sesionDeClaims("10000000", { rol: "profesor" })).toEqual(profe);
  });
  test("sin rol, rol desconocido, estudiante sin sección o uid que no es cédula → null", () => {
    expect(sesionDeClaims("33272397", {})).toBeNull();
    expect(sesionDeClaims("33272397", { rol: "admin" })).toBeNull();
    expect(sesionDeClaims("33272397", { rol: "estudiante" })).toBeNull();
    expect(sesionDeClaims("abc", { rol: "profesor" })).toBeNull();
  });
  test("equipoId vacío o raro → null", () => {
    expect(
      sesionDeClaims("33272397", {
        rol: "estudiante",
        seccion: "5C",
        equipoId: "",
      })?.equipoId,
    ).toBeNull();
    expect(
      sesionDeClaims("33272397", {
        rol: "estudiante",
        seccion: "5C",
        equipoId: 3,
      })?.equipoId,
    ).toBeNull();
  });
});

describe("loginReciente y errores", () => {
  test("ventana de 5 minutos", () => {
    const ahora = 1_000_000_000_000;
    expect(loginReciente(ahora / 1000 - 60, ahora)).toBe(true);
    expect(loginReciente((ahora - LOGIN_RECIENTE_MS) / 1000, ahora)).toBe(
      false,
    );
  });
  test("códigos de Firebase → error sin revelar el campo", () => {
    expect(errorIngresoDeCodigo("auth/invalid-credential")).toBe(
      "credenciales",
    );
    expect(errorIngresoDeCodigo("auth/user-not-found")).toBe("credenciales");
    expect(errorIngresoDeCodigo("auth/wrong-password")).toBe("credenciales");
    expect(errorIngresoDeCodigo("auth/too-many-requests")).toBe("bloqueado");
    expect(errorIngresoDeCodigo("auth/network-request-failed")).toBe("red");
    expect(errorIngresoDeCodigo("auth/invalid-api-key")).toBe("no-disponible");
    expect(errorIngresoDeCodigo(undefined)).toBe("credenciales");
  });
});
