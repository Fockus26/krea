import { ExternalLink } from "lucide-react";
import { hrefSeguro } from "@/lib/url-respuesta";

const CAJA =
  "block min-w-0 rounded-nav bg-surface-2 px-3.5 py-3 text-callout break-all";

/**
 * Respuesta de enlace (D470): enlace externo en pestaña nueva, con la URL como texto (se parte en
 * cualquier punto para no desbordar a 320 px). La caja entera es el enlace (≥ 44 px de alto).
 * Antes del `href` se vuelve a validar: si no pasa (`javascript:`, credenciales…), se muestra como
 * texto plano, sin enlace.
 */
export function RespuestaEnlace({ url }: { url: string }) {
  const href = hrefSeguro(url);
  if (!href) return <p className={`${CAJA} m-0 text-text`}>{url}</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${CAJA} text-accent-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
    >
      {url}
      <ExternalLink
        aria-hidden="true"
        className="ml-1 inline size-4 align-text-bottom"
      />
      {/* PROVISIONAL (CONTENT_CHECKLIST fila 274) */}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}
