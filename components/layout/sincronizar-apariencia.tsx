"use client";
// Aplica el tema y el acento guardados en el perfil (D015, D191): el script anti-parpadeo del
// layout raíz pinta lo de `localStorage` y, si el perfil dice otra cosa (otro dispositivo), aquí
// se corrige y se guarda para la próxima carga.
import { useEffect } from "react";
import {
  aplicarAcento,
  aplicarTema,
  CLAVE_ACENTO,
  CLAVE_TEMA,
  leerPreferencia,
} from "@/lib/apariencia";
import type { Apariencia } from "@/lib/modelo";

export function SincronizarApariencia({
  apariencia,
}: {
  apariencia: Apariencia | null;
}) {
  useEffect(() => {
    if (!apariencia) return;
    if (leerPreferencia(CLAVE_TEMA, "system") !== apariencia.tema)
      aplicarTema(apariencia.tema);
    if (leerPreferencia(CLAVE_ACENTO, "azul") !== apariencia.acento)
      aplicarAcento(apariencia.acento);
  }, [apariencia]);
  return null;
}
