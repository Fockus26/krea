// Email del ingreso por content-type (F-A1 del QA v2, D491): se lee de todo lo que Better Auth
// acepta en `/sign-in/email`, y lo demás se rechaza antes de evaluar la contraseña.
import { describe, expect, test } from "bun:test";
import { emailDelIngreso } from "@/lib/limite-ingreso";

const URL_INGRESO = "http://localhost/api/auth/sign-in/email";
const EMAIL = "45000001@krea.local";

const pedido = (tipo: string | null, body: BodyInit) =>
  new Request(URL_INGRESO, {
    method: "POST",
    headers: tipo ? { "content-type": tipo } : {},
    body,
  });

describe("emailDelIngreso", () => {
  test("JSON, con y sin charset, y sin tocar el cuerpo original", async () => {
    const body = JSON.stringify({ email: EMAIL, password: "x" });
    expect(await emailDelIngreso(pedido("application/json", body))).toEqual({
      email: EMAIL,
    });
    const req = pedido("Application/JSON; charset=utf-8", body);
    expect(await emailDelIngreso(req)).toEqual({ email: EMAIL });
    expect(await req.json()).toEqual({ email: EMAIL, password: "x" });
  });

  test("urlencoded: el último email si viene repetido, como Better Auth", async () => {
    const body = new URLSearchParams([
      ["email", "otro@krea.local"],
      ["email", EMAIL],
      ["password", "x"],
    ]).toString();
    expect(
      await emailDelIngreso(pedido("application/x-www-form-urlencoded", body)),
    ).toEqual({ email: EMAIL });
  });

  test("tipos que Better Auth no acepta en el ingreso: 415", async () => {
    const datos = new FormData();
    datos.set("email", EMAIL);
    const json = JSON.stringify({ email: EMAIL });
    for (const req of [
      pedido(null, datos), // multipart/form-data
      pedido("text/plain", json),
      pedido("application/vnd.api+json", json),
      pedido("application/octet-stream", json),
    ])
      expect(await emailDelIngreso(req)).toEqual({ status: 415 });
    expect(
      await emailDelIngreso(
        new Request(URL_INGRESO, { method: "POST", body: json }),
      ),
    ).toEqual({ status: 415 });
  });

  test("sin email legible: 400", async () => {
    for (const body of [
      "{roto",
      "",
      "[]",
      "null",
      JSON.stringify({ password: "x" }),
      JSON.stringify({ email: "   " }),
      JSON.stringify({ email: [EMAIL] }),
      JSON.stringify({ email: 45000001 }),
    ])
      expect(await emailDelIngreso(pedido("application/json", body))).toEqual({
        status: 400,
      });
    expect(
      await emailDelIngreso(
        pedido("application/x-www-form-urlencoded", "password=x"),
      ),
    ).toEqual({ status: 400 });
  });
});
