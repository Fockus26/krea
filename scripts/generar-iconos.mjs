// Genera los íconos PNG y el favicon.ico a partir de un SVG de ícono (D391, D402).
//
//   node scripts/generar-iconos.mjs                       # los íconos de la app (dos fuentes, D402):
//                                                         #   ≤ 32 px (favicon.ico) ← app/icon.svg, la «K»
//                                                         #   ≥ 64 px (180, 192, 512, maskable) ← la palabra «krea»
//   node scripts/generar-iconos.mjs <icono.svg> --salida <carpeta>
//                                                         # juego completo en una carpeta (propuestas)
//
// Con node y no con bun: Playwright se cuelga con bun en Windows (CLAUDE.md).
// El SVG fuente es un cuadro 100×100 con el fondo (`<rect … rx="22"/>`) y el glifo dentro de un
// `<svg x y width height viewBox>` anidado. De él salen:
// - icon-192.png, icon-512.png: igual que el SVG (esquinas redondeadas).
// - apple-icon.png (180): fondo a sangre, sin esquinas (iOS las redondea).
// - icon-maskable-512.png: fondo a sangre y el glifo encogido al 75 % (zona segura de maskable).
// - favicon.ico: 16 y 32 px, PNG dentro de un contenedor ICO (en --salida también icon-16/32.png).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const iSalida = args.indexOf("--salida");
const salida = iSalida >= 0 ? args[iSalida + 1] : null;
const fuente =
  args.find((a, i) => !a.startsWith("--") && i !== iSalida + 1) ??
  "app/icon.svg";

// D402: en la app, de 64 px en adelante va la palabra «krea»; de 32 hacia abajo, la «K».
const FUENTE_GRANDE = "design/iconos/propuesta-krea/icono.svg";

const svg = readFileSync(fuente, "utf8");
// Con --salida el juego completo sale de una sola fuente (las propuestas de design/iconos/).
const grande = salida ? svg : readFileSync(FUENTE_GRANDE, "utf8");
const aSangre = grande.replace(/rx="22"/, 'rx="0"');
// Zona segura de maskable: el glifo se encoge al 75 % alrededor del centro del cuadro.
const maskable = aSangre.replace(
  /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/,
  (_, x, y, w, h) => {
    const [nx, ny, nw, nh] = [x, y, w, h].map(Number);
    const ancho = nw * 0.75;
    const alto = nh * 0.75;
    return `<svg x="${nx + nw / 2 - ancho / 2}" y="${ny + nh / 2 - alto / 2}" width="${ancho}" height="${alto}"`;
  },
);

const browser = await chromium.launch({ timeout: 280000 });
const page = await browser.newPage();

async function png(origen, lado) {
  await page.setViewportSize({ width: lado, height: lado });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${origen.replace(
      "<svg ",
      `<svg width="${lado}" height="${lado}" `,
    )}</body></html>`,
  );
  return page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: lado, height: lado },
  });
}

// ICO con PNG embebidos (Windows Vista+ y todos los navegadores actuales).
function ico(tamanos, imagenes) {
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
  return Buffer.concat([cabecera, ...imagenes]);
}

const tamanos = [16, 32];
const pequenos = [];
for (const t of tamanos) pequenos.push(await png(svg, t));

if (salida) {
  mkdirSync(salida, { recursive: true });
  writeFileSync(join(salida, "icon-16.png"), pequenos[0]);
  writeFileSync(join(salida, "icon-32.png"), pequenos[1]);
  writeFileSync(join(salida, "apple-icon-180.png"), await png(aSangre, 180));
  writeFileSync(join(salida, "icon-192.png"), await png(svg, 192));
  writeFileSync(join(salida, "icon-512.png"), await png(svg, 512));
  writeFileSync(
    join(salida, "icon-maskable-512.png"),
    await png(maskable, 512),
  );
  writeFileSync(join(salida, "favicon.ico"), ico(tamanos, pequenos));
} else {
  writeFileSync("public/icons/icon-192.png", await png(grande, 192));
  writeFileSync("public/icons/icon-512.png", await png(grande, 512));
  writeFileSync("public/icons/icon-maskable-512.png", await png(maskable, 512));
  writeFileSync("app/apple-icon.png", await png(aSangre, 180));
  writeFileSync("app/favicon.ico", ico(tamanos, pequenos));
}

await browser.close();
console.log(
  salida
    ? `Íconos generados desde ${fuente} en ${salida}`
    : `Íconos generados: ≤ 32 px desde ${fuente}, ≥ 64 px desde ${FUENTE_GRANDE}`,
);
