"use client";

import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Selector de tema y acento de las vistas previas (D001: revisar 4 acentos × claro/oscuro).
// Escribe las mismas claves que lee el script anti-parpadeo del layout raíz, así que el
// cambio se mantiene al abrir cada pantalla. Perfil tendrá el selector real (fase 04 ola 2).
const TEMAS = [
  ["system", "Sistema"],
  ["light", "Claro"],
  ["dark", "Oscuro"],
] as const;
const ACENTOS = [
  ["azul", "Azul"],
  ["rojo", "Rojo"],
  ["verde", "Verde"],
  ["morado", "Morado"],
] as const;

function leer(clave: string, defecto: string): string {
  try {
    return localStorage.getItem(clave) ?? defecto;
  } catch {
    return defecto;
  }
}

function guardar(clave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (modo privado): el cambio vale solo para esta pestaña
  }
}

export function Apariencia() {
  const [tema, setTema] = useState("system");
  const [acento, setAcento] = useState("azul");

  useEffect(() => {
    setTema(leer("krea-theme", "system"));
    setAcento(leer("krea-accent", "azul"));
  }, []);

  function cambiarTema(valor: string) {
    setTema(valor);
    const raiz = document.documentElement;
    if (valor === "system") raiz.removeAttribute("data-theme");
    else raiz.setAttribute("data-theme", valor);
    guardar("krea-theme", valor === "system" ? null : valor);
  }

  function cambiarAcento(valor: string) {
    setAcento(valor);
    document.documentElement.setAttribute("data-accent", valor);
    guardar("krea-accent", valor);
  }

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <div className="flex flex-col gap-2">
        <span id="apariencia-tema" className="text-label text-text">
          Tema
        </span>
        <ToggleGroup
          value={tema}
          onValueChange={cambiarTema}
          aria-labelledby="apariencia-tema"
        >
          {TEMAS.map(([valor, texto]) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span id="apariencia-acento" className="text-label text-text">
          Acento
        </span>
        <ToggleGroup
          value={acento}
          onValueChange={cambiarAcento}
          aria-labelledby="apariencia-acento"
        >
          {ACENTOS.map(([valor, texto]) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
