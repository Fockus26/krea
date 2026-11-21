// Ingreso con límite de fallos por cuenta (D327, F-A1 del QA v2: D491, D492). Lo usa
// `app/api/auth/[...all]/route.ts` delante de Better Auth. Sin `server-only` para que las pruebas
// lo usen.
import {
  devolverIntento,
  limpiarFallos,
  reservarIntento,
} from "@/lib/data/intentos";
import type { Db } from "@/lib/db";

/**
 * Lo que `/sign-in/email` de Better Auth acepta (`allowedMediaTypes` en
 * `better-auth/dist/api/routes/sign-in.mjs`). Cualquier otro tipo se rechaza aquí, antes de
 * evaluar nada, aunque Better Auth empiece a aceptarlo en otra versión (D491).
 */
const TIPOS_INGRESO = [
  "application/json",
  "application/x-www-form-urlencoded",
] as const;

export type LecturaIngreso = { email: string } | { status: 400 | 415 };

/**
 * El email del cuerpo, leído igual que lo lee Better Auth (better-call `getBody`): JSON, o
 * formulario urlencoded con el último valor si el campo viene repetido. Lee una copia: el cuerpo
 * original queda para Better Auth.
 */
export async function emailDelIngreso(req: Request): Promise<LecturaIngreso> {
  const tipo = (req.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!(TIPOS_INGRESO as readonly string[]).includes(tipo))
    return { status: 415 };
  let valor: unknown;
  try {
    if (tipo === "application/json") {
      const cuerpo: unknown = await req.clone().json();
      valor =
        cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo)
          ? (cuerpo as Record<string, unknown>).email
          : undefined;
    } else {
      valor = (await req.clone().formData()).getAll("email").at(-1);
    }
  } catch {
    return { status: 400 };
  }
  return typeof valor === "string" && valor.trim()
    ? { email: valor }
    : { status: 400 };
}

const respuesta = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

/**
 * Pasa el ingreso a `evaluar` (Better Auth) solo si la cuenta tiene intentos: el intento se
 * reserva antes (atómico) y se devuelve si la respuesta no fue «contraseña equivocada» (401).
 * Sin email legible no se evalúa nada.
 */
export async function ingresarConLimite(
  db: Db,
  req: Request,
  evaluar: (req: Request) => Promise<Response>,
  ahora: () => number = Date.now,
): Promise<Response> {
  const lectura = await emailDelIngreso(req);
  if ("status" in lectura)
    return lectura.status === 415
      ? respuesta(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "Tipo de contenido no admitido",
        )
      : respuesta(400, "BAD_REQUEST", "Falta el email");
  const { email } = lectura;
  if (!(await reservarIntento(db, email, ahora())))
    return respuesta(429, "TOO_MANY_REQUESTS", "Demasiados intentos");
  let res: Response;
  try {
    res = await evaluar(req);
  } catch (e) {
    await devolverIntento(db, email);
    throw e;
  }
  if (res.ok) await limpiarFallos(db, email);
  else if (res.status !== 401) await devolverIntento(db, email);
  return res;
}
