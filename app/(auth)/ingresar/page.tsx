import type { Metadata } from "next";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { Ingresar } from "@/components/sections/auth/ingresar";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// PROVISIONAL (CONTENT_CHECKLIST fila 98): título y descripción de la única página indexable.
const TITULO = "Ingresar";
const DESCRIPCION =
  "Entra al portal de notas de la Escuela Creativa con tu cédula y tu contraseña.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/ingresar" },
  openGraph: { title: `${TITULO} · ${SITE_NAME}`, description: DESCRIPCION },
  twitter: { title: `${TITULO} · ${SITE_NAME}`, description: DESCRIPCION },
};

// JSON-LD mínimo (seo, modo página): solo lo que la página dice. Sin SearchAction ni Organization
// inventados. `<` escapado para que ningún texto cierre el <script>.
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `${TITULO} · ${SITE_NAME}`,
  description: DESCRIPCION,
  url: new URL("/ingresar", SITE_URL).toString(),
  inLanguage: "es-VE",
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL.toString() },
}).replace(/</g, "\\u003c");

/**
 * Ingresar (HANDOFF §3). Entra con Firebase Auth y la cookie de sesión (D180). Los
 * errores de servidor (credenciales, bloqueado) no son rutas: se ven en /secciones/ingresar/*.
 */
export default function IngresarPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON.stringify de constantes, con "<" escapado
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <AuthLayout>
        <Ingresar recuperarHref="/recuperar" />
      </AuthLayout>
    </>
  );
}
