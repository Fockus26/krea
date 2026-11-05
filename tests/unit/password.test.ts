import { describe, expect, test } from "bun:test";
import {
  destinoPassword,
  errorPasswordDe,
  urlSignIn,
  verificarPassword,
} from "@/lib/firebase/password";
import {
  ERROR_CAMBIO_PASSWORD,
  zAvatarElegido,
  zCambioPassword,
} from "@/lib/perfil";

const respuesta = (status: number, cuerpo: unknown) =>
  (async () =>
    new Response(JSON.stringify(cuerpo), {
      status,
    })) as unknown as typeof fetch;

const destino = { apiKey: "clave" };

describe("verificarPassword (D192)", () => {
  test("URL real y del emulador", () => {
    expect(urlSignIn("k")).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=k",
    );
    expect(urlSignIn("k", "127.0.0.1:9099")).toBe(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=k",
    );
  });

  test("entorno: emulador sin clave usa la demo; sin nada, null", () => {
    expect(
      destinoPassword({ FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" }),
    ).toEqual({
      apiKey: "demo-api-key",
      emuladorHost: "127.0.0.1:9099",
    });
    expect(destinoPassword({ NEXT_PUBLIC_FIREBASE_API_KEY: "k" })).toEqual({
      apiKey: "k",
      emuladorHost: undefined,
    });
    expect(destinoPassword({})).toBeNull();
  });

  test("ok devuelve el idToken; manda email y contraseña por POST", async () => {
    let cuerpo = "";
    const pedir = (async (_url: string, init: RequestInit) => {
      cuerpo = String(init.body);
      return new Response(JSON.stringify({ idToken: "tok" }), { status: 200 });
    }) as unknown as typeof fetch;
    expect(
      await verificarPassword("a@b.c", "secreta1", destino, pedir),
    ).toEqual({
      ok: true,
      idToken: "tok",
    });
    expect(JSON.parse(cuerpo)).toEqual({
      email: "a@b.c",
      password: "secreta1",
      returnSecureToken: true,
    });
  });

  test("errores: credenciales, bloqueo, servidor y red", async () => {
    expect(
      await verificarPassword(
        "a@b.c",
        "x",
        destino,
        respuesta(400, { error: { message: "INVALID_LOGIN_CREDENTIALS" } }),
      ),
    ).toEqual({ ok: false, error: "credenciales" });
    expect(
      errorPasswordDe("TOO_MANY_ATTEMPTS_TRY_LATER : Access disabled"),
    ).toBe("bloqueado");
    expect(
      await verificarPassword("a@b.c", "x", destino, respuesta(503, {})),
    ).toEqual({ ok: false, error: "red" });
    const caida = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect(await verificarPassword("a@b.c", "x", destino, caida)).toEqual({
      ok: false,
      error: "red",
    });
  });
});

describe("validación de Perfil (D191, D192)", () => {
  const ced = "33272397";
  test("avatar: uno de los 4 estilos y una semilla que ofrece Perfil", () => {
    const z = zAvatarElegido(ced);
    expect(z.safeParse({ estilo: "fun-emoji", semilla: ced }).success).toBe(
      true,
    );
    expect(
      z.safeParse({ estilo: "bottts-neutral", semilla: `${ced}-3-7` }).success,
    ).toBe(true);
    expect(z.safeParse({ estilo: "pixel-art", semilla: ced }).success).toBe(
      false,
    );
    expect(z.safeParse({ estilo: "fun-emoji", semilla: "otra" }).success).toBe(
      false,
    );
    expect(
      z.safeParse({ estilo: "fun-emoji", semilla: `${ced}-1-8` }).success,
    ).toBe(false);
    expect(
      z.safeParse({ estilo: "fun-emoji", semilla: "12345678" }).success,
    ).toBe(false);
  });

  test("contraseña: actual no vacía y nueva con el mínimo", () => {
    expect(
      zCambioPassword.safeParse({ actual: "a", nueva: "12345678" }).success,
    ).toBe(true);
    expect(
      zCambioPassword.safeParse({ actual: "", nueva: "12345678" }).success,
    ).toBe(false);
    expect(
      zCambioPassword.safeParse({ actual: "a", nueva: "1234567" }).success,
    ).toBe(false);
    expect(ERROR_CAMBIO_PASSWORD.actual).toBe(
      "La contraseña actual no coincide.",
    );
  });
});
