// Id público de un alumno (QA v2 F-M1, D493–D496): lo que el navegador de OTRO alumno recibe en
// lugar de la cédula (ranking y su sondeo, Inicio, Mi equipo, reparto de partes). HMAC-SHA256 de
// la cédula con una clave derivada del secreto del servidor: estable entre peticiones y no
// reversible sin el secreto (un hash solo de la cédula se revierte probando sus 10⁸ valores, D388).
// Puro y sin `server-only` para las pruebas: el secreto lo pone `lib/datos/id-publico.ts` (solo
// servidor). Usa `node:crypto`, así que un componente cliente que lo importe no compila.
import { createHmac } from "node:crypto";
import type { RankingPublico, RankingSeccion } from "@/lib/modelo";
import { semillaConCedula } from "@/lib/perfil";

/** Etiqueta de la clave derivada: otro uso del secreto da otra clave. `v1`: cambiarla cambia todos los ids. */
export const ETIQUETA_ID_PUBLICO = "krea:id-publico:v1";
/** 22 caracteres base64url = 132 bits del HMAC. */
export const LARGO_ID_PUBLICO = 22;

/** Cédula → lo que sale al cliente: el id público (alumnos) o la cédula tal cual (`conCedula`, el profe). */
export type IdAlumno = (cedula: string) => string;

/** El profe ve y edita cédulas (enlaces a Alumnos, D-perfil): su vista no las cambia. */
export const conCedula: IdAlumno = (cedula) => cedula;

/**
 * Clave derivada del secreto para un uso (`etiqueta`): HMAC-SHA256(secreto, etiqueta). Cada uso
 * (id público, carpeta de entrega D512…) tiene su etiqueta y por eso su clave.
 */
export function claveDerivada(secreto: string, etiqueta: string): Buffer {
  return createHmac("sha256", secreto).update(etiqueta).digest();
}

/** `idPublico` con un secreto dado; memoriza cada cédula ya calculada. */
export function crearIdPublico(secreto: string): IdAlumno {
  if (!secreto) throw new Error("Falta el secreto del id público");
  const clave = claveDerivada(secreto, ETIQUETA_ID_PUBLICO);
  const hechos = new Map<string, string>();
  return (cedula) => {
    let id = hechos.get(cedula);
    if (id === undefined) {
      id = createHmac("sha256", clave)
        .update(cedula)
        .digest("base64url")
        .slice(0, LARGO_ID_PUBLICO);
      hechos.set(cedula, id);
    }
    return id;
  };
}

/**
 * La traducción de vuelta (D495): la cédula de `cedulas` (los integrantes del equipo, leídos en el
 * servidor) cuyo id es `id`; `null` si no es de ninguno: quien llama lo rechaza.
 */
export function cedulaDeId(
  id: string,
  cedulas: readonly string[],
  idDe: IdAlumno,
): string | null {
  return cedulas.find((c) => idDe(c) === id) ?? null;
}

/**
 * El ranking que recibe un alumno (D494): cada fila con su id público como clave. Una semilla de
 * avatar que aún contuviera la cédula (cuentas anteriores a D388 sin pasar) no sale: el avatar
 * se dibuja con el id.
 */
export function rankingPublico(
  r: RankingSeccion,
  idDe: IdAlumno,
): RankingPublico {
  return {
    ...r,
    alumnos: Object.fromEntries(
      Object.entries(r.alumnos).map(([cedula, { semilla, ...f }]) => [
        idDe(cedula),
        semilla === undefined || semillaConCedula(semilla, cedula)
          ? f
          : { ...f, semilla },
      ]),
    ),
  };
}

/**
 * Un compañero tal como lo pinta la vista de otro alumno (D496): si su semilla de avatar aún
 * contiene la cédula (cuenta anterior a D388 sin pasar), el avatar se dibuja con su id público,
 * igual que en el ranking.
 */
export function conSemillaPublica<
  T extends { cedula: string; avatar: { estilo: string; semilla: string } },
>(u: T, idDe: IdAlumno): T {
  return semillaConCedula(u.avatar.semilla, u.cedula)
    ? { ...u, avatar: { ...u.avatar, semilla: idDe(u.cedula) } }
    : u;
}
