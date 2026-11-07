/**
 * Auditoría de contraste texto/fondo en los 4 acentos × claro/oscuro (D301–D303).
 *
 *   bun run scripts/qa/contraste-acentos.ts          # tabla en consola (sale 1 si algún par falla)
 *   bun run scripts/qa/contraste-acentos.ts --json   # filas en JSON
 *
 * Lee los tokens de `app/globals.css` (nada de valores copiados), recalcula los derivados
 * (`color-mix` en sRGB, igual que el navegador) y mide cada par de botones (primario, secundario,
 * ghost; reposo, hover y activo), chips/píldoras de acento y podio (número, nombre y puntos, y el
 * destello que lo recorre). `tests/unit/contraste-acentos.test.ts` importa `auditar()`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contraste } from "../../lib/grades";

export const ACENTOS = ["azul", "rojo", "verde", "morado"] as const;
export const TEMAS = ["claro", "oscuro"] as const;
export type Acento = (typeof ACENTOS)[number];
export type Tema = (typeof TEMAS)[number];

/** 4,5:1 para texto; 3:1 para gráficos (iconos, anillos). */
export const MIN_TEXTO = 4.5;
export const MIN_GRAFICO = 3;

export type Fila = {
  tema: Tema;
  acento: Acento;
  grupo: string;
  par: string;
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  ok: boolean;
};

const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

function bloque(selector: string, desde = 0): Record<string, string> {
  const inicio = css.indexOf(`${selector} {`, desde);
  if (inicio === -1) throw new Error(`No existe el bloque ${selector}`);
  const abre = css.indexOf("{", inicio);
  const cierra = css.indexOf("}", abre);
  const out: Record<string, string> = {};
  for (const m of css
    .slice(abre + 1, cierra)
    .matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[m[1]] = m[2].trim().replace(/\s*\/\*.*$/, "");
  return out;
}

const rgb = (h: string) =>
  [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
/** `color-mix(in srgb, a p%, b)` */
export const mezcla = (a: string, p: number, b: string) => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v * p + y[i] * (1 - p)));
};
const pct = (v: string) => Number.parseFloat(v) / 100;

export function tokens(tema: Tema, acento: Acento): Record<string, string> {
  const claro = bloque(':root,\n[data-theme="light"]');
  const base =
    tema === "claro" ? claro : { ...claro, ...bloque('[data-theme="dark"]') };
  if (acento === "azul") return base;
  const sel =
    tema === "claro"
      ? `[data-accent="${acento}"]`
      : `[data-theme="dark"][data-accent="${acento}"]`;
  return { ...base, ...bloque(sel) };
}

/** Los mismos tokens del tema oscuro por la vía del sistema (`prefers-color-scheme`). */
export function tokensSistema(acento: Acento): Record<string, string> {
  const desde = css.indexOf("@media (prefers-color-scheme: dark)");
  const base = bloque(':root:not([data-theme="light"])', desde);
  if (acento === "azul") return base;
  return {
    ...base,
    ...bloque(
      `:root:not([data-theme="light"])[data-accent="${acento}"]`,
      desde,
    ),
  };
}

/** Pico del destello (`brillo-podio`) sobre el escalón: el del 1.º oscurece, el de 2.º y 3.º usa --surface. */
function brilloPico(t: Record<string, string>, fondo: string, primero = false) {
  return primero
    ? mezcla(t["--brillo-1-tinta"], pct(t["--brillo-1-mezcla"]), fondo)
    : mezcla(t["--surface"], pct(t["--brillo-mezcla"]), fondo);
}

export function auditar(): Fila[] {
  const filas: Fila[] = [];
  for (const tema of TEMAS) {
    for (const acento of ACENTOS) {
      const t = tokens(tema, acento);
      const accent = t["--accent"];
      const ink = t["--accent-ink"];
      const on = t["--on-accent"];
      const soft = mezcla(accent, pct(t["--tint-1"]), t["--surface"]);
      const soft2 = mezcla(accent, pct(t["--tint-2"]), t["--surface"]);
      const hover = mezcla(accent, 0.88, t["--hover-mix"]);
      const add = (
        grupo: string,
        par: string,
        fg: string,
        bg: string,
        min = MIN_TEXTO,
      ) => {
        const ratio = contraste(fg, bg);
        filas.push({
          tema,
          acento,
          grupo,
          par,
          fg,
          bg,
          ratio,
          min,
          ok: ratio >= min,
        });
      };

      // Botones (components/ui/button.tsx)
      add("botón primario", "reposo y activo", on, accent);
      add("botón primario", "hover", on, hover);
      for (const [sup, fondo] of [
        ["--surface", t["--surface"]],
        ["--bg", t["--bg"]],
        ["--surface-2", t["--surface-2"]],
      ] as const) {
        add("botón secundario", `reposo sobre ${sup}`, ink, fondo);
        add("botón ghost", `reposo sobre ${sup}`, ink, fondo);
      }
      add("botón secundario / ghost", "hover (--accent-soft)", ink, soft);
      add("botón secundario", "activo (--accent-soft-2)", ink, soft2);

      // Chips y píldoras de acento (badge.tsx)
      add("chip acc", "texto sobre --accent-soft-2", t["--text"], soft2);
      add("chip acc", "icono sobre --accent-soft-2", ink, soft2, MIN_GRAFICO);
      add("chip «tú»", "--on-accent sobre --accent", on, accent);

      // Podio (components/krea/podium.tsx)
      add("podio", "1.º número sobre escalón", on, accent);
      add("podio", "2.º número sobre escalón", ink, soft2);
      add("podio", "3.º número sobre escalón", ink, soft);
      add("podio", "nombre y puntos sobre --bg", t["--text"], t["--bg"]);
      add(
        "podio",
        "nombre y puntos sobre --surface",
        t["--text"],
        t["--surface"],
      );
      // Destello en su pico: oscurece el fondo, el texto va por encima (z-index -1)
      add("podio destello", "1.º número", on, brilloPico(t, accent, true));
      add("podio destello", "2.º número", ink, brilloPico(t, soft2));
      add("podio destello", "3.º número", ink, brilloPico(t, soft));
    }
    // Corona: gráfico sobre la página
    const t = tokens(tema, "azul");
    const corona =
      tema === "claro" ? t["--warning"] : (t["--secondary"] ?? "#ffc23d");
    filas.push({
      tema,
      acento: "azul",
      grupo: "podio",
      par: "corona sobre --bg (gráfico)",
      fg: corona,
      bg: t["--bg"],
      ratio: contraste(corona, t["--bg"]),
      min: MIN_GRAFICO,
      ok: contraste(corona, t["--bg"]) >= MIN_GRAFICO,
    });
  }
  return filas;
}

if (import.meta.main) {
  const filas = auditar();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(filas, null, 2));
  } else {
    for (const f of filas)
      console.log(
        `${f.ok ? "ok  " : "FALLA"} ${f.tema.padEnd(6)} ${f.acento.padEnd(6)} ${f.grupo} · ${f.par}: ${f.fg} / ${f.bg} = ${f.ratio.toFixed(2)} (≥ ${f.min})`,
      );
  }
  const mal = filas.filter((f) => !f.ok);
  console.error(`${filas.length - mal.length}/${filas.length} pares ok`);
  process.exit(mal.length ? 1 : 0);
}
