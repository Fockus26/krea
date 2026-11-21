import { ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { GradePill } from "@/components/krea/grade-pill";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { BOTON_LARGO_SM, Button } from "@/components/ui/button";
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
  CORREGIR_TEXTO,
  corregirAriaLabel,
  ENTREGAS_VISIBLES,
  evaluarAriaLabel,
  verAriaLabel,
  verTodasTexto,
} from "@/lib/panel";
import { cn } from "@/lib/utils";

export type FilaEvaluar = {
  id: string;
  seccion: SeccionId;
  tipo: "individual" | "grupal";
  /** Lo que se lee en la fila: "5A-G2 Repostería" o "Mateo Paredes · 5A". */
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
          <Button asChild size="sm" className={BOTON_LARGO_SM}>
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

/**
 * `query`: los filtros de la cola (`?tipo=grupal…`), para que Anterior/Saltar los sigan (D385).
 * `evaluada` (cola con «Evaluadas» o «Todas», D439): la nota en la meta (`GradePill`, D004) y
 * «Ver» (`?ver`) + «Corregir» en vez de «Evaluar» (D401). El Panel no la pasa: «Evaluar».
 */
export function PorEvaluarFila({
  fila: f,
  query = "",
  evaluada,
}: {
  fila: FilaEvaluar;
  query?: string;
  evaluada?: { nota: number | null };
}) {
  const href = `${HREF_COLA}/${f.id}${query}`;
  return (
    // Con dos acciones la fila envuelve: el texto guarda 160 px y los botones bajan (320 px)
    <CardListItem className={evaluada ? "flex-wrap" : undefined}>
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
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5",
          evaluada && "min-w-[min(--spacing(40),100%)]",
        )}
      >
        <h3 className="text-h4 break-words text-text">{f.nombre}</h3>
        {evaluada ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-2">
            <GradePill nota={evaluada.nota} size="sm" />
            <span className="min-w-0 break-words">{f.meta}</span>
          </p>
        ) : (
          <p className="text-small break-words text-text-2">{f.meta}</p>
        )}
      </div>
      {evaluada ? (
        <span className="ml-auto flex flex-wrap justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`${HREF_COLA}/${f.id}?ver`}
              aria-label={verAriaLabel(f.nombreCorto)}
            >
              Ver
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={href} aria-label={corregirAriaLabel(f.nombreCorto)}>
              {CORREGIR_TEXTO}
            </Link>
          </Button>
        </span>
      ) : (
        <Button asChild variant="secondary" size="sm">
          <Link href={href} aria-label={evaluarAriaLabel(f.nombreCorto)}>
            Evaluar
          </Link>
        </Button>
      )}
    </CardListItem>
  );
}
