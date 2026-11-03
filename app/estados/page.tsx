import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { CargaInicio, CargaPanel } from "@/components/estados/cargas";
import {
  Pantalla500,
  PantallaNotFound,
  PantallaSinConexion,
} from "@/components/estados/pantallas";
import {
  galeriaEstadosVisible,
  PANTALLAS_ESTADO,
  type PantallaEstado,
  pantallaDe,
} from "@/lib/estados";
import { mainClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { GaleriaBanner } from "./galeria-banner";

export const metadata: Metadata = {
  title: "Pantallas de estado",
  robots: { index: false, follow: false },
};

/** PLACEHOLDER: código de ejemplo del handoff (§5b; CONTENT_CHECKLIST fila 113). */
const CODIGO_EJEMPLO = "KR-500-7F3A9C";

function Pantalla({ id }: { id: PantallaEstado }) {
  switch (id) {
    case "404-estudiante":
      return <PantallaNotFound sesion="estudiante" />;
    case "404-profesor":
      return <PantallaNotFound sesion="profesor" />;
    case "404-sin-sesion":
      return <PantallaNotFound sesion={null} />;
    case "500-codigo":
      return <Pantalla500 sesion="estudiante" codigo={CODIGO_EJEMPLO} />;
    case "500-sin-codigo":
      return <Pantalla500 sesion="estudiante" codigo={null} />;
    case "sin-conexion":
      return <PantallaSinConexion sesion="estudiante" />;
    case "sin-conexion-hora": {
      const hora = new Date();
      hora.setHours(16, 20, 0, 0);
      return (
        <PantallaSinConexion sesion="estudiante" ultimaActualizacion={hora} />
      );
    }
    case "banner-sin-conexion":
      return <GaleriaBanner />;
    case "carga-estudiante":
      return (
        <GaleriaCarga titulo="Carga · estudiante (Inicio)">
          <CargaInicio />
        </GaleriaCarga>
      );
    case "carga-profesor":
      return (
        <GaleriaCarga titulo="Carga · profesor (Panel)">
          <CargaPanel />
        </GaleriaCarga>
      );
  }
}

/** Carga fuera del shell: título visible (la página real lo da el `h1` de la página al terminar). */
function GaleriaCarga({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <main id="contenido" tabIndex={-1} className={mainClass("estudiante")}>
      <h1 className="text-h4 text-text-2">{titulo}</h1>
      {children}
    </main>
  );
}

async function Galeria({ searchParams }: PageProps<"/estados">) {
  const actual = pantallaDe((await searchParams).screen);
  return (
    <>
      <nav
        aria-label="Pantallas de estado"
        className="flex shrink-0 flex-wrap gap-2 border-b border-divider bg-surface px-5 py-3 md:px-6"
      >
        {PANTALLAS_ESTADO.map((p) => (
          <Link
            key={p.id}
            href={`/estados?screen=${p.id}`}
            aria-current={p.id === actual ? "page" : undefined}
            className={cn(
              "rounded-pill px-3 py-1 text-small-b text-text-2",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "hover:bg-accent-soft aria-[current=page]:bg-accent-soft-2 aria-[current=page]:text-text",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <Pantalla id={actual} />
    </>
  );
}

/**
 * Galería de pantallas de estado `/estados?screen=…` (fase 06, D162): para revisarlas y que el
 * QA de diseño las audite. Solo en desarrollo y en las vistas previas de Vercel; en producción, 404.
 */
export default function EstadosPage(props: PageProps<"/estados">) {
  if (!galeriaEstadosVisible(process.env)) notFound();
  return (
    <Suspense>
      <Galeria {...props} />
    </Suspense>
  );
}
