import Link from "next/link";

// Portada provisional: reemplaza la plantilla de create-next-app (que usaba colores sueltos).
// La portada real llega en la fase de login/inicio.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-h1">KREA</h1>
      <p className="text-body text-text-2">
        Portal de notas de la Escuela Creativa
      </p>
      <Link href="/tokens" className="text-label text-accent-ink underline">
        Ver tokens
      </Link>
    </main>
  );
}
