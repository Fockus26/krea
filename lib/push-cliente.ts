// Lado del navegador del aviso de tarea nueva (D335, D339): saber si se puede, pedir el permiso,
// suscribir ESTE navegador y quitarlo. Todo pasa por el service worker propio (D291), que solo se
// registra en producción: en `next dev` el aviso no se puede activar.
import { bytesDeClave } from "@/lib/push";

export type EstadoAviso =
  | "cargando"
  | "no-soportado"
  | "denegado"
  | "activado"
  | "desactivado";

/** Cuánto se espera a que el service worker esté listo al activar. */
const ESPERA_SW_MS = 5000;

/** En iPhone, Safari solo trae `PushManager` con KREA instalada en la pantalla de inicio (iOS 16.4+). */
export function hayPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function estadoAviso(): Promise<EstadoAviso> {
  if (!hayPush()) return "no-soportado";
  if (Notification.permission === "denied") return "denegado";
  try {
    const sub = await suscripcionActual();
    return sub && Notification.permission === "granted"
      ? "activado"
      : "desactivado";
  } catch {
    return "desactivado";
  }
}

function swListo(): Promise<ServiceWorkerRegistration | null> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), ESPERA_SW_MS)),
  ]);
}

export type ResultadoActivar = "activado" | "denegado" | "cancelado" | "error";

/**
 * Pide el permiso (tiene que ser lo primero tras el toque: iOS y Firefox lo exigen dentro del
 * gesto), suscribe este navegador y lo guarda con `guardar`. Si guardar falla, se deshace.
 */
export async function activarAviso(
  clavePublica: string,
  guardar: (sub: PushSubscriptionJSON) => Promise<boolean>,
): Promise<ResultadoActivar> {
  let permiso: NotificationPermission;
  try {
    permiso = await Notification.requestPermission();
  } catch {
    return "error";
  }
  if (permiso === "denied") return "denegado";
  if (permiso !== "granted") return "cancelado";
  const reg = await swListo();
  if (!reg) return "error";
  const opciones: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey: bytesDeClave(clavePublica),
  };
  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe(opciones);
  } catch {
    // Una suscripción vieja con otra clave VAPID no deja crear la nueva: fuera y otra vez
    try {
      await (await reg.pushManager.getSubscription())?.unsubscribe();
      sub = await reg.pushManager.subscribe(opciones);
    } catch {
      return "error";
    }
  }
  if (await guardar(sub.toJSON()).catch(() => false)) return "activado";
  await sub.unsubscribe().catch(() => {});
  return "error";
}

/** Quita la suscripción de este navegador y avisa al servidor con `quitar`. */
export async function desactivarAviso(
  quitar: (endpoint: string) => Promise<boolean>,
): Promise<boolean> {
  try {
    const sub = await suscripcionActual();
    if (!sub) return true;
    const { endpoint } = sub;
    await sub.unsubscribe();
    // Si el servidor no se entera, la fila se borra sola con el 410 del próximo envío
    await quitar(endpoint).catch(() => false);
    return true;
  } catch {
    return false;
  }
}

/** Al cerrar sesión: este navegador deja de recibir avisos de la cuenta que sale. */
export async function cancelarAvisoLocal() {
  if (!hayPush()) return;
  try {
    await (await suscripcionActual())?.unsubscribe();
  } catch {
    // Nada que cancelar
  }
}
