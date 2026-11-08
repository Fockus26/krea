// Correo «Restablecer contraseña» (HANDOFF §5c, lienzo design/canvas/Correo.dc.html): asunto,
// HTML de una columna y texto plano. Puro. Solo lleva el primer nombre, la cédula enmascarada y
// el enlace: nada más del alumno. Cuatro presentaciones (D341) con el acento y el tema del perfil
// (D342); `VARIANTE_CORREO` elige la que se envía. Estructura segura para correo: tablas, estilos
// en línea y botón con VML para Outlook.
import { maskCedula } from "@/lib/mask";
import type { Apariencia } from "@/lib/modelo";
import {
  COLORES_CORREO_POR_ACENTO,
  type EstiloCorreo,
  estiloCorreo,
  type PaletaCorreo,
} from "./paleta";

/** Colores de la presentación original (azul en claro, HANDOFF §5c): el correo sin apariencia. */
export const COLORES_CORREO = COLORES_CORREO_POR_ACENTO.claro.azul;

export const ASUNTO_RESTABLECER = "Restablece tu contraseña de KREA";
export const PREHEADER_RESTABLECER =
  "El enlace vence en 1 hora. Si no lo pediste, ignora este correo.";

/**
 * Correo de contacto del liceo para el pie (HANDOFF §9 #5). PLACEHOLDER (CONTENT_CHECKLIST
 * filas 14 y 126): mientras sea `null`, el pie solo remite al profe (un «[correo…]» literal
 * no puede llegar a un alumno).
 */
export const CONTACTO_LICEO: string | null = null;

/** Presentaciones del correo (D341). La galería /correos las muestra todas. */
export const VARIANTES_CORREO = [
  {
    id: "tarjeta",
    nombre: "Tarjeta",
    descripcion:
      "La actual: tarjeta con cabecera de color y pie gris (HANDOFF §5c).",
  },
  {
    id: "banda",
    nombre: "Banda de color",
    descripcion:
      "Cabecera alta llena con el acento y el saludo grande; el cuerpo, en la tarjeta.",
  },
  {
    id: "minimal",
    nombre: "Minimal",
    descripcion:
      "Sin bloques de color: solo tipografía, dos líneas divisorias y el botón.",
  },
  {
    id: "ludica",
    nombre: "Lúdica",
    descripcion:
      "Píldoras de marca con el acento y el splash, y la vigencia del enlace en una píldora.",
  },
] as const;
export type VarianteCorreo = (typeof VARIANTES_CORREO)[number]["id"];

/**
 * La que se envía. PENDIENTE de César (D341): sigue la actual hasta que elija otra en /correos.
 */
export const VARIANTE_CORREO: VarianteCorreo = "tarjeta";

export type DatosRestablecer = {
  /** Primer nombre; vacío → «Hola». */
  nombre: string;
  cedula: string;
  enlace: string;
  /** Acento y tema del perfil (D342); ausente → azul en claro. */
  apariencia?: Partial<Apariencia> | null;
};

/** Escapa lo que va dentro del HTML (el nombre viene del Excel; el enlace lleva `&`). */
export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** «Yeilin Andreína» → «Yeilin». */
export function primerNombre(nombres: string | null | undefined): string {
  return (nombres ?? "").trim().split(/\s+/)[0] ?? "";
}

function saludo(nombre: string): string {
  return nombre ? `Hola, ${nombre}` : "Hola";
}

function pieTexto(): string {
  const base =
    "Recibes este correo porque tienes una cuenta en KREA, el portal de notas de la Escuela Creativa del liceo. ¿Dudas? Escríbele a tu profe";
  return CONTACTO_LICEO ? `${base} o a ${CONTACTO_LICEO}.` : `${base}.`;
}

const FUENTE = "Arial, Helvetica, sans-serif";
const BOTON = "Crear nueva contraseña";

/** Lo que cada presentación necesita, ya escapado. */
type Piezas = {
  c: PaletaCorreo;
  hola: string;
  ci: string;
  enlace: string;
  pie: string;
};

/**
 * Clases que la media query oscura repinta (solo en los clientes que la soportan). Los colores en
 * línea son siempre los del tema elegido: así Gmail, que no lee la media query, respeta el perfil.
 */
function estiloOscuro(estilo: EstiloCorreo): string {
  if (!estilo.conModoOscuro) return "";
  const o = COLORES_CORREO_POR_ACENTO.oscuro[estilo.acento];
  return `@media (prefers-color-scheme: dark) {
.k-fondo { background: ${o.fondo} !important; }
.k-tarjeta { background: ${o.tarjeta} !important; }
.k-pie { background: ${o.pie} !important; }
.k-marca { background: ${o.marca} !important; }
.k-texto { color: ${o.texto} !important; }
.k-texto2 { color: ${o.texto2} !important; }
.k-sobre-marca { color: ${o.sobreMarca} !important; }
.k-enlace { color: ${o.enlace} !important; }
.k-borde { border-color: ${o.borde} !important; }
}`;
}

function documento(
  estilo: EstiloCorreo,
  fondo: { clase: string; color: string },
  cuerpo: string,
) {
  const esquema =
    estilo.tema === "oscuro"
      ? "dark"
      : estilo.conModoOscuro
        ? "light dark"
        : "light";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${esquema}">
<meta name="supported-color-schemes" content="${esquema}">
<title>${escaparHtml(ASUNTO_RESTABLECER)}</title>
<style>
:root { color-scheme: ${esquema}; supported-color-schemes: ${esquema}; }
@media (max-width: 620px) { .k-pad { padding-left: 20px !important; padding-right: 20px !important; } }
${estiloOscuro(estilo)}
</style>
</head>
<body class="${fondo.clase}" style="margin:0;padding:0;background:${fondo.color};">
<div style="display:none;max-height:0;overflow:hidden;">${escaparHtml(PREHEADER_RESTABLECER)}</div>
${cuerpo}
</body>
</html>`;
}

/** Botón «a prueba de balas»: VML para Outlook de escritorio, enlace con relleno para el resto. */
function boton(
  p: Piezas,
  medidas: { alto: number; ancho: number; radio: number; arco: string },
) {
  const { c, enlace } = p;
  return `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${enlace}" style="height:${medidas.alto}px;v-text-anchor:middle;width:${medidas.ancho}px;" arcsize="${medidas.arco}" stroke="f" fillcolor="${c.marca}"><center style="color:${c.sobreMarca};font:700 16px ${FUENTE};">${BOTON}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a class="k-marca k-sobre-marca" href="${enlace}" style="display:inline-block;height:${medidas.alto}px;padding:0 28px;border-radius:${medidas.radio}px;background:${c.marca};color:${c.sobreMarca};font:700 16px/${medidas.alto}px ${FUENTE};text-decoration:none;">${BOTON}</a><!--<![endif]-->`;
}

function enlaceAlternativo(p: Piezas) {
  const { c, enlace } = p;
  return `<p class="k-texto2" style="margin:24px 0 4px;font:400 14px/20px ${FUENTE};color:${c.texto2};">¿El botón no funciona? Copia este enlace en tu navegador:</p>
<p style="margin:0;font:400 14px/20px ${FUENTE};word-break:break-all;"><a class="k-enlace" href="${enlace}" style="color:${c.enlace};text-decoration:underline;">${enlace}</a></p>`;
}

function siNoLoPediste(p: Piezas) {
  return `<p class="k-texto2" style="margin:24px 0 0;font:400 14px/20px ${FUENTE};color:${p.c.texto2};">Si no pediste el cambio, ignora este correo: tu contraseña sigue igual.</p>`;
}

function explicacion(p: Piezas, margen = "0 0 24px") {
  return `<p class="k-texto" style="margin:${margen};font:400 16px/24px ${FUENTE};color:${p.c.texto};">Recibimos un pedido para cambiar la contraseña de tu cuenta de KREA (C.I. ${p.ci}). Toca el botón para crear una nueva. El enlace vence en <b>1 hora</b> y sirve una sola vez.</p>`;
}

function pie(p: Piezas) {
  return `<p class="k-texto2" style="margin:0;font:400 13px/18px ${FUENTE};color:${p.c.texto2};">${p.pie}</p>`;
}

/* ---------- Presentaciones ---------- */

/** «Tarjeta»: la original de HANDOFF §5c, ahora con los colores del perfil. */
function tarjeta(p: Piezas) {
  const { c } = p;
  return `<table class="k-fondo" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.fondo};padding:24px 0;">
<tr><td align="center">
<table class="k-tarjeta" role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${c.tarjeta};border-radius:16px;overflow:hidden;font-family:${FUENTE};">
<tr><td class="k-marca k-pad" style="background:${c.marca};padding:24px 32px;">
<p class="k-sobre-marca" style="margin:0;font:700 22px/28px ${FUENTE};color:${c.sobreMarca};">KREA · Escuela Creativa</p>
</td></tr>
<tr><td class="k-pad" style="padding:32px;">
<h1 class="k-texto" style="margin:0 0 16px;font:700 24px/32px ${FUENTE};color:${c.texto};">${p.hola}</h1>
${explicacion(p)}
${boton(p, { alto: 48, ancho: 260, radio: 12, arco: "25%" })}
${enlaceAlternativo(p)}
${siNoLoPediste(p)}
</td></tr>
<tr><td class="k-pie k-pad" style="background:${c.pie};padding:20px 32px;">
${pie(p)}
</td></tr>
</table>
</td></tr>
</table>`;
}

/** «Banda de color»: cabecera alta con el acento lleno y el saludo grande en ella. */
function banda(p: Piezas) {
  const { c } = p;
  return `<table class="k-fondo" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.fondo};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${FUENTE};">
<tr><td class="k-marca k-pad" style="background:${c.marca};padding:40px 40px 36px;border-radius:20px 20px 0 0;">
<p class="k-sobre-marca" style="margin:0 0 20px;font:700 13px/16px ${FUENTE};letter-spacing:2px;text-transform:uppercase;color:${c.sobreMarca};">KREA · Escuela Creativa</p>
<h1 class="k-sobre-marca" style="margin:0;font:700 32px/40px ${FUENTE};color:${c.sobreMarca};">${p.hola}</h1>
</td></tr>
<tr><td class="k-tarjeta k-pad" style="background:${c.tarjeta};padding:32px 40px 36px;">
${explicacion(p, "0 0 28px")}
${boton(p, { alto: 52, ancho: 280, radio: 14, arco: "27%" })}
${enlaceAlternativo(p)}
${siNoLoPediste(p)}
</td></tr>
<tr><td class="k-pie k-pad" style="background:${c.pie};padding:20px 40px;border-radius:0 0 20px 20px;">
${pie(p)}
</td></tr>
</table>
</td></tr>
</table>`;
}

/** «Minimal»: un solo fondo (la tarjeta), la marca en color de texto, dos líneas y el botón. */
function minimal(p: Piezas) {
  const { c } = p;
  const linea = `<div class="k-borde" style="border-top:1px solid ${c.borde};font-size:0;line-height:0;">&nbsp;</div>`;
  return `<table class="k-tarjeta" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.tarjeta};">
<tr><td align="center" style="padding:32px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${FUENTE};">
<tr><td class="k-pad" style="padding:0 40px;">
<p class="k-enlace" style="margin:0;font:700 20px/24px ${FUENTE};letter-spacing:1px;color:${c.enlace};">KREA</p>
</td></tr>
<tr><td class="k-pad" style="padding:24px 40px 0;">${linea}</td></tr>
<tr><td class="k-pad" style="padding:32px 40px;">
<h1 class="k-texto" style="margin:0 0 16px;font:700 26px/34px ${FUENTE};color:${c.texto};">${p.hola}</h1>
${explicacion(p)}
${boton(p, { alto: 48, ancho: 260, radio: 8, arco: "17%" })}
${enlaceAlternativo(p)}
${siNoLoPediste(p)}
</td></tr>
<tr><td class="k-pad" style="padding:0 40px;">${linea}</td></tr>
<tr><td class="k-pad" style="padding:20px 40px 0;">
${pie(p)}
</td></tr>
</table>
</td></tr>
</table>`;
}

/** «Lúdica»: píldoras de marca (acento y splash, como el logo) y la vigencia en una píldora. */
function ludica(p: Piezas) {
  const { c } = p;
  const punto = (color: string, lado: number, clase: string) =>
    `<td class="${clase}" width="${lado}" height="${lado}" style="width:${lado}px;height:${lado}px;background:${color};border-radius:${lado}px;font-size:0;line-height:0;">&nbsp;</td>`;
  const hueco = (ancho: number) =>
    `<td width="${ancho}" style="width:${ancho}px;font-size:0;line-height:0;">&nbsp;</td>`;
  return `<table class="k-fondo" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.fondo};padding:24px 0;">
<tr><td align="center">
<table class="k-tarjeta" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${c.tarjeta};border-radius:28px;overflow:hidden;font-family:${FUENTE};">
<tr><td class="k-pad" style="padding:32px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="k-marca k-sobre-marca" style="background:${c.marca};color:${c.sobreMarca};border-radius:999px;padding:8px 18px;font:700 16px/20px ${FUENTE};letter-spacing:1px;">KREA</td>
${hueco(10)}
${punto(c.splash, 20, "k-splash")}
${hueco(8)}
${punto(c.marca, 12, "k-marca")}
</tr></table>
</td></tr>
<tr><td class="k-pad" style="padding:28px 40px 32px;">
<h1 class="k-texto" style="margin:0 0 4px;font:700 30px/38px ${FUENTE};color:${c.texto};">${p.hola}</h1>
<p class="k-enlace" style="margin:0 0 20px;font:700 14px/20px ${FUENTE};color:${c.enlace};">Escuela Creativa</p>
${explicacion(p, "0 0 20px")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr>
<td style="background:${c.splash};color:${c.sobreSplash};border-radius:999px;padding:6px 14px;font:700 14px/18px ${FUENTE};white-space:nowrap;">1 hora</td>
<td class="k-texto2" style="padding-left:10px;font:400 14px/18px ${FUENTE};color:${c.texto2};">para usar el enlace, una sola vez</td>
</tr></table>
${boton(p, { alto: 52, ancho: 280, radio: 26, arco: "50%" })}
${enlaceAlternativo(p)}
${siNoLoPediste(p)}
</td></tr>
<tr><td class="k-pie k-pad" style="background:${c.pie};padding:20px 40px;">
${pie(p)}
</td></tr>
</table>
</td></tr>
</table>`;
}

const PRESENTACIONES: Record<VarianteCorreo, (p: Piezas) => string> = {
  tarjeta,
  banda,
  minimal,
  ludica,
};

export function correoRestablecer(
  datos: DatosRestablecer,
  variante: VarianteCorreo = VARIANTE_CORREO,
  /**
   * `false` quita la media query oscura: la galería /correos la apaga para que la columna «Claro»
   * no cambie con el tema del sistema de quien mira (la versión oscura ya tiene su columna).
   */
  opciones: { modoOscuroDelCliente?: boolean } = {},
): {
  asunto: string;
  html: string;
  texto: string;
} {
  const base = estiloCorreo(datos.apariencia);
  const estilo: EstiloCorreo =
    opciones.modoOscuroDelCliente === false
      ? { ...base, conModoOscuro: false }
      : base;
  const c = COLORES_CORREO_POR_ACENTO[estilo.tema][estilo.acento];
  const ci = maskCedula(datos.cedula);
  const hola = saludo(datos.nombre);

  const texto = [
    hola,
    "",
    `Recibimos un pedido para cambiar la contraseña de tu cuenta de KREA (C.I. ${ci}). Abre este enlace para crear una nueva. El enlace vence en 1 hora y sirve una sola vez:`,
    "",
    datos.enlace,
    "",
    "Si no pediste el cambio, ignora este correo: tu contraseña sigue igual.",
    "",
    "—",
    pieTexto(),
  ].join("\n");

  const piezas: Piezas = {
    c,
    hola: escaparHtml(hola),
    ci,
    enlace: escaparHtml(datos.enlace),
    pie: escaparHtml(pieTexto()),
  };
  // Minimal no tiene tarjeta: todo el correo va sobre la superficie.
  const fondo =
    variante === "minimal"
      ? { clase: "k-tarjeta", color: c.tarjeta }
      : { clase: "k-fondo", color: c.fondo };
  const html = documento(estilo, fondo, PRESENTACIONES[variante](piezas));

  return { asunto: ASUNTO_RESTABLECER, html, texto };
}
