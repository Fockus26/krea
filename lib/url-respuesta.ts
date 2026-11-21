/**
 * Respuesta de enlace (D468, D469): la regla única que aplican el servidor (`respuestasValidas`,
 * la entrega de una parte) y el cliente (aviso en línea, y antes de pintar un `href`). Pura: sin
 * DOM ni red; `URL` es global en Node, Bun y el navegador.
 */

/** Etiqueta del formato `url` (selector del profe y badge del alumno). PROVISIONAL (fila 271) */
export const ENLACE_FORMATO = "Enlace";

/** Tope de la URL guardada (también el `maxLength` del campo). */
export const URL_MAX_LENGTH = 2000;

export type ErrorUrl =
  | "vacia"
  | "larga"
  | "invalida"
  | "protocolo"
  | "credenciales";

export type UrlNormalizada =
  | {
      ok: true;
      /** La URL como se guarda y se enlaza (`URL.href`: esquema y dominio en minúsculas). */
      url: string;
      /** Se pegó sin esquema (`drive.google.com/…`) y se le puso `https://`. */
      conEsquema: boolean;
    }
  | { ok: false; error: ErrorUrl };

// `nombre:` al inicio: un esquema (`https:`, `javascript:`, `data:`…). Con punto no es esquema sino
// un dominio con puerto (`localhost.test:3000`, `drive.google.com:443/…`).
const ESQUEMA = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Texto pegado por el alumno → URL `http:`/`https:` válida, o por qué no. Recorta espacios en los
 * extremos; rechaza espacios dentro, más de `URL_MAX_LENGTH` caracteres, otros protocolos
 * (`javascript:`, `data:`, `mailto:`…), credenciales (`usuario:clave@`) y dominios sin punto.
 * Sin esquema se le pone `https://` (y lo dice `conEsquema`).
 */
export function normalizarUrl(entrada: string): UrlNormalizada {
  const t = entrada.trim();
  if (t === "") return { ok: false, error: "vacia" };
  if (t.length > URL_MAX_LENGTH) return { ok: false, error: "larga" };
  if (/\s/.test(t)) return { ok: false, error: "invalida" };

  const esquema = ESQUEMA.exec(t)?.[1];
  const conEsquema = esquema === undefined || esquema.includes(".");
  if (!conEsquema && !/^https?$/i.test(esquema ?? ""))
    return { ok: false, error: "protocolo" };
  // Sin esquema, una `//` inicial (`//drive.google.com/…`) es del dominio, no de la ruta
  const cruda = conEsquema ? `https://${t.replace(/^\/\//, "")}` : t;

  let u: URL;
  try {
    u = new URL(cruda);
  } catch {
    return { ok: false, error: "invalida" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:")
    return { ok: false, error: "protocolo" };
  if (u.username !== "" || u.password !== "")
    return { ok: false, error: "credenciales" };
  // «hola» → `https://hola/`: válida para `URL`, pero no es un enlace de verdad
  const host = u.hostname;
  if (!host.includes(".") || host.startsWith(".") || host.endsWith("."))
    return { ok: false, error: "invalida" };
  if (u.href.length > URL_MAX_LENGTH) return { ok: false, error: "larga" };
  return { ok: true, url: u.href, conEsquema };
}

/**
 * `href` seguro para pintar una respuesta guardada: la URL normalizada, o `null` si no pasa la
 * regla (entonces se muestra como texto plano; nunca un `javascript:`).
 */
export function hrefSeguro(url: string): string | null {
  const r = normalizarUrl(url);
  return r.ok ? r.url : null;
}

/**
 * Aviso en línea del campo (D469). PROVISIONAL (CONTENT_CHECKLIST fila 272).
 * `vacia` no tiene aviso: la pregunta solo cuenta como sin responder.
 */
export function mensajeErrorUrl(error: ErrorUrl): string | null {
  switch (error) {
    case "vacia":
      return null;
    case "larga":
      return "El enlace es muy largo: máximo 2.000 caracteres.";
    case "credenciales":
      return "Quita el usuario y la contraseña del enlace.";
    case "invalida":
    case "protocolo":
      return "Pega un enlace que empiece por https://";
  }
}

/** Ayuda bajo el campo cuando se le puso `https://`. PROVISIONAL (CONTENT_CHECKLIST fila 273). */
export const urlConEsquemaTexto = (url: string) => `Se guardará como ${url}`;
