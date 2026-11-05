// Correo «Restablecer contraseña» (HANDOFF §5c, lienzo design/canvas/Correo.dc.html): asunto,
// HTML de una columna y texto plano. Puro. Solo lleva el primer nombre, la cédula enmascarada y
// el enlace: nada más del alumno.
import { maskCedula } from "@/lib/mask";

/** Colores fijos del correo (HANDOFF §5c): un cliente de correo no conoce los tokens ni el acento. */
export const COLORES_CORREO = {
  fondo: "#F6F4FA",
  tarjeta: "#FFFFFF",
  marca: "#295AC3",
  sobreMarca: "#FFFFFF",
  texto: "#221D2B",
  texto2: "#5E5869",
  pie: "#F0EDF6",
} as const;

export const ASUNTO_RESTABLECER = "Restablece tu contraseña de KREA";
export const PREHEADER_RESTABLECER =
  "El enlace vence en 1 hora. Si no lo pediste, ignora este correo.";

/**
 * Correo de contacto del liceo para el pie (HANDOFF §9 #5). PLACEHOLDER (CONTENT_CHECKLIST
 * filas 14 y 126): mientras sea `null`, el pie solo remite al profe (un «[correo…]» literal
 * no puede llegar a un alumno).
 */
export const CONTACTO_LICEO: string | null = null;

export type DatosRestablecer = {
  /** Primer nombre; vacío → «Hola». */
  nombre: string;
  cedula: string;
  enlace: string;
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

export function correoRestablecer(datos: DatosRestablecer): {
  asunto: string;
  html: string;
  texto: string;
} {
  const c = COLORES_CORREO;
  const ci = maskCedula(datos.cedula);
  const hola = saludo(datos.nombre);
  const enlace = escaparHtml(datos.enlace);
  const fuente = "Arial, Helvetica, sans-serif";

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

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escaparHtml(ASUNTO_RESTABLECER)}</title>
</head>
<body style="margin:0;padding:0;background:${c.fondo};">
<div style="display:none;max-height:0;overflow:hidden;">${escaparHtml(PREHEADER_RESTABLECER)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.fondo};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${c.tarjeta};border-radius:16px;overflow:hidden;font-family:${fuente};">
<tr><td style="background:${c.marca};padding:24px 32px;">
<p style="margin:0;font:700 22px/28px ${fuente};color:${c.sobreMarca};">KREA · Escuela Creativa</p>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font:700 24px/32px ${fuente};color:${c.texto};">${escaparHtml(hola)}</h1>
<p style="margin:0 0 24px;font:400 16px/24px ${fuente};color:${c.texto};">Recibimos un pedido para cambiar la contraseña de tu cuenta de KREA (C.I. ${ci}). Toca el botón para crear una nueva. El enlace vence en <b>1 hora</b> y sirve una sola vez.</p>
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${enlace}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="25%" stroke="f" fillcolor="${c.marca}"><center style="color:${c.sobreMarca};font:700 16px ${fuente};">Crear nueva contraseña</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${enlace}" style="display:inline-block;height:48px;padding:0 28px;border-radius:12px;background:${c.marca};color:${c.sobreMarca};font:700 16px/48px ${fuente};text-decoration:none;">Crear nueva contraseña</a><!--<![endif]-->
<p style="margin:24px 0 4px;font:400 14px/20px ${fuente};color:${c.texto2};">¿El botón no funciona? Copia este enlace en tu navegador:</p>
<p style="margin:0;font:400 14px/20px ${fuente};word-break:break-all;"><a href="${enlace}" style="color:${c.marca};text-decoration:underline;">${enlace}</a></p>
<p style="margin:24px 0 0;font:400 14px/20px ${fuente};color:${c.texto2};">Si no pediste el cambio, ignora este correo: tu contraseña sigue igual.</p>
</td></tr>
<tr><td style="background:${c.pie};padding:20px 32px;">
<p style="margin:0;font:400 13px/18px ${fuente};color:${c.texto2};">${escaparHtml(pieTexto())}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { asunto: ASUNTO_RESTABLECER, html, texto };
}
