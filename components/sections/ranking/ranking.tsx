import type { SeccionId } from "@/lib/modelo";
import type {
  ItemRanking,
  Movimiento,
  RolRanking,
  Vista,
} from "@/lib/ranking-vista";
import { RankingBoard } from "./ranking-board";
import { RankingFeed } from "./ranking-feed";
import { RankingHeader } from "./ranking-header";
import { RankingHowTo } from "./ranking-how-to";
import { RankingRules } from "./ranking-rules";

type Props = {
  rol: RolRanking;
  seccion: SeccionId;
  vista: Vista;
  items: readonly ItemRanking[];
  movimientos: readonly Movimiento[];
  /** Epoch ms de «ahora» para «hace 2 min» (lo fija quien monta la sección). */
  ahora: number;
  enlaces: {
    vista: Record<Vista, string>;
    seccion?: Readonly<Record<SeccionId, string>>;
  };
};

/*
 * Pantalla Ranking (HANDOFF §3 Ranking): encabezado y, bajo 1440, el `<details>` de ayuda;
 * después `g-side-xl` (izquierda podio + lista, derecha 360 con reglas y feed, solo ≥ 1440, D503). Una sola
 * columna por debajo de 1440, en el orden del DOM. Presentacional: recibe todo por props (D066).
 */
export function Ranking({
  rol,
  seccion,
  vista,
  items,
  movimientos,
  ahora,
  enlaces,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <RankingHeader
        rol={rol}
        seccion={seccion}
        vista={vista}
        cantidad={items.length}
        enlaces={enlaces}
      />
      <RankingHowTo className="xl:hidden" />
      <div className="g-side-xl max-xl:gap-6">
        <RankingBoard vista={vista} items={items} rol={rol} seccion={seccion} />
        <aside
          aria-label="Reglas y movimientos"
          className="flex flex-col gap-6 max-xl:hidden"
        >
          <RankingRules />
          <RankingFeed movimientos={movimientos} ahora={ahora} />
        </aside>
      </div>
    </div>
  );
}
