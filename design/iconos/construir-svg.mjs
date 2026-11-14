// Construye los SVG de las dos propuestas de ícono a partir del logo (public/brand/krea-logo.svg).
//
//   node design/iconos/construir-svg.mjs
//
// El logo trae la «k» como su propio subtrazo (el primero de `krea-logo__ink`) y «rea» como el
// segundo; el resto son los contadores de la «e»/«a» y la leyenda «ESCUELA CREATIVA» (se descarta,
// como las gotas cian: el ícono es blanco sobre el azul de marca). Mismo método que D346: cuadro
// 100×100, `rx=22`, glifo blanco dentro de un `<svg>` anidado (lo que lee scripts/generar-iconos.mjs).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const logo = readFileSync("public/brand/krea-logo.svg", "utf8");
const tinta = logo.match(/<path class="krea-logo__ink"[^>]* d="([^"]+)"/)[1];
const subtrazos = tinta.split(/(?=M )/).filter((s) => s.trim());

function caja(sp) {
  const n = [...sp.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

// «k»: subtrazo más alto (el único que baja de y 900 y a la vez sube a y 10) y que arranca en x ≈ 11.
// «rea»: el siguiente grande; sus contadores son los subtrazos que caen dentro de su caja.
const grandes = subtrazos
  .map((sp) => ({ sp, ...caja(sp) }))
  .filter((c) => c.y1 - c.y0 > 300);
const k = grandes.find((c) => c.x0 < 100);
const rea = grandes.find((c) => c !== k);
const contadores = subtrazos
  .map((sp) => ({ sp, ...caja(sp) }))
  .filter(
    (c) =>
      c.sp !== k.sp &&
      c.sp !== rea.sp &&
      c.x0 >= rea.x0 &&
      c.x1 <= rea.x1 &&
      c.y0 >= rea.y0 &&
      c.y1 <= rea.y1,
  );

function icono({ trazos, caja: c, ancho, alto, x, y }) {
  const d = trazos.map((t) => t.sp).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#295AC3" width="100" height="100" rx="22"/><svg x="${x}" y="${y}" width="${ancho}" height="${alto}" viewBox="${c.x0} ${c.y0} ${c.x1 - c.x0} ${c.y1 - c.y0}" overflow="hidden"><path fill="#FFFFFF" fill-rule="evenodd" d="${d}"/></svg></svg>\n`;
}

const redondea = (n) => Math.round(n * 100) / 100;

// A «K»: la «k» a 74 de alto (13 % de margen arriba y abajo), centrada.
{
  const alto = 74;
  const ancho = redondea((alto * (k.x1 - k.x0)) / (k.y1 - k.y0));
  mkdirSync("design/iconos/propuesta-k", { recursive: true });
  writeFileSync(
    "design/iconos/propuesta-k/icono.svg",
    icono({
      trazos: [k],
      caja: k,
      ancho,
      alto,
      x: redondea((100 - ancho) / 2),
      y: 13,
    }),
  );
}

// B «krea»: palabra completa (k + rea) a todo el ancho posible (88 de 100), sin gotas ni leyenda.
{
  const c = {
    x0: k.x0,
    x1: Math.max(k.x1, rea.x1),
    y0: Math.min(k.y0, rea.y0),
    y1: Math.max(k.y1, rea.y1),
  };
  const ancho = 88;
  const alto = redondea((ancho * (c.y1 - c.y0)) / (c.x1 - c.x0));
  mkdirSync("design/iconos/propuesta-krea", { recursive: true });
  writeFileSync(
    "design/iconos/propuesta-krea/icono.svg",
    icono({
      trazos: [k, rea, ...contadores],
      caja: c,
      ancho,
      alto,
      x: 6,
      y: redondea((100 - alto) / 2),
    }),
  );
}

console.log("SVG de las propuestas escritos en design/iconos/");
