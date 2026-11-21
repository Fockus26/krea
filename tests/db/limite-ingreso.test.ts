// F-A1 del QA v2 (D491, D492): el tope de 5 contraseñas equivocadas por cuenta no se salta con un
// cuerpo urlencoded ni con una ráfaga en paralelo. `evaluar` hace de Better Auth: lee el cuerpo
// como él (JSON o urlencoded, el último valor gana) y tarda un poco, como el hash de verdad.
import { beforeAll, describe, expect, test } from "bun:test";
import { MAX_FALLOS } from "@/lib/data/intentos";
import type { Db } from "@/lib/db";
import { ingresarConLimite } from "@/lib/limite-ingreso";
import { baseNueva } from "./base";

const URL_INGRESO = "http://localhost/api/auth/sign-in/email";
const BUENA = "contraseña-buena";

let db: Db;
beforeAll(async () => {
  db = await baseNueva();
});

/** Better Auth de mentira: cuenta cada contraseña que llega a evaluar. */
function authFalso(fallo = 401) {
  const evaluadas: string[] = [];
  async function evaluar(req: Request): Promise<Response> {
    const tipo = (req.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    let cuerpo: Record<string, unknown>;
    if (tipo === "application/json") cuerpo = await req.json();
    else if (tipo === "application/x-www-form-urlencoded")
      cuerpo = Object.fromEntries(await req.formData());
    else return new Response(null, { status: 415 });
    await Bun.sleep(5);
    evaluadas.push(String(cuerpo.email));
    if (cuerpo.password === BUENA) return Response.json({ ok: true });
    return new Response(null, { status: fallo });
  }
  return { evaluar, evaluadas };
}

const json = (email: string, password: string, tipo = "application/json") =>
  new Request(URL_INGRESO, {
    method: "POST",
    headers: { "content-type": tipo },
    body: JSON.stringify({ email, password }),
  });

const form = (campos: [string, string][]) =>
  new Request(URL_INGRESO, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos).toString(),
  });

const estados = (rs: Response[]) => rs.map((r) => r.status);

describe("límite de ingreso por cuenta (F-A1)", () => {
  test("urlencoded: tras 5 fallos responde 429 sin evaluar la contraseña", async () => {
    const email = "45000001@krea.local";
    const { evaluar, evaluadas } = authFalso();
    const rs: Response[] = [];
    for (let i = 0; i < 12; i++)
      rs.push(
        await ingresarConLimite(
          db,
          form([
            ["email", email],
            ["password", `mala-${i}`],
          ]),
          evaluar,
        ),
      );
    expect(evaluadas.length).toBe(MAX_FALLOS);
    expect(estados(rs).filter((s) => s === 401).length).toBe(MAX_FALLOS);
    expect(
      estados(rs)
        .slice(MAX_FALLOS)
        .every((s) => s === 429),
    ).toBe(true);
  });

  test("ráfaga de 30 en paralelo (JSON): como mucho 5 contraseñas evaluadas", async () => {
    const email = "45000002@krea.local";
    const { evaluar, evaluadas } = authFalso();
    const rs = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        ingresarConLimite(db, json(email, `mala-p${i}`), evaluar),
      ),
    );
    expect(evaluadas.length).toBeLessThanOrEqual(MAX_FALLOS);
    expect(estados(rs).filter((s) => s === 429).length).toBe(
      30 - evaluadas.length,
    );
  });

  test("ráfaga de 30 en paralelo (urlencoded, mayúsculas y espacios): como mucho 5", async () => {
    const email = "45000003@krea.local";
    const { evaluar, evaluadas } = authFalso();
    const rs = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        ingresarConLimite(
          db,
          form([
            ["email", i % 2 ? email.toUpperCase() : email],
            ["password", `mala-p${i}`],
          ]),
          evaluar,
        ),
      ),
    );
    expect(evaluadas.length).toBeLessThanOrEqual(MAX_FALLOS);
    expect(estados(rs).filter((s) => s === 429).length).toBe(
      30 - evaluadas.length,
    );
  });

  test("JSON con charset cuenta igual", async () => {
    const email = "45000004@krea.local";
    const { evaluar, evaluadas } = authFalso();
    for (let i = 0; i < 8; i++)
      await ingresarConLimite(
        db,
        json(email, `mala-${i}`, "application/json; charset=utf-8"),
        evaluar,
      );
    expect(evaluadas.length).toBe(MAX_FALLOS);
  });

  test("email repetido en el formulario: cuenta contra el que lee Better Auth (el último)", async () => {
    const victima = "45000005@krea.local";
    const { evaluar, evaluadas } = authFalso();
    for (let i = 0; i < 8; i++)
      await ingresarConLimite(
        db,
        form([
          ["email", `otro${i}@krea.local`],
          ["email", victima],
          ["password", `mala-${i}`],
        ]),
        evaluar,
      );
    expect(evaluadas.filter((e) => e === victima).length).toBe(MAX_FALLOS);
  });

  test("otro content-type (multipart, texto) no llega a evaluar", async () => {
    const email = "45000006@krea.local";
    const { evaluar, evaluadas } = authFalso();
    const datos = new FormData();
    datos.set("email", email);
    datos.set("password", "mala");
    const multipart = new Request(URL_INGRESO, {
      method: "POST",
      body: datos,
    });
    const texto = new Request(URL_INGRESO, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ email, password: "mala" }),
    });
    const rs = [
      await ingresarConLimite(db, multipart, evaluar),
      await ingresarConLimite(db, texto, evaluar),
    ];
    expect(estados(rs)).toEqual([415, 415]);
    expect(evaluadas.length).toBe(0);
  });

  test("sin email legible no llega a evaluar", async () => {
    const { evaluar, evaluadas } = authFalso();
    const rs = [
      await ingresarConLimite(db, json("", "mala"), evaluar),
      await ingresarConLimite(
        db,
        new Request(URL_INGRESO, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: ["45000007@krea.local"],
            password: "x",
          }),
        }),
        evaluar,
      ),
      await ingresarConLimite(
        db,
        new Request(URL_INGRESO, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{no es json",
        }),
        evaluar,
      ),
    ];
    expect(estados(rs)).toEqual([400, 400, 400]);
    expect(evaluadas.length).toBe(0);
  });

  test("un ingreso bueno borra los fallos; un error que no es de contraseña no cuenta", async () => {
    const email = "45000008@krea.local";
    const { evaluar, evaluadas } = authFalso();
    for (let i = 0; i < MAX_FALLOS - 1; i++)
      await ingresarConLimite(db, json(email, `mala-${i}`), evaluar);
    expect((await ingresarConLimite(db, json(email, BUENA), evaluar)).ok).toBe(
      true,
    );
    // 500 del servidor (no es una contraseña equivocada): no gasta intentos
    const caido = authFalso(500);
    for (let i = 0; i < 10; i++)
      await ingresarConLimite(db, json(email, `mala-c${i}`), caido.evaluar);
    expect(caido.evaluadas.length).toBe(10);
    const despues: Response[] = [];
    for (let i = 0; i < MAX_FALLOS + 1; i++)
      despues.push(
        await ingresarConLimite(db, json(email, `mala-d${i}`), evaluar),
      );
    expect(estados(despues)).toEqual([...Array(MAX_FALLOS).fill(401), 429]);
    expect(evaluadas.length).toBe(MAX_FALLOS - 1 + 1 + MAX_FALLOS);
  });
});
