// Lógica pura de Equipos del profesor (HANDOFF §3 Equipos, §2.13; D110–D113). Sin React ni reloj:
// el estado (quién está en qué equipo, quién es capitán) es un valor inmutable y cada acción
// devuelve uno nuevo. Salvo `dibujarLogo`, que necesita DOM, todo está probado.

import { integrantesTexto } from "./sections";
import { formatDecimal } from "./stepper";

export type SeccionEquipos = "5A" | "5C";

/** Un equipo en el estado local: cédulas en orden de llegada y capitán (`null` si quedó vacío). */
export type EquipoEstado = {
  miembros: readonly string[];
  capitan: string | null;
};

export type EstadoEquipos = {
  equipos: Readonly<Record<string, EquipoEstado>>;
  /** Cédulas de los alumnos de la sección que no tienen equipo. */
  sinEquipo: readonly string[];
};

/** Integrante en el tablero: nombre completo y su avatar. */
export type AlumnoEquipo = {
  cedula: string;
  nombre: string;
  /** Semilla del avatar (la elegida en Perfil; en la vista previa, la cédula). */
  seed: string;
  /** Estilo del avatar (ausente en la vista previa: el de por defecto). */
  estilo?: string;
};

export type EquipoVista = {
  id: string;
  nombre: string;
  tema: string | null;
  puesto: number;
  puntos: number;
  empate: boolean;
  /** URL firmada del logo (D212); `null`/ausente → iniciales. */
  logo?: string | null;
  /** Entregas grupales y ajustes del equipo: con alguno no se elimina (D271). */
  conDatos?: { entregas: number; ajustes: number };
};

export type DatosEquiposProfe = {
  seccion: SeccionEquipos;
  /** Equipos de la sección en el orden del ranking (el del lienzo: puesto, luego nombre). */
  equipos: EquipoVista[];
  alumnos: Record<string, AlumnoEquipo>;
  inicial: EstadoEquipos;
  /** Alumnos de la sección (para «n de N con equipo»). */
  total: number;
};

// ---------- Textos ----------

/** "5A · 6 equipos · 30 de 35 con equipo". */
export function eyebrowEquipos(
  seccion: SeccionEquipos,
  equipos: number,
  conEquipo: number,
  total: number,
): string {
  const unidad = equipos === 1 ? "equipo" : "equipos";
  return `${seccion} · ${equipos} ${unidad} · ${conEquipo} de ${total} con equipo`;
}

/** Cuántos alumnos de la sección tienen equipo, del mismo estado que pinta las tarjetas. */
export function conEquipoTotal(estado: EstadoEquipos): number {
  return Object.values(estado.equipos).reduce(
    (n, e) => n + e.miembros.length,
    0,
  );
}

/** "#1 · 19 pts" / "#3 · 17 pts · empate" (puntos con coma es-VE, nunca `toFixed`). */
export function chipPuestoTexto(
  puesto: number,
  puntos: number,
  empate: boolean,
): string {
  return `#${puesto} · ${formatDecimal(puntos, 0.1)} pts${empate ? " · empate" : ""}`;
}

/** "Sin equipo · 5". */
export function sinEquipoTitulo(n: number): string {
  return `Sin equipo · ${n}`;
}

/** "Tema: Repostería · 4 integrantes". Sin tema (dos equipos de 5C): texto provisional. */
export function metaEquipoTexto(tema: string | null, n: number): string {
  return `${tema ? `Tema: ${tema}` : "Sin tema elegido"} · ${integrantesTexto(n)}`;
}

/** Nombre accesible del botón de menú de cada integrante. */
export function moverLabel(nombre: string): string {
  return `Mover a ${nombre} a otro equipo`;
}

/** Nombre accesible de «Subir logo»/«Cambiar»: el equipo va en el nombre, no solo en la tarjeta. */
export function logoLabel(accion: "Subir logo" | "Cambiar", equipo: string) {
  return accion === "Subir logo"
    ? `Subir logo de ${equipo}`
    : `Cambiar logo de ${equipo}`;
}

export function movidoTexto(nombre: string, equipo: string): string {
  return `${nombre} pasó a ${equipo}`;
}

export function quitadoTexto(nombre: string, equipo: string): string {
  return `${nombre} salió de ${equipo} y quedó sin equipo`;
}

export function capitanTexto(nombre: string, equipo: string): string {
  return `${nombre} es el capitán de ${equipo}`;
}

export const SIN_EQUIPO_NOTA = "No suman notas grupales hasta tener equipo";
export const SIN_EQUIPO_VACIO =
  "Todos los alumnos de la sección tienen equipo.";
export const EQUIPO_VACIO =
  "Este equipo no tiene integrantes. Asígnale alumnos desde «Sin equipo» o desde el menú de otro equipo.";
export const CAPITAN_AYUDA = "Solo el capitán envía las tareas grupales.";

// ---------- Menú «Mover a…» ----------

export type DestinoMover = { id: string; nombre: string };

/**
 * Opciones del menú: los otros equipos de la sección (en el orden dado) y «Quitar del equipo»
 * solo si el alumno tiene equipo (`origen` ≠ null).
 */
export function opcionesMover(
  equipos: readonly DestinoMover[],
  origen: string | null,
): { destinos: DestinoMover[]; puedeQuitar: boolean } {
  return {
    destinos: equipos.filter((e) => e.id !== origen),
    puedeQuitar: origen !== null,
  };
}

// ---------- Estado ----------

/** Equipo en el que está la cédula, o `null` si está en «Sin equipo» (o no está). */
export function equipoDeCedula(
  estado: EstadoEquipos,
  cedula: string,
): string | null {
  for (const [id, e] of Object.entries(estado.equipos)) {
    if (e.miembros.includes(cedula)) return id;
  }
  return null;
}

/** Integrantes con el capitán primero; el resto en su orden. */
export function miembrosOrdenados(equipo: EquipoEstado): string[] {
  const { capitan } = equipo;
  if (capitan === null) return [...equipo.miembros];
  return [capitan, ...equipo.miembros.filter((c) => c !== capitan)];
}

/** Un equipo de 1 tiene capitán automático; con 2 o más se conserva el elegido. */
function normalizar(miembros: readonly string[], capitan: string | null) {
  if (miembros.length === 0) return { miembros, capitan: null };
  if (miembros.length === 1) return { miembros, capitan: miembros[0] ?? null };
  return {
    miembros,
    capitan:
      capitan !== null && miembros.includes(capitan)
        ? capitan
        : (miembros[0] ?? null),
  };
}

/**
 * Pasa a un alumno a otro equipo (`destino` = id) o lo deja sin equipo (`destino` = `null`).
 * Al sacar al capitán, el siguiente integrante pasa a capitán; un equipo que queda vacío se
 * queda sin capitán; el primero que llega a un equipo vacío es su capitán. Si el alumno ya
 * está ahí, devuelve el mismo estado.
 */
export function moverAlumno(
  estado: EstadoEquipos,
  cedula: string,
  destino: string | null,
): EstadoEquipos {
  const origen = equipoDeCedula(estado, cedula);
  if (origen === destino) return estado;
  if (destino !== null && !estado.equipos[destino]) return estado;
  if (origen === null && !estado.sinEquipo.includes(cedula)) return estado;

  const equipos: Record<string, EquipoEstado> = { ...estado.equipos };
  let sinEquipo = estado.sinEquipo.filter((c) => c !== cedula);

  const salida = origen === null ? undefined : equipos[origen];
  if (origen !== null && salida) {
    const resto = salida.miembros.filter((c) => c !== cedula);
    // Sacar al capitán: el siguiente en la lista (capitán primero) toma el cargo
    const capitan =
      salida.capitan === cedula ? (resto[0] ?? null) : salida.capitan;
    equipos[origen] = normalizar(resto, capitan);
  }

  const entrada = destino === null ? undefined : equipos[destino];
  if (destino !== null && entrada) {
    equipos[destino] = normalizar(
      [...entrada.miembros, cedula],
      entrada.miembros.length === 0 ? cedula : entrada.capitan,
    );
  } else {
    sinEquipo = [...sinEquipo, cedula];
  }
  return { equipos, sinEquipo };
}

/** Cambia el capitán de un equipo; ignora a quien no es integrante. */
export function cambiarCapitan(
  estado: EstadoEquipos,
  equipo: string,
  cedula: string,
): EstadoEquipos {
  const e = estado.equipos[equipo];
  if (!e || !e.miembros.includes(cedula) || e.capitan === cedula) return estado;
  return {
    ...estado,
    equipos: { ...estado.equipos, [equipo]: { ...e, capitan: cedula } },
  };
}

// ---------- Logo ----------

/** Formatos del logo (el de `lib/image.ts` solo acepta JPG/PNG: no se edita). */
export const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const LOGO_ACCEPT = LOGO_TYPES.join(",");
/** 5 MB. */
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
/** Lado del cuadrado final, en píxeles. */
export const LOGO_LADO = 512;

export type LogoValidacion = { ok: true } | { ok: false; message: string };

export function validarLogo(file: {
  type: string;
  size: number;
}): LogoValidacion {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: "Solo se aceptan imágenes JPG, PNG o WebP." };
  }
  if (file.size <= 0) {
    return { ok: false, message: "El archivo está vacío. Elige otra imagen." };
  }
  if (file.size > LOGO_MAX_BYTES) {
    const mb = formatDecimal(file.size / (1024 * 1024), 0.1);
    return {
      ok: false,
      message: `La imagen pesa ${mb} MB. El máximo es 5 MB.`,
    };
  }
  return { ok: true };
}

export type Recorte = { x: number; y: number; lado: number };

/** Cuadrado centrado del mayor tamaño posible dentro de `ancho × alto`. */
export function recorteCuadrado(ancho: number, alto: number): Recorte {
  const lado = Math.min(ancho, alto);
  return {
    x: Math.floor((ancho - lado) / 2),
    y: Math.floor((alto - lado) / 2),
    lado,
  };
}

/**
 * Recorta el centro de la imagen y lo dibuja a 512 × 512 en el cliente (necesita DOM:
 * `createImageBitmap` + `canvas`). Devuelve un WebP. El cálculo es `recorteCuadrado`.
 */
export async function dibujarLogo(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const { x, y, lado } = recorteCuadrado(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = LOGO_LADO;
    canvas.height = LOGO_LADO;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, x, y, lado, lado, 0, 0, LOGO_LADO, LOGO_LADO);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("blob"))),
        "image/webp",
        0.9,
      ),
    );
  } finally {
    bitmap.close();
  }
}
