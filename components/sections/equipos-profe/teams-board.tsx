"use client";

import { Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamCard } from "@/components/sections/equipos-profe/team-card";
import {
  type AccionesGestionEquipos,
  CrearEquipoDialog,
  EditarEquipoDialog,
  EliminarEquipoDialog,
  NUEVO_EQUIPO_ID,
} from "@/components/sections/equipos-profe/team-dialogs";
import { TeamsHeader } from "@/components/sections/equipos-profe/teams-header";
import { UnassignedCard } from "@/components/sections/equipos-profe/unassigned-card";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  type CambiarCapitan,
  errorEquiposTexto,
  type MoverAlumno,
  type ResultadoEquipos,
  type ResultadoLogo,
} from "@/lib/equipos-datos";
import { bloqueoEliminar, eliminadoEquipoTexto } from "@/lib/equipos-gestion";
import {
  type AlumnoEquipo,
  cambiarCapitan,
  capitanTexto,
  conEquipoTotal,
  dibujarLogo,
  type EquipoVista,
  type EstadoEquipos,
  equipoDeCedula,
  eyebrowEquipos,
  miembrosOrdenados,
  moverAlumno,
  movidoTexto,
  quitadoTexto,
  type SeccionEquipos,
  validarLogo,
} from "@/lib/equipos-profe";
import { estiloDe } from "@/lib/vistas-estudiante";

/**
 * Las Server Actions del tablero (D210, D212). Sin ellas (vista previa) nada se guarda. Con
 * `gestion` (W12, D270) el tablero ofrece «Nuevo equipo», «Editar» y «Eliminar».
 */
export type AccionesEquipos = {
  mover: (entrada: MoverAlumno) => Promise<ResultadoEquipos>;
  capitan: (entrada: CambiarCapitan) => Promise<ResultadoEquipos>;
  logo: (form: FormData) => Promise<ResultadoLogo>;
  gestion?: AccionesGestionEquipos;
};

const RED: ResultadoEquipos = { ok: false, error: "red" };

const SIN_EQUIPO_ID = "titulo-sin-equipo";
const tituloDe = (id: string) => `titulo-${id}`;

/**
 * Tablero de Equipos (cliente). Todo sale de un solo estado (`EstadoEquipos`), así el eyebrow,
 * «Sin equipo · n» y «n integrantes» siempre cuadran. Con `acciones` cada cambio se pinta al
 * momento y se guarda en el servidor; si falla, vuelve atrás y lo dice un toast de error (el
 * cambio guardado con la sesión sin cerrar, «sesiones», se queda). Sin `acciones`, vista previa.
 * Foco tras mover (D111): el botón de la fila ya no existe, así que el foco va al título de la
 * tarjeta destino; al quitar del equipo, al de la tarjeta de origen. Cada acción lo dice con un
 * toast (región viva de Sonner): no hay otro `role="status"`.
 */
export function TeamsBoard({
  seccion,
  base,
  equipos,
  alumnos,
  inicial,
  total,
  acciones,
}: {
  seccion: SeccionEquipos;
  base: string;
  equipos: readonly EquipoVista[];
  alumnos: Readonly<Record<string, AlumnoEquipo>>;
  inicial: EstadoEquipos;
  total: number;
  acciones?: AccionesEquipos;
}) {
  const gestion = acciones?.gestion;
  const [estado, setEstado] = useState(inicial);
  // Tras `refresh()` (crear, eliminar o cualquier cambio guardado) manda el estado del servidor:
  // así aparece la tarjeta de un equipo nuevo y desaparece la del eliminado
  const [inicialAntes, setInicialAntes] = useState(inicial);
  if (inicial !== inicialAntes) {
    setInicialAntes(inicial);
    setEstado(inicial);
  }
  const [logos, setLogos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      equipos.flatMap((e) => (e.logo ? [[e.id, e.logo] as const] : [])),
    ),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [foco, setFoco] = useState<{ id: string; n: number } | null>(null);
  const urls = useRef<Record<string, string>>({});

  // Libera las vistas previas del logo al desmontar
  useEffect(() => {
    const guardadas = urls.current;
    return () => {
      for (const u of Object.values(guardadas)) URL.revokeObjectURL(u);
    };
  }, []);

  useEffect(() => {
    if (foco) document.getElementById(foco.id)?.focus();
  }, [foco]);

  const nombreAlumno = (c: string) => alumnos[c]?.nombre ?? c;
  const miembro = (c: string) => {
    const a = alumnos[c];
    return {
      cedula: c,
      nombre: a?.nombre ?? c,
      seed: a?.seed,
      estilo: a?.estilo ? estiloDe(a.estilo) : undefined,
    };
  };

  /** Guarda en el servidor; si falla, vuelve al estado anterior (salvo «sesiones»: ya se guardó). */
  function guardar(
    anterior: EstadoEquipos,
    pedido: Promise<ResultadoEquipos> | undefined,
  ) {
    if (!pedido) return;
    void pedido
      .catch(() => RED)
      .then((r) => {
        if (r.ok) return;
        if (r.error !== "sesiones") setEstado(anterior);
        toast.error(errorEquiposTexto(r.error));
      });
  }
  const nombreEquipo = (id: string) =>
    equipos.find((e) => e.id === id)?.nombre ?? id;
  const destinos = equipos.map((e) => ({ id: e.id, nombre: e.nombre }));

  function mover(cedula: string, destino: string | null) {
    const origen = equipoDeCedula(estado, cedula);
    const siguiente = moverAlumno(estado, cedula, destino);
    if (siguiente === estado) return;
    setEstado(siguiente);
    guardar(estado, acciones?.mover({ cedula, destino }));
    const nombre = nombreAlumno(cedula);
    const aviso =
      destino === null && origen
        ? { texto: quitadoTexto(nombre, nombreEquipo(origen)), foco: origen }
        : destino
          ? { texto: movidoTexto(nombre, nombreEquipo(destino)), foco: destino }
          : null;
    if (!aviso) return;
    toast(aviso.texto);
    setFoco((f) => ({ id: tituloDe(aviso.foco), n: (f?.n ?? 0) + 1 }));
  }

  function cambiarLogo(equipo: string, file: File) {
    const check = validarLogo(file);
    if (!check.ok) {
      setErrores((e) => ({ ...e, [equipo]: check.message }));
      return;
    }
    setErrores((e) => {
      const { [equipo]: _quitado, ...resto } = e;
      return resto;
    });
    const fallo = (mensaje: string) =>
      setErrores((e) => ({ ...e, [equipo]: mensaje }));
    dibujarLogo(file).then(
      async (blob) => {
        if (acciones) {
          const form = new FormData();
          form.set("equipoId", equipo);
          form.set(
            "logo",
            blob,
            blob.type === "image/png" ? "logo.png" : "logo.webp",
          );
          const r = await acciones
            .logo(form)
            .catch((): ResultadoLogo => ({ ok: false, error: "red" }));
          if (!r.ok) {
            fallo(errorEquiposTexto(r.error));
            return;
          }
        }
        // La vista previa local: la imagen ya está aquí, no hace falta pedir la firmada
        const anterior = urls.current[equipo];
        if (anterior) URL.revokeObjectURL(anterior);
        const url = URL.createObjectURL(blob);
        urls.current[equipo] = url;
        setLogos((l) => ({ ...l, [equipo]: url }));
        toast(`Logo de ${nombreEquipo(equipo)} actualizado`);
      },
      () => fallo("No se pudo leer la imagen. Prueba con otra."),
    );
  }

  return (
    <>
      <TeamsHeader
        eyebrow={eyebrowEquipos(
          seccion,
          equipos.length,
          conEquipoTotal(estado),
          total,
        )}
        seccion={seccion}
        base={base}
        acciones={
          gestion ? (
            <CrearEquipoDialog seccion={seccion} crear={gestion.crear} />
          ) : undefined
        }
      />
      <h2 className="sr-only">Equipos de {seccion}</h2>
      {equipos.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            headingLevel={3}
            title={`Todavía no hay equipos en ${seccion}`}
            description="Cuando armes los equipos, aquí verás a sus integrantes y a su capitán."
          />
        </Card>
      ) : null}
      {/* Tres columnas solo desde 1440: con la barra lateral, antes la tarjeta no cabe (D216) */}
      <ul className="g2 m-0 list-none items-start p-0 xl:grid-cols-3">
        {equipos.map((eq) => {
          const e = estado.equipos[eq.id];
          if (!e) return null;
          return (
            <li key={eq.id} className="min-w-0">
              <TeamCard
                equipo={eq}
                tituloId={tituloDe(eq.id)}
                miembros={miembrosOrdenados(e).map(miembro)}
                capitan={e.capitan}
                equipos={destinos}
                logoSrc={logos[eq.id]}
                logoError={errores[eq.id]}
                onLogo={(f) => cambiarLogo(eq.id, f)}
                onCapitan={(c) => {
                  const siguiente = cambiarCapitan(estado, eq.id, c);
                  if (siguiente === estado) return;
                  setEstado(siguiente);
                  guardar(
                    estado,
                    acciones?.capitan({ equipoId: eq.id, cedula: c }),
                  );
                  toast(capitanTexto(nombreAlumno(c), eq.nombre));
                }}
                onMover={mover}
                acciones={
                  gestion ? (
                    <>
                      <EditarEquipoDialog
                        equipo={eq}
                        seccion={seccion}
                        editar={gestion.editar}
                      />
                      <EliminarEquipoDialog
                        equipo={eq}
                        bloqueo={bloqueoEliminar({
                          integrantes: e.miembros.length,
                          entregas: eq.conDatos?.entregas ?? 0,
                          ajustes: eq.conDatos?.ajustes ?? 0,
                        })}
                        eliminar={gestion.eliminar}
                        onEliminado={() => {
                          toast(eliminadoEquipoTexto(eq.nombre));
                          // Su tarjeta (y el botón que abrió el diálogo) ya no existe
                          requestAnimationFrame(() =>
                            document.getElementById(NUEVO_EQUIPO_ID)?.focus(),
                          );
                        }}
                      />
                    </>
                  ) : undefined
                }
              />
            </li>
          );
        })}
      </ul>
      <UnassignedCard
        tituloId={SIN_EQUIPO_ID}
        alumnos={estado.sinEquipo.map(miembro)}
        equipos={destinos}
        onMover={mover}
      />
    </>
  );
}
