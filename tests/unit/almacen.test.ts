import { describe, expect, test } from "bun:test";
import {
  claveLogo,
  esJpeg,
  esPng,
  esWebp,
  IMAGEN_SUBIDA_MAX_BYTES,
  LOGO_SUBIDA_MAX_BYTES,
  validarImagenSubida,
  validarLogoSubido,
} from "@/lib/almacen/imagen";
import {
  type ConfigS3,
  codigoS3,
  configB2,
  crearAlmacen,
  esClaveValida,
  URL_FIRMADA_SEGUNDOS,
  urlObjeto,
} from "@/lib/almacen/s3";

// Valores de prueba: nunca las credenciales reales (y B2 está bloqueado en el contenedor)
const CONFIG: ConfigS3 = {
  keyId: "005prueba0000000000000001",
  appKey: "K005clave-de-prueba",
  bucket: "krea-prueba",
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  region: "us-east-005",
};

/** Doble de `fetch`: guarda la petición (y el `init` tal cual) y responde con `status`. */
function fetchDoble(status = 200, cuerpo: string | null = null) {
  const llamadas: Request[] = [];
  const inits: Array<RequestInit | undefined> = [];
  const f = (async (entrada: Request | string, init?: RequestInit) => {
    llamadas.push(new Request(entrada, init));
    inits.push(init);
    return new Response(cuerpo, { status });
  }) as unknown as typeof fetch;
  return { f, llamadas, inits };
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe("configB2", () => {
  test("las cinco variables o nada", () => {
    const env = {
      B2_KEY_ID: CONFIG.keyId,
      B2_APPLICATION_KEY: CONFIG.appKey,
      B2_BUCKET_NAME: CONFIG.bucket,
      B2_ENDPOINT: `${CONFIG.endpoint}/`,
      B2_REGION: CONFIG.region,
    };
    expect(configB2(env)).toEqual(CONFIG);
    expect(configB2({ ...env, B2_APPLICATION_KEY: " " })).toBeNull();
    expect(configB2({ ...env, B2_ENDPOINT: "http://inseguro" })).toBeNull();
    expect(configB2({})).toBeNull();
  });
});

describe("claves y URLs", () => {
  test("solo segmentos seguros", () => {
    expect(esClaveValida("entregas/t1/abc/x.jpg")).toBe(true);
    expect(esClaveValida("entregas/../x.jpg")).toBe(false);
    expect(esClaveValida("/x.jpg")).toBe(false);
    expect(esClaveValida("a b.jpg")).toBe(false);
    expect(esClaveValida("")).toBe(false);
    expect(() => urlObjeto(CONFIG, "../x")).toThrow();
  });

  test("estilo ruta: endpoint/bucket/clave", () => {
    expect(urlObjeto(CONFIG, "logos/5a-g2/x.jpg")).toBe(
      "https://s3.us-east-005.backblazeb2.com/krea-prueba/logos/5a-g2/x.jpg",
    );
  });
});

describe("crearAlmacen (dobles, sin red)", () => {
  test("subir: PUT firmado SigV4 con el hash real del cuerpo", async () => {
    const { f, llamadas } = fetchDoble();
    const r = await crearAlmacen(CONFIG, { fetch: f }).subir(
      "entregas/t1/abc/x.jpg",
      JPEG,
      "image/jpeg",
    );
    expect(r).toEqual({ ok: true });
    const req = llamadas[0];
    if (!req) throw new Error("sin llamada");
    expect(req.method).toBe("PUT");
    expect(req.url).toBe(urlObjeto(CONFIG, "entregas/t1/abc/x.jpg"));
    expect(req.headers.get("content-type")).toBe("image/jpeg");
    const auth = req.headers.get("authorization") ?? "";
    expect(auth).toStartWith(`AWS4-HMAC-SHA256 Credential=${CONFIG.keyId}/`);
    expect(auth).toContain("/us-east-005/s3/aws4_request");
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(JPEG)),
    );
    const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    expect(req.headers.get("x-amz-content-sha256")).toBe(hex);
    expect(new Uint8Array(await req.arrayBuffer())).toEqual(JPEG);
    // La clave secreta nunca viaja
    expect(auth).not.toContain(CONFIG.appKey);
  });

  test("subir: cuerpo en bytes con Content-Length, no un Request en bloques (B2 da 411, D372)", async () => {
    const { f, inits } = fetchDoble();
    await crearAlmacen(CONFIG, { fetch: f }).subir(
      "entregas/t1/abc/x.jpg",
      JPEG,
      "image/jpeg",
    );
    const init = inits[0];
    if (!init) throw new Error("sin init: se pasó un Request");
    expect(init.body).toBeInstanceOf(Uint8Array);
    expect(new Headers(init.headers).get("content-length")).toBe(
      String(JPEG.byteLength),
    );
  });

  test("codigoS3: lee el <Code> del error, o «-»", async () => {
    const xml =
      "<?xml version='1.0'?><Error><Code>InvalidAccessKeyId</Code><Message>Malformed</Message></Error>";
    expect(await codigoS3(new Response(xml, { status: 403 }))).toBe(
      "InvalidAccessKeyId",
    );
    expect(await codigoS3(new Response(null, { status: 403 }))).toBe("-");
  });

  test("subir: rechazo y fallo de red como códigos", async () => {
    const { f } = fetchDoble(403);
    expect(
      await crearAlmacen(CONFIG, { fetch: f }).subir(
        "a/b.jpg",
        JPEG,
        "image/jpeg",
      ),
    ).toEqual({ ok: false, error: "rechazado" });
    const caida = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect(
      await crearAlmacen(CONFIG, { fetch: caida }).subir(
        "a/b.jpg",
        JPEG,
        "image/jpeg",
      ),
    ).toEqual({ ok: false, error: "red" });
  });

  test("existe: HEAD firmado; 200 sí, 404 no, otro estado o sin red → error (F-B3, D229)", async () => {
    const { f, llamadas } = fetchDoble(200);
    expect(
      await crearAlmacen(CONFIG, { fetch: f }).existe("entregas/t1/abc/x.jpg"),
    ).toEqual({ ok: true, existe: true });
    expect(llamadas[0]?.method).toBe("HEAD");
    expect(llamadas[0]?.url).toBe(urlObjeto(CONFIG, "entregas/t1/abc/x.jpg"));
    expect(
      await crearAlmacen(CONFIG, { fetch: fetchDoble(404).f }).existe(
        "a/b.jpg",
      ),
    ).toEqual({ ok: true, existe: false });
    expect(
      await crearAlmacen(CONFIG, { fetch: fetchDoble(403).f }).existe(
        "a/b.jpg",
      ),
    ).toEqual({ ok: false, error: "rechazado" });
    const caida = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect(
      await crearAlmacen(CONFIG, { fetch: caida }).existe("a/b.jpg"),
    ).toEqual({ ok: false, error: "red" });
  });

  test("urlFirmada: GET por query, 5 min por defecto, sin llamar a la red", async () => {
    const { f, llamadas } = fetchDoble();
    const almacen = crearAlmacen(CONFIG, { fetch: f });
    const u = new URL(await almacen.urlFirmada("entregas/t1/abc/x.jpg"));
    expect(llamadas).toHaveLength(0);
    expect(`${u.origin}${u.pathname}`).toBe(
      urlObjeto(CONFIG, "entregas/t1/abc/x.jpg"),
    );
    expect(u.searchParams.get("X-Amz-Expires")).toBe(
      String(URL_FIRMADA_SEGUNDOS),
    );
    expect(u.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(u.searchParams.get("X-Amz-Credential")).toStartWith(
      `${CONFIG.keyId}/`,
    );
    expect(u.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(u.toString()).not.toContain(CONFIG.appKey);
    const corta = new URL(await almacen.urlFirmada("a/b.jpg", 60));
    expect(corta.searchParams.get("X-Amz-Expires")).toBe("60");
  });

  test("borrar: DELETE firmado", async () => {
    const { f, llamadas } = fetchDoble(204);
    expect(
      await crearAlmacen(CONFIG, { fetch: f }).borrar("logos/5a-g2/x.jpg"),
    ).toEqual({ ok: true });
    expect(llamadas[0]?.method).toBe("DELETE");
  });
});

describe("validarImagenSubida (D195)", () => {
  test("JPEG por la firma de los bytes, no por el tipo declarado", () => {
    expect(esJpeg(JPEG)).toBe(true);
    expect(esJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(validarImagenSubida(JPEG)).toEqual({ ok: true });
    expect(validarImagenSubida(new Uint8Array())).toEqual({
      ok: false,
      error: "vacia",
    });
    expect(validarImagenSubida(new Uint8Array([0x89, 0x50, 0x4e]))).toEqual({
      ok: false,
      error: "tipo",
    });
    const grande = new Uint8Array(IMAGEN_SUBIDA_MAX_BYTES + 1);
    grande.set(JPEG);
    expect(validarImagenSubida(grande)).toEqual({ ok: false, error: "peso" });
  });
});

describe("logo de equipo (D212)", () => {
  const webp = new Uint8Array([
    ...new TextEncoder().encode("RIFF"),
    0x10,
    0,
    0,
    0,
    ...new TextEncoder().encode("WEBPVP8 "),
  ]);
  const png = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
  ]);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

  test("tipo por la firma de los bytes: WebP y PNG sí, JPEG no", () => {
    expect(esWebp(webp)).toBe(true);
    expect(esPng(png)).toBe(true);
    expect(validarLogoSubido(webp)).toEqual({
      ok: true,
      tipo: "image/webp",
      extension: "webp",
    });
    expect(validarLogoSubido(png)).toMatchObject({
      ok: true,
      extension: "png",
    });
    expect(validarLogoSubido(jpeg)).toEqual({ ok: false, error: "tipo" });
  });

  test("vacío y peso máximo", () => {
    expect(validarLogoSubido(new Uint8Array())).toEqual({
      ok: false,
      error: "vacia",
    });
    const grande = new Uint8Array(LOGO_SUBIDA_MAX_BYTES + 1);
    grande.set(webp);
    expect(validarLogoSubido(grande)).toEqual({ ok: false, error: "peso" });
  });

  test("clave equipos/{equipoId}/{uuid}.webp, válida para B2", () => {
    const clave = claveLogo("5a-g2", "0b1c", "webp");
    expect(clave).toBe("equipos/5a-g2/0b1c.webp");
    expect(esClaveValida(clave)).toBe(true);
  });
});
