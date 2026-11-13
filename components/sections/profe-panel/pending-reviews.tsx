import { ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardList,
  CardListItem,
  CardTitle,
} from "@/components/ui/card";
import type { DicebearEstilo } from "@/lib/dicebear";
import type { SeccionId } from "@/lib/modelo";
import {
  ENTREGAS_VISIBLES,
  evaluarAriaLabel,
  verTodasTexto,
} from "@/lib/panel";

export type FilaEvaluar = {
  id: string;
  seccion: SeccionId;
  tipo: "individual" | "grupal";
  /** Lo que se lee en la fila: "5A-G2 Repostería" o "Jorge Quintero · 5A". */
  nombre: string;
  /** Nombre para el botón: "Evaluar a {nombreCorto}". */
  nombreCorto: string;
  /** Logo del equipo (grupal) o avatar del alumno (individual). */
  visual:
    | { tipo: "equipo"; teamId: string; tema: string }
    | { tipo: "alumno"; estilo: DicebearEstilo; seed: string; nombre: string };
  /** Ya armada con `entregaMetaTexto`. */
  meta: string;
};

const HREF_COLA = "/profe/evaluar";

/**
 * "Por evaluar" del Panel (HANDOFF §3 Panel §3): `h2`, "Evaluar la primera →" primary sm, filas con
 * avatar/TeamLogo 40, nombre (`h3` con aspecto h4: cuelga del `h2` de la tarjeta), meta y "Evaluar" secondary sm,
 * y el pie "Ver las N". Muestra las primeras ENTREGAS_VISIBLES; la cola completa es de Evaluar.
 */
export function PendingReviews({
  filas,
  className,
}: {
  filas: readonly FilaEvaluar[];
  className?: string;
}) {
  const visibles = filas.slice(0, ENTREGAS_VISIBLES);
  const primera = filas[0];
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle level={2}>Por evaluar</CardTitle>
        {primera ? (
          <Button asChild size="sm">
            <Link href={`${HREF_COLA}/${primera.id}`}>
              Evaluar la primera
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      {visibles.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="¡Todo evaluado!"
          description="Cuando un estudiante entregue una tarea, aparece aquí."
        />
      ) : (
        <>
          <CardList>
            {visibles.map((f) => (
              <PorEvaluarFila key={f.id} fila={f} />
            ))}
          </CardList>
          <Button asChild variant="ghost" size="sm" className="mt-2">
            <Link href={HREF_COLA}>{verTodasTexto(filas.length)}</Link>
          </Button>
        </>
      )}
    </Card>
  );
}

function PorEvaluarFila({ fila: f }: { fila: FilaEvaluar }) {
  return (
    <CardListItem>
      {f.visual.tipo === "equipo" ? (
        <TeamLogo teamId={f.visual.teamId} tema={f.visual.tema} size={40} />
      ) : (
        <UserAvatar
          estilo={f.visual.estilo}
          seed={f.visual.seed}
          nombre={f.visual.nombre}
          size={40}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-h4 break-words text-text">{f.nombre}</h3>
        <p className="text-small break-words text-text-2">{f.meta}</p>
      </div>
      <Button asChild variant="secondary" size="sm">
        <Link
          href={`${HREF_COLA}/${f.id}`}
          aria-label={evaluarAriaLabel(f.nombreCorto)}
        >
          Evaluar
        </Link>
      </Button>
    </CardListItem>
  );
}
