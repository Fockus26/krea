import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { Restablecer } from "@/components/sections/auth/restablecer";
import { Spinner } from "@/components/ui/spinner";
import { comprobarCodigo } from "@/lib/acciones/recuperar";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

/**
 * Nueva contraseña (HANDOFF §3, fase 07 D188): llega del enlace del correo con `oobCode`. El
 * código se comprueba en el servidor sin gastarlo: vencido o ya usado → «Este enlace ya venció».
 */
export default function RecuperarNuevaPage(
  props: PageProps<"/recuperar/nueva">,
) {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="grid place-items-center py-12">
            <Spinner label="Comprobando el enlace…" />
          </div>
        }
      >
        <ConCodigo {...props} />
      </Suspense>
    </AuthLayout>
  );
}

async function ConCodigo({ searchParams }: PageProps<"/recuperar/nueva">) {
  const { oobCode } = await searchParams;
  const codigo = typeof oobCode === "string" ? oobCode : "";
  const r = await comprobarCodigo(codigo);
  // Un fallo de red no es «vencido»: se muestra el formulario y el guardado lo vuelve a comprobar.
  const vencido = !r.ok && r.error === "vencido";
  return (
    <Restablecer
      oobCode={codigo}
      vencido={vencido}
      pedirOtroHref="/recuperar"
    />
  );
}
