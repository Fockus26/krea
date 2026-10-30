// Textos compartidos de las secciones (fase 04). Lógica pura, sin React.

export function tipoTareaTexto(tipo: "individual" | "grupal"): string {
  return tipo === "grupal" ? "Grupal" : "Individual";
}

/** "1 pendiente" / "2 pendientes". */
export function pendientesTexto(n: number): string {
  return `${n} ${n === 1 ? "pendiente" : "pendientes"}`;
}

/** "1 integrante" / "5 integrantes". */
export function integrantesTexto(n: number): string {
  return `${n} ${n === 1 ? "integrante" : "integrantes"}`;
}
