// «Mensaje del día» de Inicio del estudiante (D274). Lógica pura, sin React ni reloj: el día llega
// por argumento (ISO `AAAA-MM-DD` en Caracas) para que el prerender no lea la hora (D098).

export type BandaMensaje =
  | "sin-notas"
  | "raspado"
  | "media"
  | "alta"
  | "excelente";

/**
 * Banda del promedio: raspado < 10, 10–13,5, 14–16,5 (de 14 a menos de 17), 17–20; sin notas
 * evaluadas (`null`) tiene la suya.
 */
export function bandaDePromedio(promedio: number | null): BandaMensaje {
  if (promedio === null) return "sin-notas";
  if (promedio < 10) return "raspado";
  if (promedio < 14) return "media";
  if (promedio < 17) return "alta";
  return "excelente";
}

/*
 * PROVISIONAL (CONTENT_CHECKLIST filas 150–153): copy del equipo de desarrollo, a revisar por César.
 * Fila 150 = título «Mensaje del día» y marcador «Tú», 151 = sin notas y raspado,
 * 152 = 10–16,5 (media y alta), 153 = 17–20.
 * Cálidos y justos: ninguno culpa al alumno ni menciona la nota exacta.
 */
export const MENSAJES: Readonly<Record<BandaMensaje, readonly string[]>> = {
  // PROVISIONAL (fila 151)
  "sin-notas": [
    "Tu primera nota está por llegar. Mientras tanto, cada entrega a tiempo suma.",
    "Empieza el camino: revisa tus tareas y entrega lo que puedas hoy.",
    "Aún no hay notas, pero hay mucho por crear. ¡Anímate con la primera!",
    "Cuando tu profe evalúe, aquí verás cómo vas. Hoy toca crear.",
  ],
  // PROVISIONAL (fila 151)
  raspado: [
    "Un mal momento no define tu año: cada tarea nueva es otra oportunidad.",
    "Pide ayuda sin pena: tu profe y tu equipo están para eso.",
    "Mira tus notas pregunta a pregunta: ahí se ve qué mejorar primero.",
    "Paso a paso se sube. La próxima entrega puede cambiar tu promedio.",
    "Tu esfuerzo cuenta. Elige una cosa para mejorar hoy y empieza por ahí.",
  ],
  // PROVISIONAL (fila 152)
  media: [
    "Vas por buen camino: un detalle más en cada entrega y subes.",
    "Buen ritmo. Repasa lo que te costó en la última tarea y úsalo en la próxima.",
    "Tu constancia se nota. Sigue entregando y cuidando los detalles.",
    "Estás cerca de dar el salto: revisa las preguntas donde perdiste puntos.",
  ],
  // PROVISIONAL (fila 152)
  alta: [
    "¡Muy buen trabajo! Tu creatividad se está notando.",
    "Vas muy bien. Comparte lo que sabes con tu equipo: todos ganan.",
    "Tu promedio refleja constancia. Sigue con esa energía.",
    "Gran momento. Atrévete con ideas nuevas en la próxima tarea.",
    "Buen nivel. Cuida los detalles y mantén el ritmo.",
  ],
  // PROVISIONAL (fila 153)
  excelente: [
    "¡Excelente! Tu trabajo se luce. Gracias por poner tanto cuidado.",
    "Estás brillando. Ayuda a quien lo necesite: enseñar también es crear.",
    "Nivel altísimo. Sigue explorando y arriesgando con tus ideas.",
    "Qué gran racha. Disfruta lo logrado y mantén la curiosidad.",
  ],
};

/** Día del año (1–366) de un día civil ISO `AAAA-MM-DD`; calendario puro, sin zona horaria. */
export function diaDelAnio(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) throw new RangeError(`Día inválido: ${iso}`);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(a, 0, 0)) / 86_400_000);
}

/**
 * Mensaje del día (D274): banda por el promedio e índice = día del año módulo la cantidad de
 * mensajes de la banda. Mismo promedio y mismo día, mismo mensaje; cambia cada día, no cada recarga.
 */
export function mensajeDelDia(promedio: number | null, dia: string): string {
  const lista = MENSAJES[bandaDePromedio(promedio)];
  return lista[diaDelAnio(dia) % lista.length] ?? "";
}
