"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { TOAST_SESION, tituloRechazo, toastEnviada } from "@/lib/offline/cola";
import { alDrenar, drenarCola, fijarUsuario } from "@/lib/offline/navegador";
import { avisarUsuarioServiceWorker } from "@/lib/offline/sw-cliente";
import { RUTA_INGRESAR } from "@/lib/sesion";

/** Un aviso de «entra de nuevo» cada tanto, no en cada vuelta a la pestaña. */
const AVISO_SESION_MS = 5 * 60_000;
let ultimoAvisoSesion = 0;

/**
 * Drenador de la cola sin conexión (D292): vive en el layout de cada rol. Fija la sesión de la
 * cola y del service worker, y drena al abrir la app, al volver la red y al volver a la pestaña
 * (Safari iOS no tiene Background Sync). Avisa con toasts lo que drenó ESTA pestaña; las
 * Server Actions ya refrescan la ruta (`refresh()`), y un rechazo la refresca aquí.
 */
export function ColaOffline({ usuario }: { usuario: string | null }) {
  const router = useRouter();

  useEffect(() => {
    fijarUsuario(usuario);
    if (usuario) avisarUsuarioServiceWorker(usuario);
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const intentar = () => {
      if (navigator.onLine) void drenarCola();
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") intentar();
    };
    const quitar = alDrenar((d) => {
      for (const h of d.hechas) toast.success(toastEnviada(h.op));
      for (const r of d.rechazadas)
        toast.error(tituloRechazo(r), { description: r.mensaje });
      if (d.rechazadas.length > 0) router.refresh();
      if (
        d.detenido === "sesion" &&
        Date.now() - ultimoAvisoSesion > AVISO_SESION_MS
      ) {
        ultimoAvisoSesion = Date.now();
        toast(TOAST_SESION, {
          action: {
            label: "Entrar",
            onClick: () => window.location.assign(RUTA_INGRESAR),
          },
        });
      }
    });
    intentar();
    window.addEventListener("online", intentar);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      quitar();
      window.removeEventListener("online", intentar);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [usuario, router]);

  return null;
}
