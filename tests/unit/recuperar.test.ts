import { describe, expect, test } from "bun:test";
import {
  type Correo,
  configBrevo,
  cuerpoBrevo,
  enviarCorreo,
  REMITENTE_NOMBRE,
  URL_BREVO,
} from "@/lib/correo/brevo";
import { COLORES_CORREO_POR_ACENTO } from "@/lib/correo/paleta";
import {
  ASUNTO_RESTABLECER,
  COLORES_CORREO,
  correoRestablecer,
  escaparHtml,
  primerNombre,
} from "@/lib/correo/restablecer";
import {
  type DepsRecuperacion,
  enlaceRestablecer,
  errorRestablecerDe,
  LIMITE_RECUPERAR,
  procesarRecuperacion,
  reservarEnvio,
  zPedidoEnlace,
  zRestablecer,
} from "@/lib/recuperar";

const config = { apiKey: "xkeysib-prueba", remitente: "krea@liceo.test" };
const correo: Correo = {
  para: { email: "alumno@correo.test", nombre: "Raquel" },
  asunto: "Asunto",
  html: "<p>Hola</p>",
  texto: "Hola",
};

describe("Brevo (D185)", () => {
  test("configuración: sin clave o sin remitente no hay envío", () => {
    expect(configBrevo({})).toBeNull();
    expect(configBrevo({ BREVO_API_KEY: "k" })).toBeNull();
    expect(configBrevo({ BREVO_SENDER_EMAIL: "a@b.c" })).toBeNull();
    expect(
      configBrevo({ BREVO_API_KEY: " k ", BREVO_SENDER_EMAIL: "a@b.c" }),
    ).toEqual({ apiKey: "k", remitente: "a@b.c" });
  });

  test("POST a la API transaccional con la cabecera api-key y el cuerpo esperado", async () => {
    let url = "";
    let init: RequestInit | undefined;
    const pedir = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return new Response('{"messageId":"x"}', { status: 201 });
    }) as unknown as typeof fetch;
    expect(await enviarCorreo(config, correo, pedir)).toEqual({ ok: true });
    expect(url).toBe(URL_BREVO);
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["api-key"]).toBe(
      config.apiKey,
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      sender: { name: REMITENTE_NOMBRE, email: config.remitente },
      to: [{ email: "alumno@correo.test", name: "Raquel" }],
      subject: "Asunto",
      htmlContent: "<p>Hola</p>",
      textContent: "Hola",
    });
  });

  test("sin nombre, el destinatario va sin `name`", () => {
    expect(
      cuerpoBrevo(config, { ...correo, para: { email: "a@b.c" } }).to,
    ).toEqual([{ email: "a@b.c" }]);
  });

  test("errores: red, 5xx y rechazo", async () => {
    const lanza = (async () => {
      throw new Error("bloqueado");
    }) as unknown as typeof fetch;
    const con = (status: number) =>
      (async () => new Response("{}", { status })) as unknown as typeof fetch;
    expect(await enviarCorreo(config, correo, lanza)).toEqual({
      ok: false,
      error: "red",
    });
    expect(await enviarCorreo(config, correo, con(503))).toEqual({
      ok: false,
      error: "red",
    });
    expect(await enviarCorreo(config, correo, con(401))).toEqual({
      ok: false,
      error: "rechazado",
    });
  });
});

describe("correo de restablecer (HANDOFF §5c)", () => {
  const enlace =
    "https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=ABC";

  test("asunto, saludo, cédula enmascarada y enlace en HTML y texto", () => {
    const c = correoRestablecer({
      nombre: "Raquel",
      cedula: "45009896",
      enlace,
    });
    expect(c.asunto).toBe(ASUNTO_RESTABLECER);
    expect(c.html).toContain("Hola, Raquel");
    expect(c.html).toContain("45•••896");
    expect(c.html).not.toContain("45009896");
    expect(c.html).toContain(escaparHtml(enlace));
    expect(c.html).toContain("Crear nueva contraseña");
    expect(c.texto).toContain("Hola, Raquel");
    expect(c.texto).toContain(enlace);
    expect(c.texto).not.toContain("45009896");
    // El pie no deja un placeholder literal mientras no haya correo del liceo.
    expect(c.html).not.toContain("[correo");
  });

  test("sin nombre: «Hola»; el nombre se escapa", () => {
    expect(
      correoRestablecer({ nombre: "", cedula: "45009896", enlace }).texto,
    ).toMatch(/^Hola\n/);
    const c = correoRestablecer({
      nombre: "<b>x</b>",
      cedula: "45009896",
      enlace,
    });
    expect(c.html).not.toContain("<b>x</b>");
    expect(c.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  test("primer nombre", () => {
    expect(primerNombre("  Raquel Andreína ")).toBe("Raquel");
    expect(primerNombre(null)).toBe("");
  });
});

describe("límite por cédula (D187)", () => {
  const { separacionMs, ventanaMs, maximo } = LIMITE_RECUPERAR;
  const t0 = 1_000_000_000;

  test("primer envío y separación mínima", () => {
    expect(reservarEnvio([], t0)).toEqual([t0]);
    expect(reservarEnvio([t0], t0 + separacionMs - 1)).toBeNull();
    expect(reservarEnvio([t0], t0 + separacionMs)).toEqual([
      t0,
      t0 + separacionMs,
    ]);
  });

  test("como mucho `maximo` por ventana; los viejos se descartan", () => {
    const envios = Array.from(
      { length: maximo },
      (_, i) => t0 + i * separacionMs,
    );
    const ahora = t0 + maximo * separacionMs;
    expect(reservarEnvio(envios, ahora)).toBeNull();
    expect(reservarEnvio(envios, t0 + ventanaMs)).toEqual([
      ...envios.slice(1),
      t0 + ventanaMs,
    ]);
  });

  test("un instante del futuro (reloj) no bloquea para siempre", () => {
    expect(reservarEnvio([t0 + ventanaMs * 10], t0)).toEqual([t0]);
  });
});

describe("enlace de la app", () => {
  const sitio = new URL("https://krea.test");

  test("el código va como oobCode a /recuperar/nueva", () => {
    expect(enlaceRestablecer("Q2x0", sitio)).toBe(
      "https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=Q2x0",
    );
  });

  test("sin código → null", () => {
    expect(enlaceRestablecer(null, sitio)).toBeNull();
    expect(enlaceRestablecer("", sitio)).toBeNull();
  });
});

describe("procesarRecuperacion (D186)", () => {
  function deps(over: Partial<DepsRecuperacion> = {}) {
    const enviados: Correo[] = [];
    const llamadas: string[] = [];
    const d: DepsRecuperacion = {
      leerEmail: async () => "alumno@correo.test",
      leerPerfil: async () => ({
        nombres: "Raquel Andreína",
        apariencia: null,
      }),
      reservar: async () => {
        llamadas.push("reservar");
        return true;
      },
      generarCodigo: async () => {
        llamadas.push("enlace");
        return "XYZ";
      },
      enviar: async (c) => {
        enviados.push(c);
        return { ok: true };
      },
      sitio: new URL("https://krea.test"),
      ahora: () => 1,
      ...over,
    };
    return { d, enviados, llamadas };
  }

  test("con email: envía al email real con el enlace de la app y el primer nombre", async () => {
    const { d, enviados } = deps();
    expect(await procesarRecuperacion("45009896", d)).toBe("enviado");
    expect(enviados).toHaveLength(1);
    expect(enviados[0].para).toEqual({
      email: "alumno@correo.test",
      nombre: "Raquel",
    });
    expect(enviados[0].html).toContain(
      "https://krea.test/recuperar/nueva?mode=resetPassword&amp;oobCode=XYZ",
    );
  });

  test("sin apariencia: el correo sale en azul y claro (la presentación original)", async () => {
    const { d, enviados } = deps();
    await procesarRecuperacion("45009896", d);
    expect(enviados[0].html).toBe(
      correoRestablecer({
        nombre: "Raquel",
        cedula: "45009896",
        enlace:
          "https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=XYZ",
      }).html,
    );
    expect(enviados[0].html).toContain(COLORES_CORREO.marca);
  });

  test("pasa la apariencia del perfil al correo (D343)", async () => {
    const { d, enviados } = deps({
      leerPerfil: async () => ({
        nombres: "Raquel",
        apariencia: { tema: "dark", acento: "verde" },
      }),
    });
    expect(await procesarRecuperacion("45009896", d)).toBe("enviado");
    const verdeOscuro = COLORES_CORREO_POR_ACENTO.oscuro.verde;
    expect(enviados[0].html).toContain(`background:${verdeOscuro.marca}`);
    expect(enviados[0].html).toContain(`background:${verdeOscuro.fondo}`);
    expect(enviados[0].html).not.toContain(COLORES_CORREO.marca);
  });

  test("sin email: no reserva, no genera enlace, no envía", async () => {
    const { d, enviados, llamadas } = deps({ leerEmail: async () => null });
    expect(await procesarRecuperacion("45009896", d)).toBe("sin-email");
    expect(enviados).toHaveLength(0);
    expect(llamadas).toEqual([]);
  });

  test("en el límite: no genera enlace ni envía", async () => {
    const { d, enviados, llamadas } = deps({ reservar: async () => false });
    expect(await procesarRecuperacion("45009896", d)).toBe("limite");
    expect(enviados).toHaveLength(0);
    expect(llamadas).toEqual([]);
  });

  test("Brevo falla → error-envio (el usuario no lo ve)", async () => {
    const { d } = deps({ enviar: async () => ({ ok: false, error: "red" }) });
    expect(await procesarRecuperacion("45009896", d)).toBe("error-envio");
  });
});

describe("contraseña nueva (D188)", () => {
  test("esquemas", () => {
    expect(zPedidoEnlace.safeParse({ cedula: " 45009896 " }).success).toBe(
      true,
    );
    expect(zPedidoEnlace.safeParse({ cedula: "12" }).success).toBe(false);
    expect(
      zRestablecer.safeParse({ oobCode: "c", password: "12345678" }).success,
    ).toBe(true);
    expect(
      zRestablecer.safeParse({ oobCode: "c", password: "1234567" }).success,
    ).toBe(false);
    expect(
      zRestablecer.safeParse({ oobCode: "", password: "12345678" }).success,
    ).toBe(false);
  });

  test("errores de Better Auth", () => {
    expect(errorRestablecerDe(400, "INVALID_TOKEN")).toBe("vencido");
    expect(errorRestablecerDe(400, "PASSWORD_TOO_SHORT")).toBe("invalida");
    expect(errorRestablecerDe(429, undefined)).toBe("bloqueado");
    expect(errorRestablecerDe(undefined, undefined)).toBe("vencido");
  });
});
