import type { Metadata } from "next";
import { CerrarSesion } from "@/components/sections/auth/cerrar-sesion";

export const metadata: Metadata = {
  title: "¡Hasta luego!",
  robots: { index: false, follow: false },
};

/** Destino de «Salir» en el menú y en Perfil (D182). */
export default function SalirPage() {
  return <CerrarSesion />;
}
