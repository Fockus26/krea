import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardList, CardListItem } from "@/components/ui/card";
import { Apariencia } from "./_vista/apariencia";

// Índice interno de las vistas previas de secciones (fase 04, D066). No se indexa.
// Cada unidad de la fase añade su pantalla a PANTALLAS (una línea).
export const metadata: Metadata = {
  title: "Secciones",
  robots: { index: false, follow: false },
};

const PANTALLAS: ReadonlyArray<{ href: string; titulo: string; ruta: string }> =
  [];

export default function SeccionesPage() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="container-reading page-pad page-stack"
    >
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-text-2">Referencia interna · fase 04</p>
        <h1 className="text-h1 text-text">Secciones</h1>
        <p className="text-body text-text-2">
          Cada pantalla montada con sus secciones y datos de ejemplo del seed.
          Revisa los 4 acentos en claro y oscuro (D001); el cambio se guarda en
          este navegador.
        </p>
      </header>
      <Card>
        <Apariencia />
      </Card>
      <Card>
        <h2 className="text-h2 mb-3 text-text">Pantallas</h2>
        {PANTALLAS.length === 0 ? (
          <p className="text-body text-text-2">
            Todavía no hay pantallas montadas.
          </p>
        ) : (
          <CardList>
            {PANTALLAS.map((p) => (
              <CardListItem key={p.href} asChild>
                <Link href={p.href} className="justify-between">
                  <span className="text-h4">{p.titulo}</span>
                  <span className="text-small nums text-text-2">{p.ruta}</span>
                </Link>
              </CardListItem>
            ))}
          </CardList>
        )}
      </Card>
    </main>
  );
}
