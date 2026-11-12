import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
import { BarraTema } from "@/components/layout/barra-tema";
import { RegistroServiceWorker } from "@/components/offline/registro-sw";
import { INSTALAR_SCRIPT } from "@/lib/instalar-pwa";
import {
  BRAND_BLUE,
  BRAND_BLUE_DARK,
  OPEN_GRAPH_BASE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_SCRIPT,
  TWITTER_BASE,
} from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION, // provisional (CONTENT_CHECKLIST fila 22)
  applicationName: SITE_NAME,
  openGraph: {
    ...OPEN_GRAPH_BASE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    ...TWITTER_BASE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

// themeColor: primer color de la barra (azul de marca en claro y en oscuro); `BarraTema` lo cambia
// por el --accent elegido en los dos temas (D358).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_BLUE },
    { media: "(prefers-color-scheme: dark)", color: BRAND_BLUE_DARK },
  ],
  colorScheme: "light dark",
  viewportFit: "cover", // la barra inferior usa safe-area-inset-bottom
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-VE"
      className={`${poppins.variable} ${nunito.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante estática, sin datos del usuario */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante estática, sin datos del usuario (D371) */}
        <script dangerouslySetInnerHTML={{ __html: INSTALAR_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Primer foco del documento (provisional, fila 19 del checklist) */}
        <a href="#contenido" className="skip-link text-label">
          Saltar al contenido
        </a>
        {children}
        <RegistroServiceWorker />
        <BarraTema />
      </body>
    </html>
  );
}
