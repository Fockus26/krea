// Colores del correo por acento y tema del alumno (D342). Un cliente de correo no lee las variables
// CSS ni `data-accent`: cada valor es el hex fijo del token de app/globals.css (bloques claro,
// `[data-accent=…]` y `[data-theme="dark"]…`, D001, D301). Si los tokens cambian, esta tabla se
// actualiza a mano; tests/unit/correo-variantes.test.ts comprueba el contraste de cada par.
import type { Apariencia } from "@/lib/modelo";

export const ACENTOS_CORREO = ["azul", "rojo", "verde", "morado"] as const;
export type AcentoCorreo = (typeof ACENTOS_CORREO)[number];

export const TEMAS_CORREO = ["claro", "oscuro"] as const;
export type TemaCorreo = (typeof TEMAS_CORREO)[number];

export type PaletaCorreo = {
  /** `--bg`: fondo exterior. */
  fondo: string;
  /** `--surface`: tarjeta. */
  tarjeta: string;
  /** `--surface-2`: pie. */
  pie: string;
  /** `--divider`. */
  borde: string;
  /** `--text`. */
  texto: string;
  /** `--text-2`. */
  texto2: string;
  /** `--accent`: relleno del botón y de la banda. */
  marca: string;
  /** `--on-accent`: texto sobre `marca`. */
  sobreMarca: string;
  /** `--accent-ink`: enlaces y titulares en color sobre `tarjeta`, `fondo` y `pie`. */
  enlace: string;
  /** `--splash`: segunda capa del logo; solo decoración y píldoras con `sobreSplash`. */
  splash: string;
  /** Tinta de la píldora de `splash` (`--text` claro: el splash es claro en los dos temas). */
  sobreSplash: string;
};

const NEUTROS: Record<
  TemaCorreo,
  Pick<
    PaletaCorreo,
    "fondo" | "tarjeta" | "pie" | "borde" | "texto" | "texto2" | "sobreSplash"
  >
> = {
  claro: {
    fondo: "#F6F4FA",
    tarjeta: "#FFFFFF",
    pie: "#F0EDF6",
    borde: "#E6E2EE",
    texto: "#221D2B",
    texto2: "#5E5869",
    sobreSplash: "#221D2B",
  },
  oscuro: {
    fondo: "#14121A",
    tarjeta: "#1E1B26",
    pie: "#26222F",
    borde: "#2E2A38",
    texto: "#F4F1F8",
    texto2: "#ABA5B8",
    sobreSplash: "#221D2B",
  },
};

type DeAcento = Pick<
  PaletaCorreo,
  "marca" | "sobreMarca" | "enlace" | "splash"
>;

const DE_ACENTO: Record<TemaCorreo, Record<AcentoCorreo, DeAcento>> = {
  claro: {
    azul: {
      marca: "#295AC3",
      sobreMarca: "#FFFFFF",
      enlace: "#295AC3",
      splash: "#00E5F5",
    },
    rojo: {
      marca: "#EE0400",
      sobreMarca: "#FFFFFF",
      enlace: "#C80300",
      splash: "#FFC23D",
    },
    verde: {
      marca: "#115445",
      sobreMarca: "#FFFFFF",
      enlace: "#115445",
      splash: "#A0F25A",
    },
    morado: {
      marca: "#734AD1",
      sobreMarca: "#FFFFFF",
      enlace: "#734AD1",
      splash: "#FF8AD8",
    },
  },
  oscuro: {
    azul: {
      marca: "#5773AF",
      sobreMarca: "#FFFFFF",
      enlace: "#7AA2F7",
      splash: "#00E5F5",
    },
    rojo: {
      marca: "#BF5046",
      sobreMarca: "#FFFFFF",
      enlace: "#FF6B5E",
      splash: "#FFC23D",
    },
    verde: {
      marca: "#34816E",
      sobreMarca: "#FFFFFF",
      enlace: "#4FC4A6",
      splash: "#A0F25A",
    },
    morado: {
      marca: "#7D67B2",
      sobreMarca: "#FFFFFF",
      enlace: "#A98BF0",
      splash: "#FF8AD8",
    },
  },
};

/** Tabla completa tema × acento (la galería /correos y las pruebas la recorren). */
export const COLORES_CORREO_POR_ACENTO: Record<
  TemaCorreo,
  Record<AcentoCorreo, PaletaCorreo>
> = {
  claro: paletas("claro"),
  oscuro: paletas("oscuro"),
};

function paletas(tema: TemaCorreo): Record<AcentoCorreo, PaletaCorreo> {
  return Object.fromEntries(
    ACENTOS_CORREO.map((a) => [a, { ...NEUTROS[tema], ...DE_ACENTO[tema][a] }]),
  ) as Record<AcentoCorreo, PaletaCorreo>;
}

export type EstiloCorreo = {
  acento: AcentoCorreo;
  tema: TemaCorreo;
  /**
   * `true` cuando el alumno no fijó el oscuro (claro, sistema o sin apariencia): el HTML lleva la
   * media query `prefers-color-scheme: dark` para los clientes que la respetan (Apple Mail,
   * Outlook moderno). Gmail la ignora: por eso el oscuro elegido va en colores fijos.
   */
  conModoOscuro: boolean;
};

/**
 * Apariencia guardada en el perfil → estilo del correo. Sin acento → azul; `system` o sin tema →
 * claro (el servidor no sabe qué tema tiene el dispositivo que abrirá el correo).
 */
export function estiloCorreo(
  apariencia: Partial<Apariencia> | null | undefined,
): EstiloCorreo {
  const acento = ACENTOS_CORREO.includes(apariencia?.acento as AcentoCorreo)
    ? (apariencia?.acento as AcentoCorreo)
    : "azul";
  const tema: TemaCorreo = apariencia?.tema === "dark" ? "oscuro" : "claro";
  return { acento, tema, conModoOscuro: tema === "claro" };
}
