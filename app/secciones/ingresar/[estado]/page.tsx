import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { LoginForm } from "@/components/sections/auth/login-form";
import { NewPasswordForm } from "@/components/sections/auth/new-password-form";
import { RecoverForm } from "@/components/sections/auth/recover-form";
import { RecoverSent } from "@/components/sections/auth/recover-sent";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Ingresar",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/ingresar";
const ESTADOS = [
  ["login", "Ingresar"],
  ["credenciales", "Ingresar · no coinciden"],
  ["bloqueado", "Ingresar · demasiados intentos"],
  ["recuperar", "Recuperar"],
  ["enviado", "Enviado"],
  ["nueva", "Nueva contraseña"],
  ["vencido", "Enlace vencido"],
] as const;
type Estado = (typeof ESTADOS)[number][0];

function estadoDe(valor: string): Estado | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática: con cacheComponents, `searchParams` no se puede prerenderizar
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Rutas finales (fase 05): /ingresar, /recuperar, /recuperar/enviado, /recuperar/nueva.
// Aquí los enlaces entre pantallas apuntan a los estados de la vista previa.
export default async function IngresarVista({
  params,
}: PageProps<"/secciones/ingresar/[estado]">) {
  const estado = estadoDe((await params).estado);
  if (!estado) notFound();
  return (
    <Vista rol="estudiante" ruta="/ingresar" sinNavegacion>
      <Estados base={BASE} actual={estado} estados={ESTADOS} />
      <AuthLayout>
        {estado === "login" ||
        estado === "credenciales" ||
        estado === "bloqueado" ? (
          <LoginForm
            recuperarHref={`${BASE}/recuperar`}
            error={estado === "login" ? undefined : estado}
          />
        ) : null}
        {estado === "recuperar" ? (
          <RecoverForm volverHref={`${BASE}/login`} />
        ) : null}
        {estado === "enviado" ? (
          // PLACEHOLDER: correo de ejemplo (CONTENT_CHECKLIST fila 3: faltan los reales)
          <RecoverSent email="yeilin@gmail.com" volverHref={`${BASE}/login`} />
        ) : null}
        {estado === "nueva" || estado === "vencido" ? (
          <NewPasswordForm
            vencido={estado === "vencido"}
            pedirOtroHref={`${BASE}/recuperar`}
          />
        ) : null}
      </AuthLayout>
    </Vista>
  );
}
