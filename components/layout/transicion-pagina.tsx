import { type ReactNode, ViewTransition } from "react";
import type { TipoTransicion } from "@/lib/transicion";

/*
 * Transición entre páginas (D278): View Transition de React alrededor del contenido de cada
 * página, puesta en los `template.tsx` de los grupos. No va en el layout: el layout persiste y
 * sus hijos nunca «entran» ni «salen»; el template vive dentro del `<Activity>` de cada segmento
 * (Next oculta las páginas vistas en vez de desmontarlas), y mostrar u ocultar ese Activity es
 * la entrada y la salida que anima React.
 *  - `pestana` (template del grupo): el tipo del `<Link>` de la barra decide el lado
 *    (`tipoTransicion`, lib/transicion.ts); sin tipo, fundido.
 *  - `detalle` (template de una sección con subpáginas): siempre fundido.
 * Las actualizaciones dentro de la misma página (`refresh()`, filtros por la URL) no animan
 * (`default="none"`). Los nombres de clase son los de `globals.css` › «Transición entre páginas».
 */
const POR_TIPO: Record<TipoTransicion | "default", string> = {
  "desliz-der": "pagina-desliz-der",
  "desliz-izq": "pagina-desliz-izq",
  default: "pagina-fundido",
};

export function TransicionPagina({
  nivel,
  children,
}: {
  nivel: "pestana" | "detalle";
  children: ReactNode;
}) {
  const clase = nivel === "pestana" ? POR_TIPO : "pagina-fundido";
  return (
    <ViewTransition enter={clase} exit={clase} default="none">
      {children}
    </ViewTransition>
  );
}
