import { User, Users } from "lucide-react";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  eyebrowRanking,
  type RolRanking,
  type SeccionRanking,
  type Vista,
} from "@/lib/ranking-vista";
import { cn } from "@/lib/utils";
import { SegmentedLinks } from "./segmented-links";

/*
 * Chip «En vivo» (HANDOFF §3): visible desde 1024; en móvil vive en la topbar. El texto lo dice
 * (el punto es decorativo y la onda, `animate-live`, se apaga con reduced motion).
 */
export function LiveChip({ className }: { className?: string }) {
  return (
    <span
      data-slot="live-chip"
      className={cn(
        "text-small-b inline-flex h-7 items-center gap-2 rounded-pill bg-chip-ok pr-2.5 pl-2 text-success",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative size-2.5 rounded-pill bg-success"
      >
        <span className="animate-live absolute inset-0 rounded-pill bg-success" />
      </span>
      En vivo
    </span>
  );
}

type Enlaces = {
  /** Ruta de cada pestaña (mismos filtros de sección/rol que la actual). */
  vista: Record<Vista, string>;
  /** Solo el profesor: ruta de cada sección con la misma pestaña. */
  seccion?: Record<SeccionRanking, string>;
};

/**
 * Encabezado del Ranking (HANDOFF §3 Ranking §1): eyebrow «Sección 5A · 35 estudiantes», h1
 * «Ranking» con el chip «En vivo», segmentado Estudiantes/Equipos a la derecha (envuelve) y, con
 * `rol="profesor"`, el segmentado 5A/5C antes de las pestañas. Los segmentados son enlaces (D095).
 */
export function RankingHeader({
  rol,
  seccion,
  vista,
  cantidad,
  enlaces,
}: {
  rol: RolRanking;
  seccion: SeccionRanking;
  vista: Vista;
  /** Estudiantes o equipos de la sección, según `vista`. */
  cantidad: number;
  enlaces: Enlaces;
}) {
  return (
    <PageHeader
      eyebrow={eyebrowRanking(seccion, cantidad, vista)}
      title="Ranking"
      adornment={<LiveChip className="max-lg:hidden" />}
      actions={
        <>
          {rol === "profesor" && enlaces.seccion ? (
            <SegmentedLinks
              label="Sección"
              actual={seccion}
              opciones={[
                { clave: "5A", texto: "5A", href: enlaces.seccion["5A"] },
                { clave: "5C", texto: "5C", href: enlaces.seccion["5C"] },
              ]}
            />
          ) : null}
          <SegmentedLinks
            label="Vista del ranking"
            actual={vista}
            opciones={[
              {
                clave: "estudiantes",
                texto: "Estudiantes",
                href: enlaces.vista.estudiantes,
                icono: <User aria-hidden="true" />,
              },
              {
                clave: "equipos",
                texto: "Equipos",
                href: enlaces.vista.equipos,
                icono: <Users aria-hidden="true" />,
              },
            ]}
          />
        </>
      }
    />
  );
}
