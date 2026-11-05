// Verificación de una contraseña en el servidor (D192) con la REST de Identity Toolkit: el Admin
// SDK no comprueba contraseñas. Pura salvo `fetch`, que llega inyectado (pruebas sin red).
export type ErrorPassword = "credenciales" | "bloqueado" | "red";

export type ResultadoPassword =
  | { ok: true; idToken: string }
  | { ok: false; error: ErrorPassword };

/** URL de `accounts:signInWithPassword`, la real o la del emulador de Auth. */
export function urlSignIn(apiKey: string, emuladorHost?: string): string {
  const ruta = `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
  return emuladorHost ? `http://${emuladorHost}/${ruta}` : `https://${ruta}`;
}

/** Mensaje de error de la REST (`TOO_MANY_ATTEMPTS_TRY_LATER : …`) → error de la app. */
export function errorPasswordDe(mensaje: string | undefined): ErrorPassword {
  return mensaje?.startsWith("TOO_MANY_ATTEMPTS")
    ? "bloqueado"
    : "credenciales";
}

/** Entorno → clave y emulador. Con emulador sin clave pública, la del proyecto demo. */
export function destinoPassword(
  env: Partial<Record<string, string | undefined>>,
): { apiKey: string; emuladorHost?: string } | null {
  const emuladorHost = env.FIREBASE_AUTH_EMULATOR_HOST || undefined;
  const apiKey =
    env.NEXT_PUBLIC_FIREBASE_API_KEY || (emuladorHost ? "demo-api-key" : "");
  if (!apiKey) return null;
  return { apiKey, emuladorHost };
}

/** Comprueba `email` + `password`; con éxito devuelve un idToken recién emitido. */
export async function verificarPassword(
  email: string,
  password: string,
  destino: { apiKey: string; emuladorHost?: string },
  pedir: typeof fetch = fetch,
): Promise<ResultadoPassword> {
  let res: Response;
  try {
    res = await pedir(urlSignIn(destino.apiKey, destino.emuladorHost), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "red" };
  }
  const cuerpo = (await res.json().catch(() => null)) as {
    idToken?: string;
    error?: { message?: string };
  } | null;
  if (res.ok && cuerpo?.idToken) return { ok: true, idToken: cuerpo.idToken };
  if (res.status >= 500) return { ok: false, error: "red" };
  return { ok: false, error: errorPasswordDe(cuerpo?.error?.message) };
}
