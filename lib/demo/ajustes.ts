// Ajustes de puntos de ejemplo (fase 04, D098). Mueven los puntos del ranking, nunca la nota (D007).
// PLACEHOLDER (HANDOFF §8, CONTENT_CHECKLIST fila 77): los cuatro son los del lienzo `Panel.dc.html`;
// nombres, cédulas y equipos son reales del seed, motivos y fechas son de ejemplo. La fase 07 los lee de Firestore.
// `feat/sec-puntos` (ola 4) reutiliza este tipo y esta lista.

export type DemoAjuste = {
  id: string;
  destino: { tipo: "alumno"; cedula: string } | { tipo: "equipo"; id: string };
  valor: number;
  motivo: string;
  /** ISO local sin zona: "aaaa-mm-ddThh:mm", o solo "aaaa-mm-dd" cuando no hay hora. */
  fecha: string;
};

export const AJUSTES: readonly DemoAjuste[] = [
  {
    id: "aj-1",
    destino: { tipo: "alumno", cedula: "32828381" }, // Jorge Quintero
    valor: 2,
    motivo: "Participación destacada",
    fecha: "2026-10-25T10:15",
  },
  {
    id: "aj-2",
    destino: { tipo: "alumno", cedula: "33987614" }, // Klenyerber Corredor
    valor: -1,
    motivo: "Uso del celular",
    fecha: "2026-10-25T09:40",
  },
  {
    id: "aj-3",
    destino: { tipo: "equipo", id: "5a-g3" }, // 5A-G3 Ropa
    valor: 1,
    motivo: "Ayudó a un compañero",
    fecha: "2026-10-24T11:05",
  },
  {
    id: "aj-4",
    destino: { tipo: "equipo", id: "5c-g1" }, // 5C-G1
    valor: -1,
    motivo: 'Otro: "Entregaron la maqueta sin nombres"',
    fecha: "2026-10-23", // el lienzo no trae hora
  },
];
