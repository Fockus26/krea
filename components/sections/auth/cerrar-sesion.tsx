"use client";
// Cierra la sesión al montar (D182): Firebase Auth del navegador + cookie y revocación en el
// servidor, y vuelve a Ingresar. Es una página (no un GET que borre la cookie): el prefetch de un
// enlace a /salir no ejecuta este efecto.
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cerrarSesion } from "@/lib/acciones/sesion";
import { firebaseCliente } from "@/lib/firebase/cliente";
import { RUTA_INGRESAR } from "@/lib/sesion";

export function CerrarSesion() {
  const router = useRouter();
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    (async () => {
      const fb = firebaseCliente();
      try {
        if (fb) await signOut(fb.auth);
        await cerrarSesion();
      } finally {
        router.replace(RUTA_INGRESAR);
      }
    })();
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 124) */}
      <h1 className="text-h1 text-text">Cerrando sesión…</h1>
      <Spinner label="Cerrando sesión" />
    </div>
  );
}
