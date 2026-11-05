"use client";
// Aviso de Ingresar (D188): `?aviso=password-nueva` tras guardar la contraseña del enlace. Lee la
// URL en el navegador para que /ingresar siga prerenderizada (va dentro de un <Suspense>).
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AVISO_PASSWORD_NUEVA,
  AVISO_PASSWORD_NUEVA_TEXTO,
} from "@/lib/recuperar";

export function AvisoIngreso() {
  const aviso = useSearchParams().get("aviso");
  if (aviso !== AVISO_PASSWORD_NUEVA) return null;
  return (
    <Alert variant="ok">
      <AlertDescription>{AVISO_PASSWORD_NUEVA_TEXTO}</AlertDescription>
    </Alert>
  );
}
