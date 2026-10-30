import { AvatarStack } from "@/components/krea/avatar-stack";
import {
  ISOTIPO_SIZES,
  Isotipo,
  LOGO_SIZES,
  Logo,
} from "@/components/krea/logo";
import { TEAM_LOGO_SIZES, TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import {
  AVATAR_SIZES,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { avatarUrl, DICEBEAR_ESTILOS } from "@/lib/dicebear";
import { teamColorIndex } from "@/lib/identity";
import { Familia, Muestra } from "./familia";

// Avatar, TeamLogo, Logo/Isotipo con acento (§2.5). Seeds y equipos de data/seed (provisional: CONTENT_CHECKLIST 38–40)
const ESTUDIANTES = [
  { id: "e1", nombre: "Jorge Quintero", seed: "jorge-quintero" },
  { id: "e2", nombre: "Luniel Morón", seed: "luniel-moron" },
  { id: "e3", nombre: "Franyer Hernández", seed: "franyer-hernandez" },
  { id: "e4", nombre: "Valentina Rojas", seed: "valentina-rojas" },
  { id: "e5", nombre: "Ángel Ñáñez", seed: "angel-nanez" },
  { id: "e6", nombre: "Camila Duarte", seed: "camila-duarte" },
  { id: "e7", nombre: "Sofía Pérez", seed: "sofia-perez" },
  { id: "e8", nombre: "Diego Salazar", seed: "diego-salazar" },
  { id: "e9", nombre: "Mariana Linares", seed: "mariana-linares" },
] as const;

const EQUIPOS = [
  { id: "5a-g1", tema: "Barbería" },
  { id: "5a-g2", tema: "Repostería" },
  { id: "5a-g3", tema: "Ropa" },
  { id: "5a-g4", tema: "Mascotas" },
  { id: "5a-g5", tema: "Celulares" },
  { id: "5a-g6", tema: "Ñandú Studio" },
] as const;

const CAPTION = "text-small-b w-full text-text-2 md:w-28";

function pila(n: number) {
  return ESTUDIANTES.slice(0, n).map((e, i) => ({
    id: e.id,
    nombre: e.nombre,
    seed: e.seed,
    estilo: DICEBEAR_ESTILOS[i % DICEBEAR_ESTILOS.length],
  }));
}

export function Identidad() {
  const [jorge] = ESTUDIANTES;
  return (
    <Familia
      id="identidad"
      title="Avatares y logos"
      description="Avatar (8 tamaños, anillo «tú», pila +n), logo de equipo con respaldo de 6 colores, logo e isotipo que siguen el acento (HANDOFF §2.5)."
    >
      <Muestra title="Avatar · 8 tamaños">
        <div className="flex flex-wrap items-end gap-4">
          {AVATAR_SIZES.map((size, i) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <UserAvatar
                estilo={DICEBEAR_ESTILOS[i % DICEBEAR_ESTILOS.length]}
                seed={ESTUDIANTES[i].seed}
                nombre={ESTUDIANTES[i].nombre}
                size={size}
              />
              <span className="text-small text-text-2">{size}</span>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra title="Los 4 estilos de DiceBear (D010)">
        <div className="flex flex-wrap items-center gap-6">
          {DICEBEAR_ESTILOS.map((estilo) => (
            <div key={estilo} className="flex items-center gap-3">
              <UserAvatar
                estilo={estilo}
                seed={jorge.seed}
                nombre={jorge.nombre}
                size={56}
              />
              <span className="text-small text-text-2">{estilo}</span>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra title="Anillo «tú / elegido»">
        <div className="flex flex-wrap items-center gap-6">
          {AVATAR_SIZES.map((size, i) => (
            <UserAvatar
              key={size}
              estilo="fun-emoji"
              seed={ESTUDIANTES[i].seed}
              nombre={ESTUDIANTES[i].nombre}
              size={size}
              ring
            />
          ))}
        </div>
      </Muestra>

      <Muestra title="Cargando y respaldo con iniciales">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sin imagen: Radix muestra el respaldo (fondo --surface-2 mientras carga) */}
          <Avatar size={40} aria-hidden="true">
            <AvatarFallback>JQ</AvatarFallback>
          </Avatar>
          <Avatar size={56} aria-hidden="true">
            <AvatarFallback>LM</AvatarFallback>
          </Avatar>
          <Avatar size={96} ring aria-hidden="true">
            <AvatarFallback>ÁÑ</AvatarFallback>
          </Avatar>
          {/* Imagen que no existe: cae al respaldo */}
          <Avatar size={64} aria-hidden="true">
            <AvatarImage src="/brand/no-existe.svg" alt="" />
            <AvatarFallback>VR</AvatarFallback>
          </Avatar>
        </div>
      </Muestra>

      <Muestra title="Pila de avatares (+n)">
        <div className="flex flex-col gap-4">
          {[3, 5, 9].map((n) => (
            <div key={n} className="flex flex-wrap items-center gap-3">
              <span className={CAPTION}>{n} integrantes</span>
              <AvatarStack items={pila(n)} label={`Integrantes (${n})`} />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className={CAPTION}>9 · 32 px</span>
            <AvatarStack items={pila(9)} size={32} label="Integrantes (9)" />
          </div>
        </div>
      </Muestra>

      <Muestra title="Logo de equipo · imagen">
        <div className="flex flex-wrap items-end gap-4">
          {TEAM_LOGO_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <TeamLogo
                teamId="5a-g2"
                tema="Repostería"
                src={avatarUrl({ estilo: "bottts-neutral", seed: "5a-g2" })}
                size={size}
              />
              <span className="text-small text-text-2">{size}</span>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra title="Logo de equipo · respaldo (color por hash del id)">
        <div className="flex flex-wrap items-end gap-4">
          {EQUIPOS.map((eq) => (
            <div key={eq.id} className="flex flex-col items-center gap-2">
              <TeamLogo teamId={eq.id} tema={eq.tema} size={72} />
              <span className="text-small text-text-2">
                {eq.tema} · color {teamColorIndex(eq.id)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {TEAM_LOGO_SIZES.map((size) => (
            <TeamLogo
              key={size}
              teamId="5a-g6"
              tema="Ñandú Studio"
              size={size}
            />
          ))}
        </div>
      </Muestra>

      <Muestra title="Logo · cuatro anchos">
        <div className="flex flex-wrap items-end gap-8">
          {LOGO_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-start gap-2">
              <Logo size={size} />
              <span className="text-small text-text-2">{size}</span>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra title="Logo sobre acento">
        <div className="inline-flex rounded-md bg-accent p-6">
          <Logo size="lateral" sobreAcento />
        </div>
      </Muestra>

      <Muestra title="Isotipo">
        <div className="flex flex-wrap items-end gap-4">
          {ISOTIPO_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Isotipo size={size} />
              <span className="text-small text-text-2">{size}</span>
            </div>
          ))}
        </div>
      </Muestra>
    </Familia>
  );
}
