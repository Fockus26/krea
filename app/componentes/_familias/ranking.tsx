import { Podium } from "@/components/krea/podium";
import { RankDelta } from "@/components/krea/rank-delta";
import { RankList } from "@/components/krea/rank-list";
import { Familia, Muestra } from "./familia";
import {
  estudiantesOrdenados,
  filaEstudiante,
  filasEquipos,
  podioEquipos,
  podioEstudiantes,
} from "./ranking-datos";
import { RankingSimulador } from "./ranking-simulador";

// Nombres, puntos y capitanes de ejemplo provisionales (CONTENT_CHECKLIST filas 41–43)
const DELTAS_MUESTRA = [3, 1, 0, -1, -2] as const;

export function Ranking() {
  const estudiantes = estudiantesOrdenados();
  // Del 10.º al final: "tú" en el 11.º y la zona de riesgo completa (6 filas, empate en el borde)
  const desdeDiez = estudiantes.filter((e) => e.puesto >= 10);
  // Dos 1.º (1-1-3) y dos 2.º (1-2-2)
  const dosPrimeros = estudiantesOrdenados({ e05: 42 });
  const dosSegundos = estudiantesOrdenados({ e01: 45, e03: 40.5 });

  return (
    <Familia
      id="ranking"
      title="Ranking y podio"
      description="Fila del ranking (top 10, propia, 11–30, zona de riesgo, empate), chip de cambio de puesto, separador de riesgo y podio de estudiantes y equipos (HANDOFF §2.9–2.10 y §6)."
    >
      <Muestra title="Cambio de puesto (RankDelta)">
        <div className="flex flex-wrap items-center gap-3">
          {DELTAS_MUESTRA.map((d) => (
            <RankDelta key={d} delta={d} />
          ))}
        </div>
      </Muestra>

      <Muestra title="Estudiantes · tú en el top 10 (con «Simular cambio de puesto»)">
        <div className="max-w-2xl">
          <RankingSimulador />
        </div>
      </Muestra>

      <Muestra title="Estudiantes · tú fuera del top 10, puestos 11–30 y zona de riesgo con empate en el borde">
        <div className="max-w-2xl">
          <RankList
            label="Ranking de estudiantes, desde el puesto 10"
            filas={desdeDiez.map((e) => filaEstudiante(e, { me: "e11" }))}
          />
        </div>
      </Muestra>

      <Muestra title="Fila propia dentro de la zona de riesgo">
        <div className="max-w-2xl">
          <RankList
            label="Ranking de estudiantes, zona de riesgo"
            filas={estudiantes
              .filter((e) => e.enRiesgo)
              .map((e) => filaEstudiante(e, { me: "e16" }))}
          />
        </div>
      </Muestra>

      <Muestra title="Equipos (logo y «n integrantes · capitán …»)">
        <div className="max-w-2xl">
          <RankList label="Ranking de equipos" filas={filasEquipos()} />
        </div>
      </Muestra>

      <Muestra title="Podio · estudiantes">
        <div className="max-w-xl">
          <Podium
            label="Podio de estudiantes"
            entradas={podioEstudiantes(estudiantes)}
          />
        </div>
      </Muestra>

      <Muestra title="Podio · equipos">
        <div className="max-w-xl">
          <Podium label="Podio de equipos" entradas={podioEquipos()} />
        </div>
      </Muestra>

      <Muestra title="Podio con empate · dos 1.º (1-1-3)">
        <div className="max-w-xl">
          <Podium
            label="Podio con dos primeros puestos"
            entradas={podioEstudiantes(dosPrimeros)}
          />
        </div>
      </Muestra>

      <Muestra title="Podio con empate · dos 2.º (1-2-2)">
        <div className="max-w-xl">
          <Podium
            label="Podio con dos segundos puestos"
            entradas={podioEstudiantes(dosSegundos)}
          />
        </div>
      </Muestra>
    </Familia>
  );
}
