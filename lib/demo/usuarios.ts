// Usuarios de la navegación en las vistas previas (D066).
import type { NavUsuario } from "@/components/layout/nav-types";
import { alumnoPorCedula, CEDULA_DEMO, nombreCorto } from "@/lib/demo/seed";

const raquel = alumnoPorCedula(CEDULA_DEMO);

/** Estudiante real del seed; el estilo de avatar es placeholder (lo elige en Perfil). */
export const USUARIO_ESTUDIANTE: NavUsuario = {
  nombre: nombreCorto(raquel),
  estilo: "adventurer-neutral",
  seed: raquel.cedula,
};

/** PLACEHOLDER: el nombre del profe no está en el seed (HANDOFF §8, CONTENT_CHECKLIST fila 53). */
export const USUARIO_PROFESOR: NavUsuario = {
  nombre: "[Nombre del profe]",
  estilo: "bottts-neutral",
  seed: "profe",
};
