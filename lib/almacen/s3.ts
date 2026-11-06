// Almacén de archivos en Backblaze B2 por su API compatible con S3 (D194). Firma con
// `aws4fetch` (SigV4) y envía con el `fetch` inyectado: las pruebas usan un doble y nunca
// llaman a B2. Sin `server-only` para poder probarlo; el enlace con el entorno está en
// `lib/almacen/b2.ts` (ese sí es solo servidor). Nunca registra claves ni URLs firmadas.
import { AwsClient } from "aws4fetch";

export type ConfigS3 = {
  keyId: string;
  appKey: string;
  bucket: string;
  /** `https://s3.us-east-005.backblazeb2.com` (sin barra final). */
  endpoint: string;
  region: string;
};

/** Entorno → configuración; falta cualquiera de las cinco variables → `null` (sin almacén). */
export function configB2(
  env: Partial<Record<string, string | undefined>>,
): ConfigS3 | null {
  const keyId = env.B2_KEY_ID?.trim();
  const appKey = env.B2_APPLICATION_KEY?.trim();
  const bucket = env.B2_BUCKET_NAME?.trim();
  const endpoint = env.B2_ENDPOINT?.trim().replace(/\/+$/, "");
  const region = env.B2_REGION?.trim();
  if (!keyId || !appKey || !bucket || !endpoint || !region) return null;
  if (!endpoint.startsWith("https://")) return null;
  return { keyId, appKey, bucket, endpoint, region };
}

export type DepsS3 = { fetch: typeof fetch };

export type ErrorAlmacen = "red" | "rechazado";
export type ResultadoAlmacen =
  | { ok: true }
  | { ok: false; error: ErrorAlmacen };
export type ResultadoExiste =
  | { ok: true; existe: boolean }
  | { ok: false; error: ErrorAlmacen };

/** Vida de las URLs firmadas de lectura: 5 minutos (la imagen se pide al pintar la página). */
export const URL_FIRMADA_SEGUNDOS = 300;

/** Clave de objeto segura: segmentos `[A-Za-z0-9._-]`, sin `..` ni barras sueltas. */
export function esClaveValida(clave: string): boolean {
  if (clave.length === 0 || clave.length > 512) return false;
  return clave
    .split("/")
    .every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "." && s !== "..");
}

/** URL de estilo ruta: `{endpoint}/{bucket}/{clave}`. */
export function urlObjeto(config: ConfigS3, clave: string): string {
  if (!esClaveValida(clave)) throw new RangeError("Clave de objeto inválida");
  const ruta = clave.split("/").map(encodeURIComponent).join("/");
  return `${config.endpoint}/${encodeURIComponent(config.bucket)}/${ruta}`;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copia = new Uint8Array(bytes);
  const hash = await crypto.subtle.digest("SHA-256", copia);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export type Almacen = {
  /** Sube (o reemplaza) un objeto privado. */
  subir: (
    clave: string,
    cuerpo: Uint8Array,
    tipo: string,
  ) => Promise<ResultadoAlmacen>;
  /** URL GET firmada de vida corta; no hace ninguna llamada de red. */
  urlFirmada: (clave: string, segundos?: number) => Promise<string>;
  borrar: (clave: string) => Promise<ResultadoAlmacen>;
  /** ¿Existe el objeto? (HEAD firmado: 200 sí, 404 no; otro estado o sin red → error, D229). */
  existe: (clave: string) => Promise<ResultadoExiste>;
};

export function crearAlmacen(config: ConfigS3, deps: DepsS3): Almacen {
  const cliente = new AwsClient({
    accessKeyId: config.keyId,
    secretAccessKey: config.appKey,
    service: "s3",
    region: config.region,
    retries: 0,
  });

  async function enviar(req: Request): Promise<ResultadoAlmacen> {
    try {
      const res = await deps.fetch(req);
      if (res.ok) return { ok: true };
      console.error("[almacen] respuesta", res.status);
      return { ok: false, error: "rechazado" };
    } catch {
      console.error("[almacen] sin conexión");
      return { ok: false, error: "red" };
    }
  }

  return {
    async subir(clave, cuerpo, tipo) {
      // Hash real del cuerpo (no UNSIGNED-PAYLOAD): lo aceptan B2 y cualquier S3
      const req = await cliente.sign(urlObjeto(config, clave), {
        method: "PUT",
        body: new Uint8Array(cuerpo),
        headers: {
          "Content-Type": tipo,
          "X-Amz-Content-Sha256": await sha256Hex(cuerpo),
        },
      });
      return enviar(req);
    },
    async urlFirmada(clave, segundos = URL_FIRMADA_SEGUNDOS) {
      const url = new URL(urlObjeto(config, clave));
      url.searchParams.set(
        "X-Amz-Expires",
        String(Math.max(1, Math.min(604_800, Math.round(segundos)))),
      );
      const req = await cliente.sign(url.toString(), {
        method: "GET",
        aws: { signQuery: true },
      });
      return req.url;
    },
    async existe(clave) {
      const req = await cliente.sign(urlObjeto(config, clave), {
        method: "HEAD",
      });
      try {
        const res = await deps.fetch(req);
        if (res.ok) return { ok: true, existe: true };
        if (res.status === 404) return { ok: true, existe: false };
        console.error("[almacen] respuesta", res.status);
        return { ok: false, error: "rechazado" };
      } catch {
        console.error("[almacen] sin conexión");
        return { ok: false, error: "red" };
      }
    },
    async borrar(clave) {
      const req = await cliente.sign(urlObjeto(config, clave), {
        method: "DELETE",
      });
      return enviar(req);
    },
  };
}
