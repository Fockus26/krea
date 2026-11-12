import { ChevronRight, User, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { CardListItem } from "@/components/ui/card";
import { tipoTareaTexto } from "@/lib/sections";

/**
 * Fila de nota (HANDOFF §3 Inicio §3, Mis notas, Mi equipo): idéntica en las tres pantallas (§8),
 * por eso es una sola. Enlace de fila completa: título h4 + meta con ícono de tipo y fecha,
 * `GradePill lg` (con chip Base si la base no es 20) y chevron. `chips` añade los de estado
 * ("En juego: {premio}" en Mi equipo). El nombre accesible lo da el contenido visible.
 */
export function GradeRow({
  href,
  titulo,
  tipo,
  fecha,
  detalle,
  nota,
  base,
  aviso,
  chips,
  headingLevel = 3,
}: {
  href: string;
  titulo: string;
  tipo: "individual" | "grupal";
  /** Ya formateada (dd/mm/aaaa). */
  fecha: string;
  /** Dato entre el tipo y la fecha: el equipo en las grupales ("Grupal · 5A-G2 Repostería · …"). */
  detalle?: string;
  /** Nota final (con base aplicada); `null` = Pendiente. */
  nota: number | null;
  base?: number;
  /** Línea de texto bajo la meta (p. ej. «No participaste en esta entrega del equipo», D367). */
  aviso?: string;
  chips?: ReactNode;
  /** Nivel semántico (el tamaño siempre es h4): 3 bajo una tarjeta con h2; 4 bajo un h3. */
  headingLevel?: 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  const Icon = tipo === "grupal" ? Users : User;
  return (
    <CardListItem asChild>
      <Link href={href} className="flex-wrap">
        <span className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
          <Heading className="text-h4 text-text">{titulo}</Heading>
          <span className="text-small flex flex-wrap icono-linea gap-x-1.5 text-text-2">
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>
              {[tipoTareaTexto(tipo), detalle, fecha]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          {aviso ? <span className="text-small text-text">{aviso}</span> : null}
          {chips ? (
            <span className="mt-1 flex flex-wrap gap-1.5">{chips}</span>
          ) : null}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <GradePill nota={nota} size="lg" base={base} />
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-text-2"
          />
        </span>
      </Link>
    </CardListItem>
  );
}
