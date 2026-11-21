"use client";

import { Check, Dices } from "lucide-react";
import { useId, useState } from "react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type DicebearEstilo, esEstiloDicebear } from "@/lib/dicebear";
import {
  ESTILOS_AVATAR,
  opcionAvatarTexto,
  semillasAvatar,
} from "@/lib/perfil";

/**
 * "Tu avatar" de Perfil (HANDOFF §3 Perfil §3): h2 (tamaño h3) + "Otros 8" (Dices); pestañas de
 * línea por estilo (Aventurero · Emoji · Robot · Retrato) y una grilla 4 × 2 (8 × 1 desde 768)
 * de opciones redondas como radiogroup (`ToggleGroup`, D038: flechas mueven y eligen). La
 * elegida lleva anillo 3 + 3 px `--accent` y un check sobre un círculo 24 `--accent`.
 * "Se guarda al tocarlo": `onChange` recibe `{estilo, seed}` (Firestore en la fase 07).
 */
export function AvatarPicker({
  nombre,
  estilo: estiloInicial,
  seed: seedInicial,
  base,
  onChange,
}: {
  nombre: string;
  estilo: DicebearEstilo;
  seed: string;
  /** Semilla de la que salen las opciones: la raíz opaca de la actual (`baseSelectorAvatar`, D388). */
  base: string;
  onChange?: (avatar: { estilo: DicebearEstilo; seed: string }) => void;
}) {
  const [elegido, setElegido] = useState({
    estilo: estiloInicial,
    seed: seedInicial,
  });
  const [pestana, setPestana] = useState<DicebearEstilo>(estiloInicial);
  const [tanda, setTanda] = useState(0);
  const gridLabel = useId();
  const semillas = semillasAvatar(base, tanda);
  const valor =
    elegido.estilo === pestana && semillas.includes(elegido.seed)
      ? elegido.seed
      : "";

  function elegir(seed: string) {
    if (!seed) return;
    const avatar = { estilo: pestana, seed };
    setElegido(avatar);
    onChange?.(avatar);
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <h2 className="text-h3 text-text">Tu avatar</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTanda((t) => t + 1)}
        >
          <Dices aria-hidden="true" />
          Otros 8
        </Button>
      </CardHeader>
      <Tabs
        value={pestana}
        onValueChange={(v) => {
          if (esEstiloDicebear(v)) setPestana(v);
        }}
      >
        <TabsList aria-label="Estilo de avatar">
          {ESTILOS_AVATAR.map((e) => (
            <TabsTrigger key={e.estilo} value={e.estilo}>
              {e.texto}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* La cuadrícula es el panel de la pestaña: así `aria-controls` apunta a un id real (D507) */}
        <TabsContent value={pestana} tabIndex={-1}>
          <p id={gridLabel} className="sr-only">
            Elige tu avatar
          </p>
          <ToggleGroup
            indicador={false}
            aria-labelledby={gridLabel}
            value={valor}
            onValueChange={elegir}
            className="grid w-full grid-cols-4 justify-items-center gap-3 bg-transparent p-0 md:grid-cols-8"
          >
            {semillas.map((seed, i) => {
              const activo = valor === seed;
              return (
                <ToggleGroupItem
                  key={seed}
                  value={seed}
                  aria-label={opcionAvatarTexto(i + 1)}
                  className="relative size-16 rounded-full p-0 data-[state=on]:bg-transparent data-[state=on]:shadow-avatar-opt"
                >
                  <UserAvatar
                    estilo={pestana}
                    seed={seed}
                    nombre={nombre}
                    size={64}
                  />
                  {activo ? (
                    <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-accent text-on-accent">
                      <Check aria-hidden="true" className="size-4" />
                    </span>
                  ) : null}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
