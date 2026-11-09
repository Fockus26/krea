// Genera los íconos PNG y el favicon.ico a partir de app/icon.svg (la «a» de la marca).
//
//   node scripts/generar-iconos.mjs
//
// Con node y no con bun: Playwright se cuelga con bun en Windows (CLAUDE.md).
// - public/icons/icon-192.png, icon-512.png: igual que el SVG (esquinas redondeadas).
// - app/apple-icon.png (180): fondo a sangre, sin esquinas (iOS las redondea).
// - public/icons/icon-maskable-512.png: fondo a sangre y la «a» dentro de la zona segura (80 %).
// - app/favicon.ico: 16 y 32 px, PNG dentro de un contenedor ICO.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync("app/icon.svg", "utf8");
const aSangre = svg.replace(/rx="22"/, 'rx="0"');
// Zona segura de maskable: la «a» ocupa el 60 % central en vez del 80 %.
const maskable = aSangre.replace(
  /<svg x="10" y="10" width="80" height="80"/,
  '<svg x="20" y="20" width="60" height="60"',
);

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(fuente, lado) {
  await page.setViewportSize({ width: lado, height: lado });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${fuente.replace(
      "<svg ",
      `<svg width="${lado}" height="${lado}" `,
    )}</body></html>`,
  );
  return page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: lado, height: lado },
  });
}

writeFileSync("public/icons/icon-192.png", await png(svg, 192));
writeFileSync("public/icons/icon-512.png", await png(svg, 512));
writeFileSync("public/icons/icon-maskable-512.png", await png(maskable, 512));
writeFileSync("app/apple-icon.png", await png(aSangre, 180));

// ICO con PNG embebidos (Windows Vista+ y todos los navegadores actuales).
const tamanos = [16, 32];
const imagenes = [];
for (const t of tamanos) imagenes.push(await png(svg, t));
const cabecera = Buffer.alloc(6 + 16 * tamanos.length);
cabecera.writeUInt16LE(0, 0);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(tamanos.length, 4);
let offset = cabecera.length;
tamanos.forEach((t, i) => {
  const e = 6 + 16 * i;
  cabecera.writeUInt8(t, e);
  cabecera.writeUInt8(t, e + 1);
  cabecera.writeUInt8(0, e + 2);
  cabecera.writeUInt8(0, e + 3);
  cabecera.writeUInt16LE(1, e + 4);
  cabecera.writeUInt16LE(32, e + 6);
  cabecera.writeUInt32LE(imagenes[i].length, e + 8);
  cabecera.writeUInt32LE(offset, e + 12);
  offset += imagenes[i].length;
});
writeFileSync("app/favicon.ico", Buffer.concat([cabecera, ...imagenes]));

await browser.close();
console.log("Íconos generados desde app/icon.svg");
