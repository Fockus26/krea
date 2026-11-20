"use client";

import { Nunito_Sans, Poppins } from "next/font/google";
import { useEffect } from "react";
import {
  Pantalla500,
  PantallaSinConexion,
} from "@/components/estados/pantallas";
import { useEnLinea } from "@/components/krea/use-en-linea";
import { codigoError, digestDe } from "@/lib/estados";
import { recargarSiEsDeploy } from "@/lib/recarga-deploy";
import { THEME_SCRIPT } from "@/lib/site";
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

/**
 * Error del layout raíz (HANDOFF §5b, D161): reemplaza todo el documento, así que trae su
 * `<html>`/`<body>`, los estilos, las fuentes y el tema (mismo anti-parpadeo, D015). Sin sesión (no hay layout que la dé).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const enLinea = useEnLinea();

  useEffect(() => {
    console.error(error);
    // Build desfasado tras un deploy: UNA recarga completa (D438)
    recargarSiEsDeploy(error);
  }, [error]);

  return (
    <html
      lang="es-VE"
      className={`${poppins.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <title>Algo se nos rompió · KREA</title>
        <meta name="robots" content="noindex" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constante estática, sin datos del usuario */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {enLinea ? (
          <Pantalla500
            codigo={codigoError(500, digestDe(error))}
            onRetry={retry}
          />
        ) : (
          <PantallaSinConexion onRetry={retry} />
        )}
      </body>
    </html>
  );
}
