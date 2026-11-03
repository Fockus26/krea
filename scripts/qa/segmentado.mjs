// QA de segmentados (ToggleGroup / Tabs segmented): el grupo de ancho propio no debe colapsar.
// Uso: bun run build && bun run qa:segmentado   (node + Playwright, sin servidor de la app)
// Carga el CSS compilado de .next/static con page.setContent() sobre HTML que reproduce
// las anatomías reales; las clases se copian de components/ui/toggle-group.tsx y tabs.tsx
// (si cambian allí, actualiza las constantes de abajo) y de los consumidores.
// Si `playwright` no resuelve desde el repo: NODE_PATH=$(npm root -g) node scripts/qa/segmentado.mjs
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// Turbopack deja el CSS en .next/static/chunks; webpack en .next/static/css: se busca en todo .next/static
const hojas = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? hojas(join(d, e.name))
      : e.name.endsWith(".css")
        ? [join(d, e.name)]
        : [],
  );
const css = hojas(".next/static")
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

// Leer las clases reales del componente: si el grupo no-block lleva @container, el caso falla.
const fuenteTG = readFileSync("components/ui/toggle-group.tsx", "utf8");
const fuenteTabs = readFileSync("components/ui/tabs.tsx", "utf8");

const RAIZ = "group/toggle-group gap-1 rounded-md bg-surface-2 p-1";
const ITEM =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-nav px-4 text-button whitespace-nowrap text-text-2 [&_svg]:size-5 [&_svg]:shrink-0 group-data-[block]/toggle-group:min-w-0 group-data-[block]/toggle-group:flex-1 group-data-[block]/toggle-group:px-2 group-data-[block]/toggle-group:@max-seg:[&_svg]:hidden";

function claseRaiz(block, extra = "") {
  // Replica la composición de ToggleGroup leyendo el fuente: ¿@container incondicional?
  const incondicional = /bg-surface-2 p-1 @container",/.test(fuenteTG);
  const soloBlock = /block \? "[^"]*@container/.test(fuenteTG);
  const ct = incondicional || (block && soloBlock) ? "@container " : "";
  return `${RAIZ} ${ct}${block ? "flex w-full" : "inline-flex w-fit max-w-full"} ${extra}`.trim();
}

const grupo = (id, block, extra, items, envolver = false) =>
  `<div role="radiogroup" id="${id}" data-block="${block ? "true" : ""}" class="${claseRaiz(block, extra)}">${items
    .map((t) => {
      const b = `<button type="button" role="radio" class="${ITEM}"><svg viewBox="0 0 20 20" class="ico"></svg>${t}</button>`;
      return envolver
        ? `<div class="flex flex-col items-center gap-1.5">${b}<span>${t}</span></div>`
        : b;
    })
    .join("")}</div>`;

const html = (ancho, cuerpo) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;width:${ancho}px">${cuerpo}</body></html>`;

// data-block como atributo booleano sólo en block (igual que data-block={block || undefined})
const fixBlock = (s) =>
  s.replace(/data-block=""/g, "").replace(/data-block="true"/g, "data-block");

const casos = [
  {
    nombre: "Apariencia /secciones: tema + acento no-block en fila (flex-wrap)",
    ancho: 900,
    html: `<div class="flex flex-wrap gap-x-8 gap-y-4"><div class="flex flex-col gap-2">${grupo("g1", false, "", ["Sistema", "Claro", "Oscuro"])}</div><div class="flex flex-col gap-2">${grupo("g2", false, "", ["Azul", "Verde", "Naranja", "Violeta"])}</div></div>`,
    grupos: ["g1", "g2"],
  },
  {
    nombre: "Apariencia /secciones a 320 px",
    ancho: 320,
    html: `<div class="flex flex-wrap gap-x-8 gap-y-4"><div class="flex flex-col gap-2">${grupo("g1", false, "", ["Sistema", "Claro", "Oscuro"])}</div><div class="flex flex-col gap-2">${grupo("g2", false, "", ["Azul", "Verde", "Naranja", "Violeta"])}</div></div>`,
    grupos: ["g1", "g2"],
  },
  {
    nombre: "Perfil: acentos (flex flex-wrap, ítems dentro de div)",
    ancho: 600,
    html: `<div class="flex flex-col gap-2">${grupo("g1", false, "flex flex-wrap gap-4 bg-transparent p-0", ["Azul", "Verde", "Naranja", "Violeta"], true)}</div>`,
    grupos: ["g1"],
  },
  {
    nombre: "Perfil: tema en block a 320 px (íconos ocultos bajo 400 px)",
    ancho: 320,
    html: `<div class="flex flex-col gap-2">${grupo("g1", true, "", ["Sistema", "Claro", "Oscuro"])}</div>`,
    grupos: ["g1"],
    iconos: "ocultos",
  },
  {
    nombre: "Block a 1024 px (íconos visibles)",
    ancho: 1024,
    html: `<div class="flex flex-col gap-2">${grupo("g1", true, "", ["Sistema", "Claro", "Oscuro"])}</div>`,
    grupos: ["g1"],
    iconos: "visibles",
  },
];

// Tabs segmentado: misma anatomía; se comprueba que su raíz no declare @container sin block.
const tabsOk =
  !/p-1 @container " \+/.test(fuenteTabs) &&
  /block \? "@container/.test(fuenteTabs);

// En la nube el Chromium preinstalado puede no coincidir con la versión de playwright: CHROMIUM_PATH lo fuerza
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {},
);
let fallos = 0;
for (const c of casos) {
  const page = await browser.newPage({
    viewport: { width: c.ancho, height: 600 },
  });
  await page.setContent(html(c.ancho, fixBlock(c.html)));
  const r = await page.evaluate(
    ({ grupos }) => {
      const salida = [];
      for (const id of grupos) {
        const g = document.getElementById(id);
        const gr = g.getBoundingClientRect();
        const items = [...g.querySelectorAll("button")].map((b) =>
          b.getBoundingClientRect(),
        );
        const suma = items.reduce((a, r) => a + r.width, 0);
        let solapa = false;
        for (let i = 0; i < items.length; i++)
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i],
              b = items[j];
            if (
              a.left < b.right - 0.5 &&
              b.left < a.right - 0.5 &&
              a.top < b.bottom - 0.5 &&
              b.top < a.bottom - 0.5
            )
              solapa = true;
          }
        const fuera = items.some(
          (r) =>
            r.left < gr.left - 0.5 ||
            r.right > gr.right + 0.5 ||
            r.top < gr.top - 0.5 ||
            r.bottom > gr.bottom + 0.5,
        );
        const ico = g.querySelector("svg");
        salida.push({
          id,
          ancho: gr.width,
          suma,
          solapa,
          fuera,
          ico: ico ? getComputedStyle(ico).display : null,
        });
      }
      return salida;
    },
    { grupos: c.grupos },
  );
  for (const g of r) {
    const apila = c.html.includes("flex-wrap gap-4");
    const okAncho = apila ? true : g.ancho + 0.5 >= g.suma;
    const okIco =
      !c.iconos ||
      (c.iconos === "ocultos" ? g.ico === "none" : g.ico !== "none");
    const ok = okAncho && !g.solapa && !g.fuera && okIco;
    if (!ok) fallos++;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${c.nombre} [${g.id}] grupo=${g.ancho.toFixed(1)}px ítems=${g.suma.toFixed(1)}px solapa=${g.solapa} fuera=${g.fuera}${c.iconos ? ` íconos=${g.ico}` : ""}`,
    );
  }
  await page.close();
}
console.log(
  `${tabsOk ? "PASS" : "FAIL"}  Tabs segmented: @container solo con block (fuente)`,
);
if (!tabsOk) fallos++;
await browser.close();
console.log(fallos ? `\n${fallos} caso(s) FAIL` : "\nTodos PASS");
process.exit(fallos ? 1 : 0);
