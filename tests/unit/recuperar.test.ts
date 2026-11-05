import { describe, expect, test } from "bun:test";
import {
  type Correo,
  configBrevo,
  cuerpoBrevo,
  enviarCorreo,
  REMITENTE_NOMBRE,
  URL_BREVO,
} from "@/lib/correo/brevo";
import {
  ASUNTO_RESTABLECER,
  correoRestablecer,
  escaparHtml,
  primerNombre,
} from "@/lib/correo/restablecer";
import { resetConCodigo, urlIdentityToolkit } from "@/lib/firebase/password";
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
  para: { email: "alumno@correo.test", nombre: "Yeilin" },
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
      to: [{ email: "alumno@correo.test", name: "Yeilin" }],
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
      nombre: "Yeilin",
      cedula: "33272397",
      enlace,
    });
    expect(c.asunto).toBe(ASUNTO_RESTABLECER);
    expect(c.html).toContain("Hola, Yeilin");
    expect(c.html).toContain("33•••397");
    expect(c.html).not.toContain("33272397");
    expect(c.html).toContain(escaparHtml(enlace));
    expect(c.html).toContain("Crear nueva contraseña");
    expect(c.texto).toContain("Hola, Yeilin");
    expect(c.texto).toContain(enlace);
    expect(c.texto).not.toContain("33272397");
    // El pie no deja un placeholder literal mientras no haya correo del liceo.
    expect(c.html).not.toContain("[correo");
  });

  test("sin nombre: «Hola»; el nombre se escapa", () => {
    expect(
      correoRestablecer({ nombre: "", cedula: "33272397", enlace }).texto,
    ).toMatch(/^Hola\n/);
    const c = correoRestablecer({
      nombre: "<b>x</b>",
      cedula: "33272397",
      enlace,
    });
    expect(c.html).not.toContain("<b>x</b>");
    expect(c.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  test("primer nombre", () => {
    expect(primerNombre("  Yeilin Andreína ")).toBe("Yeilin");
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

  test("toma el oobCode del enlace de Firebase", () => {
    expect(
      enlaceRestablecer(
        "https://krea-d22f7.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=Q2x0&apiKey=k&lang=es",
        sitio,
      ),
    ).toBe("https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=Q2x0");
  });

  test("sin oobCode o URL rota → null", () => {
    expect(
      enlaceRestablecer("https://x.test/?mode=resetPassword", sitio),
    ).toBeNull();
    expect(enlaceRestablecer("no es url", sitio)).toBeNull();
  });
});

describe("procesarRecuperacion (D186)", () => {
  function deps(over: Partial<DepsRecuperacion> = {}) {
    const enviados: Correo[] = [];
    const llamadas: string[] = [];
    const d: DepsRecuperacion = {
      leerEmail: async () => "alumno@correo.test",
      leerNombres: async () => "Yeilin Andreína",
      reservar: async () => {
        llamadas.push("reservar");
        return true;
      },
      generarEnlace: async () => {
        llamadas.push("enlace");
        return "https://p.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=XYZ";
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
    expect(await procesarRecuperacion("33272397", d)).toBe("enviado");
    expect(enviados).toHaveLength(1);
    expect(enviados[0].para).toEqual({
      email: "alumno@correo.test",
      nombre: "Yeilin",
    });
    expect(enviados[0].html).toContain(
      "https://krea.test/recuperar/nueva?mode=resetPassword&amp;oobCode=XYZ",
    );
  });

  test("sin email: no reserva, no genera enlace, no envía", async () => {
    const { d, enviados, llamadas } = deps({ leerEmail: async () => null });
    expect(await procesarRecuperacion("33272397", d)).toBe("sin-email");
    expect(enviados).toHaveLength(0);
    expect(llamadas).toEqual([]);
  });

  test("en el límite: no genera enlace ni envía", async () => {
    const { d, enviados, llamadas } = deps({ reservar: async () => false });
    expect(await procesarRecuperacion("33272397", d)).toBe("limite");
    expect(enviados).toHaveLength(0);
    expect(llamadas).toEqual([]);
  });

  test("Brevo falla → error-envio (el usuario no lo ve)", async () => {
    const { d } = deps({ enviar: async () => ({ ok: false, error: "red" }) });
    expect(await procesarRecuperacion("33272397", d)).toBe("error-envio");
  });
});

describe("contraseña nueva (D188)", () => {
  test("esquemas", () => {
    expect(zPedidoEnlace.safeParse({ cedula: " 33272397 " }).success).toBe(
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

  test("errores de la REST", () => {
    expect(errorRestablecerDe("EXPIRED_OOB_CODE")).toBe("vencido");
    expect(errorRestablecerDe("INVALID_OOB_CODE")).toBe("vencido");
    expect(
      errorRestablecerDe(
        "WEAK_PASSWORD : Password should be at least 6 characters",
      ),
    ).toBe("invalida");
    expect(errorRestablecerDe("TOO_MANY_ATTEMPTS_TRY_LATER")).toBe("bloqueado");
    expect(errorRestablecerDe(undefined)).toBe("vencido");
  });

  test("resetConCodigo: verificar (sin newPassword) y confirmar", async () => {
    const cuerpos: unknown[] = [];
    let url = "";
    const pedir = (async (u: string, i: RequestInit) => {
      url = u;
      cuerpos.push(JSON.parse(i.body as string));
      return new Response('{"email":"33272397@alumnos.krea.app"}', {
        status: 200,
      });
    }) as unknown as typeof fetch;
    const destino = { apiKey: "k" };
    expect(await resetConCodigo("C", null, destino, pedir)).toEqual({
      ok: true,
      email: "33272397@alumnos.krea.app",
    });
    expect(await resetConCodigo("C", "nueva-clave", destino, pedir)).toEqual({
      ok: true,
      email: "33272397@alumnos.krea.app",
    });
    expect(cuerpos).toEqual([
      { oobCode: "C" },
      { oobCode: "C", newPassword: "nueva-clave" },
    ]);
    expect(url).toBe(urlIdentityToolkit("resetPassword", "k"));
  });

  test("resetConCodigo: error de la REST, 5xx y red", async () => {
    const con = (status: number, cuerpo: unknown) =>
      (async () =>
        new Response(JSON.stringify(cuerpo), {
          status,
        })) as unknown as typeof fetch;
    const destino = { apiKey: "k" };
    expect(
      await resetConCodigo(
        "C",
        null,
        destino,
        con(400, { error: { message: "EXPIRED_OOB_CODE" } }),
      ),
    ).toEqual({ ok: false, mensaje: "EXPIRED_OOB_CODE" });
    expect(await resetConCodigo("C", null, destino, con(503, {}))).toEqual({
      ok: false,
      red: true,
    });
    const lanza = (async () => {
      throw new Error("x");
    }) as unknown as typeof fetch;
    expect(await resetConCodigo("C", null, destino, lanza)).toEqual({
      ok: false,
      red: true,
    });
  });
});
