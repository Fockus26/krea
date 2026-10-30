import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
import {
  BRAND_BG_DARK,
  BRAND_BLUE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
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
    type: "website",
    locale: "es_VE",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

// themeColor: azul de marca en claro (HANDOFF §5); en oscuro, el --bg oscuro de globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_BLUE },
    { media: "(prefers-color-scheme: dark)", color: BRAND_BG_DARK },
  ],
  colorScheme: "light dark",
  viewportFit: "cover", // la barra inferior usa safe-area-inset-bottom
};

// Anti-parpadeo (D015): aplica tema y acento guardados antes del primer pintado.
// "system" (o sin valor) = sin data-theme; el CSS sigue prefers-color-scheme.
const themeScript = `(function(){try{var d=document.documentElement,s=localStorage,t=s.getItem("krea-theme"),a=s.getItem("krea-accent");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(a==="rojo"||a==="verde"||a==="morado"||a==="azul")d.setAttribute("data-accent",a)}catch(e){}})()`;

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Primer foco del documento (provisional, fila 19 del checklist) */}
        <a href="#contenido" className="skip-link text-label">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
