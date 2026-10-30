import type { Metadata } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
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

// Título provisional; metadata/SEO completos son de la fase 02.
export const metadata: Metadata = {
  title: "KREA",
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
