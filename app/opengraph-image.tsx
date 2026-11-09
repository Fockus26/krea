import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GRADE_SOMBRA } from "@/lib/grades";
import {
  BRAND_BG,
  BRAND_BLUE,
  OG_COLORS,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/site";

// Plantilla HANDOFF §5 (1200 × 630). Imagen única, sin OG por página en v1.
export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { SPLASH, INK, MUTED, GRADE_INK, PILL_HIGH, PILL_LOW, PILL_MID } =
  OG_COLORS;

const FETCH_TIMEOUT_MS = 20_000;

// Google Fonts sin User-Agent responde con TTF (satori no lee woff2). Se descargan
// al construir la imagen; si falla la red el build no se rompe y cae a la fuente por defecto.
async function loadGoogleFont(family: string, weight: number) {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
      )
    ).text();
    const url = css.match(
      /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/,
    )?.[1];
    if (!url) return null;
    return await (
      await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    ).arrayBuffer();
  } catch {
    return null;
  }
}

async function loadLogoDataUri() {
  const svg = (
    await readFile(join(process.cwd(), "public/brand/krea-logo.svg"), "utf8")
  )
    .replace(/var\(--krea-logo-ink, (#[0-9a-f]{6})\)/i, BRAND_BLUE)
    .replace(/var\(--krea-logo-splash, (#[0-9a-f]{6})\)/i, SPLASH);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const pill = (
  bg: string,
  height: number,
  minWidth: number,
  fontSize: number,
  text: string,
) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height,
      minWidth,
      padding: "0 10px",
      borderRadius: 999,
      background: bg,
      color: GRADE_INK,
      textShadow: GRADE_SOMBRA,
      fontFamily: "Poppins",
      fontWeight: 700,
      fontSize,
    }}
  >
    {text}
  </div>
);

// Perezoso y en memoria: un await en el módulo bloquea el build (los workers
// de exportación se quedan colgados) y la imagen es dinámica.
let assets:
  | Promise<[ArrayBuffer | null, ArrayBuffer | null, string]>
  | undefined;
function loadAssets() {
  assets ??= Promise.all([
    loadGoogleFont("Poppins", 700),
    loadGoogleFont("Nunito Sans", 600),
    loadLogoDataUri(),
  ]);
  return assets;
}

export default async function Image() {
  const [poppins, nunito, logo] = await loadAssets();
  const fonts = [
    poppins && {
      name: "Poppins",
      data: poppins,
      weight: 700 as const,
      style: "normal" as const,
    },
    nunito && {
      name: "Nunito Sans",
      data: nunito,
      weight: 600 as const,
      style: "normal" as const,
    },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: BRAND_BG,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -160,
          width: 560,
          height: 560,
          borderRadius: 999,
          background: BRAND_BLUE,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 300,
          top: 60,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: SPLASH,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 250,
          top: 140,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: SPLASH,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          width: 640,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse (satori) no usa next/image */}
        <img src={logo} width={300} height={165} alt="" />
        <div
          style={{
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: 52,
            lineHeight: "60px",
            letterSpacing: "-0.01em",
            color: INK,
          }}
        >
          Tus notas, tu equipo y el ranking en vivo.
        </div>
        <div
          style={{
            fontFamily: "Nunito Sans",
            fontWeight: 600,
            fontSize: 24,
            lineHeight: "32px",
            color: MUTED,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 80,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "flex-end",
        }}
      >
        {pill(PILL_HIGH, 72, 132, 40, "18,5")}
        {pill(PILL_LOW, 56, 104, 30, "10")}
        {pill(PILL_MID, 56, 104, 30, "15")}
      </div>
    </div>,
    { ...size, fonts },
  );
}
