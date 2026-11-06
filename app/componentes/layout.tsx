import { notFound } from "next/navigation";
import { galeriaVisible } from "@/lib/galerias";

// Galería interna: solo en desarrollo y en las vistas previas; en producción, 404 (D-A4, D162).
export default function GaleriaLayout({
  children,
}: LayoutProps<"/componentes">) {
  if (!galeriaVisible(process.env)) notFound();
  return children;
}
