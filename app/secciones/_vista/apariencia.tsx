"use client";

import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ACENTOS,
  aplicarAcento,
  aplicarTema,
  CLAVE_ACENTO,
  CLAVE_TEMA,
  esAcento,
  esTema,
  leerPreferencia,
} from "@/lib/apariencia";

// Selector de tema y acento de las vistas previas (D001: revisar 4 acentos × claro/oscuro).
// Escribe las mismas claves que lee el script anti-parpadeo del layout raíz, así que el
// cambio se mantiene al abrir cada pantalla. El selector real es el de Perfil (`AppearanceSettings`).
const TEMAS = [
  ["system", "Sistema"],
  ["light", "Claro"],
  ["dark", "Oscuro"],
] as const;

export function Apariencia() {
  const [tema, setTema] = useState("system");
  const [acento, setAcento] = useState("azul");

  useEffect(() => {
    setTema(leerPreferencia(CLAVE_TEMA, "system"));
    setAcento(leerPreferencia(CLAVE_ACENTO, "azul"));
  }, []);

  function cambiarTema(valor: string) {
    if (!esTema(valor)) return;
    setTema(valor);
    aplicarTema(valor);
  }

  function cambiarAcento(valor: string) {
    if (!esAcento(valor)) return;
    setAcento(valor);
    aplicarAcento(valor);
  }

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <div className="flex flex-col gap-2">
        <span id="apariencia-tema" className="text-label text-text">
          Tema
        </span>
        <ToggleGroup
          value={tema}
          onValueChange={cambiarTema}
          aria-labelledby="apariencia-tema"
        >
          {TEMAS.map(([valor, texto]) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span id="apariencia-acento" className="text-label text-text">
          Acento
        </span>
        <ToggleGroup
          value={acento}
          onValueChange={cambiarAcento}
          aria-labelledby="apariencia-acento"
        >
          {ACENTOS.map(({ valor, texto }) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
