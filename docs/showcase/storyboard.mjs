// Tráiler de KREA para el portafolio (skill project-showcase): el profesor mira el ranking en
// vivo de una sección. Solo contra el servidor local con el seed anónimo (`bun run qa:local`,
// D490); las credenciales salen de .env.test.local, nunca de este archivo.
import { existsSync } from "node:fs";

if (!process.env.PROFESOR_EMAIL_TEST && existsSync(".env.test.local"))
  process.loadEnvFile(".env.test.local");

export const start = "/profe/ranking/5a";

export async function setup(page, context) {
  // El indicador de desarrollo de Next no es parte del producto.
  // (hoja adoptada: una etiqueta <style> suelta la quita la hidratación de React)
  await context.addInitScript(() => {
    const hoja = new CSSStyleSheet();
    hoja.replaceSync("nextjs-portal{display:none!important}");
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
  });
  const base = new URL(
    page.url() === "about:blank"
      ? (process.env.SHOWCASE_BASE ?? "http://localhost:4310")
      : page.url(),
  ).origin;
  if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(base))
    throw new Error("solo localhost");
  await page.goto(`${base}/ingresar`, { waitUntil: "networkidle" });
  await page.getByLabel("Cédula").fill(process.env.PROFESOR_EMAIL_TEST);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.PROFESOR_PASSWORD_TEST);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
  // Compila Equipos sin visitarla (en desarrollo la primera visita tarda) y deja pasar el confeti
  // de Estudiantes, que sale una vez por sesión (D258): así el bucle empieza y termina igual, y el
  // de Equipos cae dentro de la escena.
  await page.request.get(`${base}/profe/ranking/5a/equipos`);
  await page.goto(`${base}/profe/ranking/5a`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3200);
}

export async function scene(page, h) {
  await h.pause(1300);
  await h.scrollTo(700, 1500);
  await h.pause(1000);
  await h.scrollTo(0, 1200);
  await h.pause(600);
  await page
    .getByRole("main")
    .getByRole("link", { name: "Equipos", exact: true })
    .click();
  await h.pause(3000);
  await page
    .getByRole("main")
    .getByRole("link", { name: "Estudiantes", exact: true })
    .click();
  await h.pause(1500);
}
