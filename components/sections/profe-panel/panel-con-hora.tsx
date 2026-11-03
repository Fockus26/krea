"use client";

import { useSyncExternalStore } from "react";
import { HORA_SALUDO_SERVIDOR, saludoTexto } from "@/lib/panel";
import { type DatosPanel, PanelView } from "./panel-view";

/*
 * Panel con el saludo por la hora del visitante (D133). El servidor y la hidratación usan
 * `HORA_SALUDO_SERVIDOR` (D098: con `cacheComponents` el prerender no lee el reloj); justo después
 * React vuelve a pintar con la hora local, sin desajuste de hidratación. Se revisa cada minuto
 * para cambiar de saludo si la página queda abierta.
 */
const MINUTO = 60_000;

function suscribir(avisar: () => void) {
  const id = window.setInterval(avisar, MINUTO);
  return () => window.clearInterval(id);
}

const horaLocal = () => new Date().getHours();
const horaServidor = () => HORA_SALUDO_SERVIDOR;

export function PanelConHora({ datos }: { datos: DatosPanel }) {
  const hora = useSyncExternalStore(suscribir, horaLocal, horaServidor);
  return <PanelView saludo={saludoTexto(hora)} datos={datos} />;
}
