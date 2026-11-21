import type { Metadata } from "next";
import {
  ACENTOS_CORREO,
  type AcentoCorreo,
  TEMAS_CORREO,
  type TemaCorreo,
} from "@/lib/correo/paleta";
import {
  correoRestablecer,
  VARIANTE_CORREO,
  VARIANTES_CORREO,
  type VarianteCorreo,
} from "@/lib/correo/restablecer";

// Galería interna del correo «Restablecer contraseña» (D341, D344): cada presentación × acento ×
// tema, para que César compare y elija `VARIANTE_CORREO`. No se indexa.
export const metadata: Metadata = {
  title: "Correos", // la plantilla del layout añade " · KREA"
  robots: { index: false, follow: false },
};

/** Datos de ejemplo, no de un alumno real: nombre, cédula y código inventados. */
const EJEMPLO = {
  nombre: "Adela",
  cedula: "12345678",
  enlace:
    "https://krea.test/recuperar/nueva?mode=resetPassword&oobCode=codigo-de-ejemplo",
};

const NOMBRE_ACENTO: Record<AcentoCorreo, string> = {
  azul: "Azul",
  rojo: "Rojo",
  verde: "Verde",
  morado: "Morado",
};
const NOMBRE_TEMA: Record<TemaCorreo, string> = {
  claro: "Claro",
  oscuro: "Oscuro",
};
const TEMA_PERFIL = { claro: "light", oscuro: "dark" } as const;

function Vista({
  variante,
  nombreVariante,
  acento,
  tema,
}: {
  variante: VarianteCorreo;
  nombreVariante: string;
  acento: AcentoCorreo;
  tema: TemaCorreo;
}) {
  const { html } = correoRestablecer(
    { ...EJEMPLO, apariencia: { acento, tema: TEMA_PERFIL[tema] } },
    variante,
    { modoOscuroDelCliente: false },
  );
  const rotulo = `${NOMBRE_ACENTO[acento]} · ${NOMBRE_TEMA[tema]}`;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-label">{rotulo}</figcaption>
      <iframe
        title={`Correo ${nombreVariante}, ${rotulo.toLowerCase()}`}
        srcDoc={html}
        sandbox=""
        loading="lazy"
        className="h-svh w-full rounded-lg border border-divider bg-surface"
      />
    </figure>
  );
}

export default function CorreosPage() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8"
    >
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-text-2">Referencia interna</p>
        <h1 className="text-h1">Correo «Restablecer contraseña»</h1>
        <p className="text-body text-text-2">
          Cuatro presentaciones con el acento y el tema que el alumno guardó en
          su perfil (sin apariencia: azul en claro). En el correo real, el claro
          pasa a oscuro en los clientes que siguen el tema del sistema (Apple
          Mail, Outlook); Gmail no lo hace, por eso el oscuro elegido va con
          colores fijos. Datos de ejemplo: nombre, cédula y enlace inventados.
        </p>
      </header>

      <nav aria-label="Presentaciones">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {VARIANTES_CORREO.map((v) => (
            <li key={v.id}>
              <a
                href={`#${v.id}`}
                className="text-label text-accent-ink underline underline-offset-4"
              >
                {v.nombre}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {VARIANTES_CORREO.map((v) => (
        <section
          key={v.id}
          id={v.id}
          aria-labelledby={`${v.id}-titulo`}
          className="flex scroll-mt-8 flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id={`${v.id}-titulo`} className="text-h2">
              {v.nombre}
            </h2>
            <p className="text-body text-text-2">{v.descripcion}</p>
            <p className="text-small-b text-text-2">
              {v.id === VARIANTE_CORREO
                ? "Es la que se envía hoy."
                : "No se envía: para comparar."}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {ACENTOS_CORREO.flatMap((acento) =>
              TEMAS_CORREO.map((tema) => (
                <Vista
                  key={`${acento}-${tema}`}
                  variante={v.id}
                  nombreVariante={v.nombre}
                  acento={acento}
                  tema={tema}
                />
              )),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
