"use client";

import { useEffect, useRef, useState } from "react";
import { TeamCard } from "@/components/sections/equipos-profe/team-card";
import { TeamsHeader } from "@/components/sections/equipos-profe/teams-header";
import { UnassignedCard } from "@/components/sections/equipos-profe/unassigned-card";
import { toast } from "@/components/ui/sonner";
import {
  cambiarCapitan,
  capitanTexto,
  conEquipoTotal,
  dibujarLogo,
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

type Equipo = {
  id: string;
  nombre: string;
  tema: string | null;
  puesto: number;
  puntos: number;
  empate: boolean;
};

const SIN_EQUIPO_ID = "titulo-sin-equipo";
const tituloDe = (id: string) => `titulo-${id}`;

/**
 * Tablero de Equipos (cliente, vista previa: nada se guarda). Todo sale de un solo estado
 * (`EstadoEquipos`), así el eyebrow, «Sin equipo · n» y «n integrantes» siempre cuadran.
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
}: {
  seccion: SeccionEquipos;
  base: string;
  equipos: readonly Equipo[];
  alumnos: Readonly<Record<string, { cedula: string; nombre: string }>>;
  inicial: EstadoEquipos;
  total: number;
}) {
  const [estado, setEstado] = useState(inicial);
  const [logos, setLogos] = useState<Record<string, string>>({});
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
  const nombreEquipo = (id: string) =>
    equipos.find((e) => e.id === id)?.nombre ?? id;
  const destinos = equipos.map((e) => ({ id: e.id, nombre: e.nombre }));

  function mover(cedula: string, destino: string | null) {
    const origen = equipoDeCedula(estado, cedula);
    const siguiente = moverAlumno(estado, cedula, destino);
    if (siguiente === estado) return;
    setEstado(siguiente);
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
    dibujarLogo(file).then(
      (blob) => {
        const anterior = urls.current[equipo];
        if (anterior) URL.revokeObjectURL(anterior);
        const url = URL.createObjectURL(blob);
        urls.current[equipo] = url;
        setLogos((l) => ({ ...l, [equipo]: url }));
        toast(`Logo de ${nombreEquipo(equipo)} actualizado`);
      },
      () =>
        setErrores((e) => ({
          ...e,
          [equipo]: "No se pudo leer la imagen. Prueba con otra.",
        })),
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
      />
      <h2 className="sr-only">Equipos de {seccion}</h2>
      <ul className="g3 m-0 list-none items-start p-0">
        {equipos.map((eq) => {
          const e = estado.equipos[eq.id];
          if (!e) return null;
          return (
            <li key={eq.id} className="min-w-0">
              <TeamCard
                equipo={eq}
                tituloId={tituloDe(eq.id)}
                miembros={miembrosOrdenados(e).map((c) => ({
                  cedula: c,
                  nombre: nombreAlumno(c),
                }))}
                capitan={e.capitan}
                equipos={destinos}
                logoSrc={logos[eq.id]}
                logoError={errores[eq.id]}
                onLogo={(f) => cambiarLogo(eq.id, f)}
                onCapitan={(c) => {
                  setEstado(cambiarCapitan(estado, eq.id, c));
                  toast(capitanTexto(nombreAlumno(c), eq.nombre));
                }}
                onMover={mover}
              />
            </li>
          );
        })}
      </ul>
      <UnassignedCard
        tituloId={SIN_EQUIPO_ID}
        alumnos={estado.sinEquipo.map((c) => ({
          cedula: c,
          nombre: nombreAlumno(c),
        }))}
        equipos={destinos}
        onMover={mover}
      />
    </>
  );
}
