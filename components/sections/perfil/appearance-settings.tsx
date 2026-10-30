"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ACENTOS,
  type Acento,
  aplicarAcento,
  aplicarTema,
  CLAVE_ACENTO,
  CLAVE_TEMA,
  esAcento,
  esTema,
  leerPreferencia,
  type Tema,
} from "@/lib/apariencia";
import { cn } from "@/lib/utils";

// Clases completas para que Tailwind las detecte (también en `on`, que el segmentado pinta de --surface)
const MUESTRA: Record<Acento, string> = {
  azul: "bg-swatch-azul data-[state=on]:bg-swatch-azul",
  rojo: "bg-swatch-rojo data-[state=on]:bg-swatch-rojo",
  verde: "bg-swatch-verde data-[state=on]:bg-swatch-verde",
  morado: "bg-swatch-morado data-[state=on]:bg-swatch-morado",
};

const TEMAS: ReadonlyArray<{ valor: Tema; texto: string; icon: typeof Sun }> = [
  { valor: "light", texto: "Claro", icon: Sun },
  { valor: "dark", texto: "Oscuro", icon: Moon },
  { valor: "system", texto: "Sistema", icon: Monitor },
];

/**
 * "Apariencia" de Perfil (HANDOFF §3 Perfil §4, D001, D015): "Color de acento" con 4 círculos 48
 * de color fijo (el de cada acento en claro, igual en los dos temas) como radiogroup, con check
 * blanco y anillo `--text` en el elegido y el nombre debajo; "Tema" segmentado a todo el ancho
 * (Claro · Oscuro · Sistema; bajo 400 px sin íconos). Cambia en vivo y se guarda en
 * `localStorage` (anti-parpadeo); `onChange` lo lleva al perfil (fase 07).
 */
export function AppearanceSettings({
  onChange,
}: {
  onChange?: (pref: { tema: Tema; acento: Acento }) => void;
}) {
  const [tema, setTema] = useState<Tema>("system");
  const [acento, setAcento] = useState<Acento>("azul");
  const acentoId = useId();
  const temaId = useId();

  useEffect(() => {
    const t = leerPreferencia(CLAVE_TEMA, "system");
    const a = leerPreferencia(CLAVE_ACENTO, "azul");
    if (esTema(t)) setTema(t);
    if (esAcento(a)) setAcento(a);
  }, []);

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="text-h3 text-text">Apariencia</h2>
      <div className="flex flex-col gap-2">
        <p id={acentoId} className="text-label text-text">
          Color de acento
        </p>
        <ToggleGroup
          aria-labelledby={acentoId}
          value={acento}
          onValueChange={(v) => {
            if (!esAcento(v)) return;
            setAcento(v);
            aplicarAcento(v);
            onChange?.({ tema, acento: v });
          }}
          className="flex flex-wrap gap-4 bg-transparent p-0"
        >
          {ACENTOS.map((a) => (
            <div key={a.valor} className="flex flex-col items-center gap-1.5">
              <ToggleGroupItem
                value={a.valor}
                aria-label={a.texto}
                className={cn(
                  "size-12 rounded-full p-0 text-swatch-ink hover:text-swatch-ink data-[state=on]:text-swatch-ink",
                  "data-[state=on]:shadow-swatch",
                  MUESTRA[a.valor],
                )}
              >
                {acento === a.valor ? (
                  <Check aria-hidden="true" className="size-6" />
                ) : null}
              </ToggleGroupItem>
              <span aria-hidden="true" className="text-small-b text-text">
                {a.texto}
              </span>
            </div>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <p id={temaId} className="text-label text-text">
          Tema
        </p>
        <ToggleGroup
          block
          aria-labelledby={temaId}
          value={tema}
          onValueChange={(v) => {
            if (!esTema(v)) return;
            setTema(v);
            aplicarTema(v);
            onChange?.({ tema: v, acento });
          }}
        >
          {TEMAS.map(({ valor, texto, icon: Icon }) => (
            <ToggleGroupItem key={valor} value={valor}>
              <Icon aria-hidden="true" />
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </Card>
  );
}
