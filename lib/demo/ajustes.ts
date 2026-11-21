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
  /** Texto libre del motivo «Otro» (Ajustes de puntos, D118). Opcional: el Panel no lo usa. */
  detalle?: string;
  /** Quién lo aplicó; sin él, el único profe del portal (`USUARIO_PROFESOR`). */
  profe?: string;
  /** `id` del ajuste que esta fila anula (motivo «Anulación», D121). */
  anulaA?: string;
};

export const AJUSTES: readonly DemoAjuste[] = [
  {
    id: "aj-1",
    destino: { tipo: "alumno", cedula: "45003711" }, // Mateo Paredes
    valor: 2,
    motivo: "Participación destacada",
    fecha: "2026-10-25T10:15",
  },
  {
    id: "aj-2",
    destino: { tipo: "alumno", cedula: "45040821" }, // Pablo Escobar
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

/**
 * Historial de Ajustes de puntos (`Puntos.dc.html`): los 4 del Panel + Hugo Iglesias, que el lienzo pinta 4.º.
 * PLACEHOLDER (HANDOFF §8, CONTENT_CHECKLIST fila 92): motivo y fecha de ejemplo; alumno real del seed.
 * Va aparte de `AJUSTES` para que el Panel siga mostrando sus 4 filas.
 */
export const AJUSTES_HISTORIAL: readonly DemoAjuste[] = [
  ...AJUSTES.slice(0, 3),
  {
    id: "aj-5",
    destino: { tipo: "alumno", cedula: "45019792" }, // Hugo Iglesias
    valor: -2,
    motivo: "No estuvo en clase",
    fecha: "2026-10-23T07:30",
  },
  ...AJUSTES.slice(3),
];
