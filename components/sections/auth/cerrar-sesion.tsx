"use client";
// Cierra la sesión al montar (D182, D327): revoca las sesiones y borra la cookie en el servidor,
// y vuelve a Ingresar. Es una página (no un GET que borre la cookie): el prefetch de un
// enlace a /salir no ejecuta este efecto.
// Ingresar se abre con una carga completa, no con el router (D251): así no quedan en memoria la
// caché del router ni las rutas que `<Activity>` conserva ocultas con lo de la cuenta que salió.
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cerrarSesion } from "@/lib/acciones/sesion";
import { vaciarPaginasGuardadas } from "@/lib/offline/sw-cliente";
import { RUTA_INGRESAR } from "@/lib/sesion";

export function CerrarSesion() {
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    (async () => {
      try {
        await cerrarSesion();
      } finally {
        // Las páginas guardadas para leer sin conexión son de quien sale (D291). La cola de
        // envíos no se borra: es suya y se envía cuando vuelva a entrar (D292).
        await vaciarPaginasGuardadas();
        window.location.replace(RUTA_INGRESAR);
      }
    })();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      {/* PROVISIONAL (CONTENT_CHECKLIST fila 139): copy del tema escolar */}
      <h1 className="text-h1 text-text">¡Hasta luego!</h1>
      <p className="text-body text-text-2">Guardando tu mochila…</p>
      <Spinner label="Guardando tu mochila" />
    </div>
  );
}
