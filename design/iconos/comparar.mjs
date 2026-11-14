// Hoja de comparación de los íconos: design/iconos/comparacion.png
//
//   node design/iconos/comparar.mjs      (después de generar los juegos con scripts/generar-iconos.mjs)
//
// Cada fila es una propuesta (la «a» actual, la «K», «krea»): 16, 32, 64 y 180 px sobre una barra de
// pestañas clara y otra oscura, el 16 y el 32 ampliados ×6 sin suavizar (lo que de verdad pinta el
// navegador) y el maskable recortado con una máscara circular.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const filas = [
  { nombre: "«a» actual (D346)", dir: "design/iconos/actual-a" },
  { nombre: "A · «K»", dir: "design/iconos/propuesta-k" },
  { nombre: "B · «krea»", dir: "design/iconos/propuesta-krea" },
];

const datosSvg = (dir) =>
  `data:image/svg+xml;base64,${readFileSync(`${dir}/icono.svg`).toString("base64")}`;
const datosPng = (dir, archivo) =>
  `data:image/png;base64,${readFileSync(`${dir}/${archivo}`).toString("base64")}`;

const html = `<html><head><style>
  body { margin: 0; padding: 24px; font: 14px system-ui, sans-serif; background: #fff; color: #111; width: 1500px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #555; }
  .fila { display: flex; align-items: stretch; gap: 12px; margin-bottom: 14px; }
  .nombre { width: 130px; font-weight: 600; padding-top: 10px; }
  .grupo { display: flex; align-items: center; gap: 22px; padding: 12px 16px; border-radius: 8px; }
  .celda { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; }
  .claro { background: #dee1e6; color: #333; }
  .oscuro { background: #202124; color: #ddd; }
  .pestana { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px 8px 0 0; font-size: 12px; }
  .claro .pestana { background: #fff; }
  .oscuro .pestana { background: #35363a; }
  img.px { image-rendering: pixelated; }
  .mask { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; background: #888; }
  .mask img { width: 96px; height: 96px; display: block; }
</style></head><body>
  <h1>Ícono pequeño de KREA · comparación</h1>
  <p>Tamaños reales sobre pestaña clara y oscura; 16 y 32 ampliados ×6 (sin suavizar) y maskable con máscara circular.</p>
  ${filas
    .map(({ nombre, dir }) => {
      const svg = datosSvg(dir);
      const tema = (clase) => `<div class="grupo ${clase}">
        <div class="celda"><div class="pestana"><img src="${svg}" width="16" height="16"><b>KREA</b></div><span>pestaña 16</span></div>
        <div class="celda"><img src="${svg}" width="32" height="32"><span>32</span></div>
        <div class="celda"><img src="${svg}" width="64" height="64"><span>64</span></div>
        <div class="celda"><img src="${svg}" width="180" height="180" style="border-radius:40px"><span>180 (iOS)</span></div>
      </div>`;
      return `<div class="fila">
        <div class="nombre">${nombre}</div>
        ${tema("claro")}${tema("oscuro")}
        <div class="grupo claro">
          <div class="celda"><img class="px" src="${datosPng(dir, "icon-16.png")}" width="96" height="96"><span>16 ×6</span></div>
          <div class="celda"><img class="px" src="${datosPng(dir, "icon-32.png")}" width="192" height="192" style="width:96px;height:96px"><span>32 ×3</span></div>
          <div class="celda"><div class="mask"><img src="${datosPng(dir, "icon-maskable-512.png")}"></div><span>maskable</span></div>
        </div>
      </div>`;
    })
    .join("")}
</body></html>`;

const browser = await chromium.launch({ timeout: 280000 });
const page = await browser.newPage({
  viewport: { width: 1548, height: 400 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.waitForLoadState("load");
await page.screenshot({
  path: "design/iconos/comparacion.png",
  fullPage: true,
  timeout: 240000,
});
await browser.close();
console.log("Hoja escrita en design/iconos/comparacion.png");
