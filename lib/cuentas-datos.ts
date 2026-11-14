// Cuentas nuevas y pantalla Profesores (D231–D233). Puro (sin Firebase ni reloj): la contraseña
// temporal, lo que mandan los formularios, el perfil que se crea y las filas de la lista. Lo usan
// `lib/cuentas.ts` (servidor), `lib/data/cuentas.ts` (Postgres), la UI y las pruebas.
import { z } from "zod";
import { APELLIDOS_VACIO, EMAIL_INVALIDO, NOMBRES_VACIO } from "@/lib/alumnos";
import { zEmailEntrada } from "@/lib/alumnos-datos";
import { validateCedula } from "@/lib/cedula";
import { type Usuario, zBase, zCedula, zSeccion, zUsuario } from "@/lib/modelo";
import { cedulaTexto, semillaConCedula } from "@/lib/perfil";
import { ESTILO_AVATAR_DEFECTO } from "@/lib/seed-firestore";

/* ---------- Contraseña temporal (D232) ---------- */

/**
 * Alfabeto de la contraseña temporal: letras y cifras sin las que se confunden al dictarlas o
 * copiarlas a mano (0/O/o, 1/l/I). 56 símbolos.
 */
export const ALFABETO_TEMPORAL =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Caracteres al azar de la contraseña temporal (sin contar los guiones): ~70 bits. */
export const LARGO_TEMPORAL = 12;
/** Se muestra en bloques de 4 con guion («Kx7m-Pq4r-T9wz»): los guiones son parte de ella. */
const BLOQUE = 4;

/** Bytes al azar; por defecto `crypto.getRandomValues` (en las pruebas, uno fijo). */
export type Aleatorio = (n: number) => Uint8Array;

const cripto: Aleatorio = (n) => crypto.getRandomValues(new Uint8Array(n));

/**
 * Contraseña temporal: 12 símbolos de `ALFABETO_TEMPORAL` en 3 bloques de 4 unidos por guion.
 * Muestreo por rechazo (descarta los bytes ≥ 224) para que todos los símbolos salgan igual de
 * probables. Nunca se guarda ni se registra: solo se devuelve a quien crea la cuenta.
 */
export function generarPasswordTemporal(aleatorio: Aleatorio = cripto): string {
  const n = ALFABETO_TEMPORAL.length;
  const limite = Math.floor(256 / n) * n;
  const simbolos: string[] = [];
  while (simbolos.length < LARGO_TEMPORAL) {
    for (const b of aleatorio(LARGO_TEMPORAL * 2)) {
      if (b >= limite) continue;
      simbolos.push(ALFABETO_TEMPORAL[b % n] ?? "");
      if (simbolos.length === LARGO_TEMPORAL) break;
    }
  }
  const bloques: string[] = [];
  for (let i = 0; i < LARGO_TEMPORAL; i += BLOQUE)
    bloques.push(simbolos.slice(i, i + BLOQUE).join(""));
  return bloques.join("-");
}

/* ---------- Crear una cuenta (genérica por rol, W12 la reutiliza) ---------- */

const zNombres = zUsuario.shape.nombres;
const zApellidos = zUsuario.shape.apellidos;
/** Email de recuperación: vacío → `null`. */
const zEmailNulo = zEmailEntrada.transform((v) => (v === "" ? null : v));

export const zEntradaCuenta = z.discriminatedUnion("rol", [
  z.object({
    rol: z.literal("profesor"),
    cedula: zCedula,
    nombres: zNombres,
    apellidos: zApellidos,
    email: zEmailNulo,
  }),
  z.object({
    rol: z.literal("estudiante"),
    cedula: zCedula,
    nombres: zNombres,
    apellidos: zApellidos,
    email: zEmailNulo,
    seccion: zSeccion,
    /** Ausente: 20 (D006). */
    base: zBase.optional(),
  }),
]);
export type EntradaCuenta = z.input<typeof zEntradaCuenta>;
export type CuentaNueva = z.output<typeof zEntradaCuenta>;

/**
 * Perfil `usuarios/{cedula}` de una cuenta nueva: avatar por defecto con una semilla opaca que
 * genera quien llama (`semillaAvatarNueva`, D388: nunca la cédula, que la URL de DiceBear
 * mostraría), sin equipo, base 20 si no se dice otra, y `debeCambiarPassword` (D232). Nunca
 * admin: eso solo lo pone el script (`scripts/admin-profesor.ts`).
 */
export function usuarioNuevo(
  c: CuentaNueva,
  ahora: number,
  semilla: string,
): Usuario {
  if (semillaConCedula(semilla, c.cedula))
    throw new Error("usuarioNuevo: la semilla del avatar contiene la cédula");
  return {
    cedula: c.cedula,
    rol: c.rol,
    nombres: c.nombres,
    apellidos: c.apellidos,
    seccion: c.rol === "estudiante" ? c.seccion : null,
    equipoId: null,
    base: c.rol === "estudiante" ? (c.base ?? 20) : 20,
    avatar: { estilo: ESTILO_AVATAR_DEFECTO, semilla },
    debeCambiarPassword: true,
    actualizadoEn: ahora,
  };
}

/** `crearCuenta` / `eliminarCuenta` no pudieron: el código dice por qué (sin datos personales). */
export class ErrorCuenta extends Error {
  constructor(readonly codigo: "existe" | "no-existe" | "red") {
    super(`cuenta: ${codigo}`);
    this.name = "ErrorCuenta";
  }
}

/* ---------- Pantalla Profesores (D233) ---------- */

/** Crear profesor: lo que manda el formulario (el rol lo pone la acción). */
export const zCrearProfesor = z.object({
  cedula: zCedula,
  nombres: zNombres,
  apellidos: zApellidos,
  email: zEmailEntrada,
});
export type CrearProfesor = z.input<typeof zCrearProfesor>;

/** Editar profesor: la cédula identifica (es el uid, D174) y no cambia. */
export const zEditarProfesor = zCrearProfesor;
export type EditarProfesor = CrearProfesor;

/** Sus propios nombres y apellidos en Perfil (solo el profesor; el alumno los ve de solo lectura). */
export const zMisDatos = z.object({
  nombres: zNombres,
  apellidos: zApellidos,
});
export type MisDatos = z.input<typeof zMisDatos>;

export type ErroresProfesor = {
  cedula?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
};

/**
 * Validación del formulario Crear/Editar profesor en el cliente (el servidor vuelve a validar con
 * zod). `cedula` ausente: edición (la cédula no se cambia). Copy de lib/cedula.ts y lib/alumnos.ts.
 */
export function validarProfesor(f: {
  cedula?: string;
  primerNombre: string;
  primerApellido: string;
  email: string;
}): ErroresProfesor {
  const e: ErroresProfesor = {};
  if (f.cedula !== undefined) {
    const c = validateCedula(f.cedula);
    if (c) e.cedula = c;
  }
  if (f.primerNombre.trim() === "") e.nombres = NOMBRES_VACIO;
  if (f.primerApellido.trim() === "") e.apellidos = APELLIDOS_VACIO;
  if (!zEmailEntrada.safeParse(f.email).success) e.email = EMAIL_INVALIDO;
  return e;
}

export type ErrorProfesor =
  | "invalida"
  | "existe"
  | "no-existe"
  | "no-profesor"
  | "tu-cuenta"
  | "red";

export type ResultadoCrearProfesor =
  | { ok: true; passwordTemporal: string }
  | { ok: false; error: ErrorProfesor };
export type ResultadoProfesor =
  | { ok: true }
  | { ok: false; error: ErrorProfesor };

/** Mensaje del servidor bajo el formulario o en el diálogo. PROVISIONAL (fila 137). */
export function errorProfesorTexto(e: ErrorProfesor): string {
  switch (e) {
    case "existe":
      return "Ya existe una cuenta con esa cédula.";
    case "no-existe":
      return "Este profesor ya no está en la lista. Recarga la página.";
    case "no-profesor":
      return "Esa cédula es de un alumno: aquí solo se gestionan profesores.";
    case "tu-cuenta":
      return "No puedes eliminar tu propia cuenta.";
    case "invalida":
      return "Revisa los datos: algo no se pudo guardar así.";
    case "red":
      return "Se perdió la conexión. No cambiamos nada: vuelve a intentarlo.";
  }
}

export type FilaProfesor = {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  estilo: string;
  semilla: string;
  admin: boolean;
  /** Aún no creó su contraseña (entró con la temporal o no ha entrado). */
  pendiente: boolean;
  /** Es la sesión: no se puede eliminar. */
  tu: boolean;
};

/* Textos de la lista. PROVISIONAL (CONTENT_CHECKLIST fila 137): la pantalla no está en el lienzo */

export const nombreProfesor = (
  p: Pick<FilaProfesor, "nombres" | "apellidos">,
) => `${p.nombres} ${p.apellidos}`;

/** «C.I. 30.262.232 · ana@gmail.com», o «… · Sin email de recuperación». */
export function detalleProfesor(
  p: Pick<FilaProfesor, "cedula" | "email">,
): string {
  return `${cedulaTexto(p.cedula)} · ${p.email ?? "Sin email de recuperación"}`;
}

/** Eyebrow: «1 profesor» / «3 profesores». */
export function contadorProfesores(n: number): string {
  return `${n} ${n === 1 ? "profesor" : "profesores"}`;
}

/** Filas de la lista: solo profesores, ordenados por apellidos y nombres (es-VE). */
export function filasProfesores(
  usuarios: ReadonlyArray<Usuario>,
  emails: Readonly<Record<string, string | null>>,
  yo: string,
): FilaProfesor[] {
  return usuarios
    .filter((u) => u.rol === "profesor")
    .map((u) => ({
      cedula: u.cedula,
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: emails[u.cedula] ?? null,
      estilo: u.avatar.estilo,
      semilla: u.avatar.semilla,
      admin: u.admin === true,
      pendiente: u.debeCambiarPassword === true,
      tu: u.cedula === yo,
    }))
    .sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(
        `${b.apellidos} ${b.nombres}`,
        "es-VE",
      ),
    );
}
