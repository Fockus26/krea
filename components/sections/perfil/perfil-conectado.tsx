"use client";
// Perfil conectado a Firestore y Auth (fase 07, D191, D192): las piezas de /secciones/perfil con
// sus `onChange` llevados a Server Actions. Lo guardado se confirma con toast; si falla, el toast
// lo dice y lo elegido queda solo en este dispositivo.
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cambiarPassword,
  guardarApariencia,
  guardarAvatar,
} from "@/lib/acciones/perfil";
import { desuscribirPush, suscribirPush } from "@/lib/acciones/push";
import type { DicebearEstilo } from "@/lib/dicebear";
import type { Apariencia } from "@/lib/modelo";
import { ERROR_CAMBIO_PASSWORD } from "@/lib/perfil";
import { RUTA_INGRESAR } from "@/lib/sesion";
import { AppearanceSettings } from "./appearance-settings";
import { AvatarPicker } from "./avatar-picker";
import { AvisoTareas, InstalarKrea } from "./aviso-tareas";
import { SecuritySettings } from "./security-settings";

// PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127): no están en el lienzo
const TOAST_AVATAR = "Avatar guardado";
const TOAST_NO_GUARDADO =
  "No se pudo guardar en tu perfil. Revisa tu internet y vuelve a intentar.";
const TOAST_APARIENCIA_NO =
  "No se pudo guardar en tu perfil: el cambio vale solo en este dispositivo.";
const TOAST_PASSWORD = "Contraseña actualizada. Cerramos tus otras sesiones.";

export function AvatarPickerConectado({
  nombre,
  estilo,
  seed,
  base,
}: {
  nombre: string;
  estilo: DicebearEstilo;
  seed: string;
  base: string;
}) {
  return (
    <AvatarPicker
      nombre={nombre}
      estilo={estilo}
      seed={seed}
      base={base}
      onChange={async ({ estilo: e, seed: s }) => {
        const r = await guardarAvatar({ estilo: e, semilla: s });
        if (!r.ok) {
          toast(TOAST_NO_GUARDADO);
          return;
        }
        // La topbar y la barra lateral ya vuelven a leer el perfil: `refresh()` en la acción
        toast(TOAST_AVATAR);
      }}
    />
  );
}

export function AparienciaConectada({
  inicial,
}: {
  inicial: Apariencia | null;
}) {
  return (
    <AppearanceSettings
      inicial={inicial}
      onChange={async (pref) => {
        const r = await guardarApariencia(pref);
        if (!r.ok) toast(TOAST_APARIENCIA_NO);
      }}
    />
  );
}

/**
 * El aviso de tarea nueva llevado a las Server Actions (D335). Sin VAPID no hay interruptor, pero
 * sí la tarjeta para instalar la app (D371).
 */
export function AvisoTareasConectado({
  clavePublica,
}: {
  clavePublica: string | null;
}) {
  if (!clavePublica) return <InstalarKrea />;
  return (
    <AvisoTareas
      clavePublica={clavePublica}
      onSuscribir={async (sub) => (await suscribirPush(sub)).ok}
      onDesuscribir={async (endpoint) => (await desuscribirPush(endpoint)).ok}
    />
  );
}

export function SeguridadConectada({ salirHref }: { salirHref: string }) {
  const router = useRouter();
  return (
    <SecuritySettings
      salirHref={salirHref}
      onCambiar={async (datos) => {
        const r = await cambiarPassword(datos);
        if (!r.ok) {
          return {
            campo: r.error === "actual" ? "actual" : "general",
            mensaje: ERROR_CAMBIO_PASSWORD[r.error],
          };
        }
        toast(TOAST_PASSWORD);
        if (!r.sesionRenovada) router.replace(RUTA_INGRESAR);
        return null;
      }}
    />
  );
}
