import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** "Volver a entrar": ghost sm con ChevronLeft, alineado al borde del texto (−12, como el lienzo). */
export function VolverLink({ href }: { href: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 self-start">
      <Link href={href}>
        <ChevronLeft aria-hidden="true" />
        Volver a entrar
      </Link>
    </Button>
  );
}
