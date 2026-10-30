import { CaptainBadge } from "@/components/krea/status-badge";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { DicebearEstilo } from "@/lib/dicebear";
import { formatNota } from "@/lib/grades";

export type Integrante = {
  id: string;
  nombre: string;
  estilo: DicebearEstilo;
  seed: string;
  /** Puntos de ranking del integrante. */
  puntos: number;
  esTu: boolean;
  esCapitan: boolean;
};

/**
 * Integrantes de Mi equipo (HANDOFF §3 Mi equipo §2): filas de 52 mín. con avatar 48 (anillo
 * si eres tú), nombre completo (tamaño h4, envuelve), chip "tú", chip Capitán + "Envía las
 * tareas grupales" y los puntos de ranking a la derecha. El orden ya viene dado: capitán y
 * luego por puntos. Los puntos llevan su unidad en `sr-only` (la columna solo muestra la cifra).
 */
export function TeamMembers({
  integrantes,
  capitanFemenino = false,
}: {
  integrantes: readonly Integrante[];
  /** Género del capitán (D075): por defecto "Capitán". */
  capitanFemenino?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Integrantes</CardTitle>
        <p className="text-small text-text-2">
          Puntos de cada uno en el ranking
        </p>
      </CardHeader>
      <ul className="m-0 list-none p-0">
        {integrantes.map((m) => (
          <li
            key={m.id}
            className="flex min-h-13 items-center gap-3 border-b border-divider py-1.5 last:border-b-0"
          >
            <UserAvatar
              estilo={m.estilo}
              seed={m.seed}
              nombre={m.nombre}
              size={48}
              ring={m.esTu}
              className="shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-h4 flex flex-wrap items-center gap-1.5 text-text">
                {m.nombre}
                {m.esTu ? <Badge variant="tu">tú</Badge> : null}
              </p>
              {m.esCapitan ? (
                <p className="text-small flex flex-wrap items-center gap-2 text-text-2">
                  <CaptainBadge femenino={capitanFemenino} className="h-6" />
                  Envía las tareas grupales
                </p>
              ) : null}
            </div>
            <p className="text-h4 nums shrink-0 text-text">
              {formatNota(m.puntos)}
              <span className="sr-only"> puntos</span>
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
