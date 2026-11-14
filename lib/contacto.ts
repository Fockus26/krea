// Contacto opcional del profesor para sus alumnos (D378–D380). Puro (sin base ni reloj): normaliza
// y valida el celular venezolano (→ WhatsApp), el correo (→ mailto), lo que manda el formulario de
// Perfil y las tarjetas de «Tus profesores». Lo usan el formulario (cliente), la Server Action y
// la lectura del alumno (servidor), y las pruebas.
import { z } from "zod";
import { EMAIL_INVALIDO } from "@/lib/alumnos";
import type { DicebearEstilo } from "@/lib/dicebear";
import { semillaConCedula } from "@/lib/perfil";
import { estiloDe, nombreCorto } from "@/lib/vistas-estudiante";

/**
 * Prefijos de las operadoras móviles (D379): Movilnet 0416 y 0426, Movistar 0414 y 0424, Digitel
 * 0412 y 0422. Los fijos (02xx) no se aceptan: el enlace abre WhatsApp.
 */
export const OPERADORAS_MOVILES = [
  "412",
  "414",
  "416",
  "422",
  "424",
  "426",
] as const;

/** Código de país de Venezuela. */
const PAIS = "58";
/** Cifras del número nacional sin el 0 inicial: operadora (3) + abonado (7). */
const LARGO_NACIONAL = 10;

// PROVISIONAL (CONTENT_CHECKLIST fila 195): error del teléfono (la ayuda se quitó, D390)
export const TELEFONO_INVALIDO =
  "Escribe un celular venezolano, como 0412-1234567.";

/**
 * Lo que escribe el profe → E.164 sin `+` (`584121234567`), o `null` si no es un celular
 * venezolano. Acepta `0412-1234567`, `0412 123 4567`, `(0412) 123.45.67`, `+58 412 1234567`,
 * `0058…`, `58…` y `4121234567`; los separadores (espacio, guion, punto, paréntesis) se ignoran.
 */
export function normalizarTelefono(entrada: string): string | null {
  const limpio = entrada.trim().replace(/[\s\-.()]/g, "");
  let nacional: string;
  if (/^\+58\d+$/.test(limpio)) nacional = limpio.slice(3);
  else if (/^0058\d+$/.test(limpio)) nacional = limpio.slice(4);
  else if (/^58\d{10}$/.test(limpio)) nacional = limpio.slice(2);
  else if (/^0\d{10}$/.test(limpio)) nacional = limpio.slice(1);
  else if (/^\d{10}$/.test(limpio)) nacional = limpio;
  else return null;
  // «+58 0412…» también se escribe: el 0 nacional sobra tras el código de país
  if (nacional.length === LARGO_NACIONAL + 1 && nacional.startsWith("0"))
    nacional = nacional.slice(1);
  if (!/^\d+$/.test(nacional) || nacional.length !== LARGO_NACIONAL)
    return null;
  const operadora = nacional.slice(0, 3);
  if (!(OPERADORAS_MOVILES as readonly string[]).includes(operadora))
    return null;
  return `${PAIS}${nacional}`;
}

/** `584121234567` → `0412-123 45 67` (como se dicta en Venezuela). Otro valor sale tal cual. */
export function telefonoTexto(e164: string): string {
  if (!/^58\d{10}$/.test(e164)) return e164;
  const n = e164.slice(2);
  return `0${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
}

/** Enlace de WhatsApp («click to chat»): solo cifras, con código de país y sin `+`. */
export function enlaceWhatsApp(e164: string): string {
  return `https://wa.me/${e164}`;
}

export function enlaceCorreo(email: string): string {
  return `mailto:${email}`;
}

/** Mismo criterio que el email de recuperación (`zEmailEntrada`): vacío vale, cualquier dominio. */
const zCorreoEntrada = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => v === "" || z.email().safeParse(v).success, EMAIL_INVALIDO);

/**
 * Lo que manda «Contacto para tus alumnos». Ambos opcionales: vacío = borrar (`null`). El servidor
 * guarda el teléfono ya normalizado.
 */
export const zContacto = z
  .object({
    telefono: z
      .string()
      .max(40)
      .refine(
        (v) => v.trim() === "" || normalizarTelefono(v) !== null,
        TELEFONO_INVALIDO,
      ),
    email: zCorreoEntrada,
  })
  .transform((c) => ({
    telefono: c.telefono.trim() === "" ? null : normalizarTelefono(c.telefono),
    emailContacto: c.email === "" ? null : c.email,
  }));
export type ContactoEntrada = z.input<typeof zContacto>;
export type Contacto = z.output<typeof zContacto>;

/** Errores del formulario en el cliente (el servidor vuelve a validar con `zContacto`). */
export function erroresContacto(c: ContactoEntrada): {
  telefono?: string;
  email?: string;
} {
  const r = zContacto.safeParse(c);
  if (r.success) return {};
  const e: { telefono?: string; email?: string } = {};
  for (const i of r.error.issues) {
    if (i.path[0] === "telefono") e.telefono = TELEFONO_INVALIDO;
    if (i.path[0] === "email") e.email = EMAIL_INVALIDO;
  }
  return e;
}

/** Contacto guardado → valores del formulario (el teléfono como se muestra). */
export function contactoAFormulario(c: Contacto): ContactoEntrada {
  return {
    telefono: c.telefono ? telefonoTexto(c.telefono) : "",
    email: c.emailContacto ?? "",
  };
}

/* ---------- «Tus profesores» (alumno) ---------- */

/** Avatar del profe tal como lo ve el alumno: estilo y una semilla que no contiene su cédula. */
export type AvatarContactoProfe = { estilo: string; semilla: string };

/**
 * Lo único que la lectura del alumno trae de cada profe: nunca la cédula ni el email de
 * recuperación. El avatar viaja solo si su semilla ya es opaca (D388): si aún contiene la cédula
 * (SQL de datos sin aplicar), la lectura lo deja en `null` y la tarjeta usa las iniciales.
 */
export type FilaContactoProfe = {
  nombres: string;
  apellidos: string;
  telefono: string | null;
  emailContacto: string | null;
  avatar: AvatarContactoProfe | null;
};

/**
 * El avatar que puede ver el alumno (D388): `null` si la semilla contiene la cédula del profe.
 * Se aplica en el servidor (`contactosDeProfes`): la cédula nunca llega al cliente.
 */
export function avatarVisibleProfe(
  avatar: AvatarContactoProfe,
  cedula: string,
): AvatarContactoProfe | null {
  return semillaConCedula(avatar.semilla, cedula)
    ? null
    : { estilo: avatar.estilo, semilla: avatar.semilla };
}

export type TarjetaProfe = {
  /** Clave de la lista: el nombre corto + su posición (no hace falta la cédula). */
  clave: string;
  nombre: string;
  /** `null`: iniciales (semilla aún con la cédula, D388). */
  avatar: { estilo: DicebearEstilo; seed: string } | null;
  whatsapp: { href: string; texto: string } | null;
  correo: { href: string; texto: string } | null;
};

/**
 * Profes con al menos un dato de contacto válido, por nombre. Un teléfono o correo guardado que ya
 * no valida (cargado a mano en la base) no se muestra; si no queda ninguno, el profe no sale.
 */
export function tarjetasProfes(
  filas: readonly FilaContactoProfe[],
): TarjetaProfe[] {
  const tarjetas: Omit<TarjetaProfe, "clave">[] = [];
  for (const f of filas) {
    const tel = f.telefono ? normalizarTelefono(f.telefono) : null;
    const correo =
      f.emailContacto && z.email().safeParse(f.emailContacto).success
        ? f.emailContacto
        : null;
    if (!tel && !correo) continue;
    tarjetas.push({
      nombre: nombreCorto(f),
      avatar: f.avatar
        ? { estilo: estiloDe(f.avatar.estilo), seed: f.avatar.semilla }
        : null,
      whatsapp: tel
        ? { href: enlaceWhatsApp(tel), texto: telefonoTexto(tel) }
        : null,
      correo: correo ? { href: enlaceCorreo(correo), texto: correo } : null,
    });
  }
  return tarjetas
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((t, i) => ({ ...t, clave: `${i}-${t.nombre}` }));
}
