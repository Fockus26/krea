import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Roles tipográficos de globals.css (D017). tailwind-merge no los conoce: sin
 * configurarlo, `text-display` se toma por un color de texto y borraría `text-text-2`
 * (o al revés), y `shadow-1` pasaría por color de sombra (D025).
 */
export const TEXT_ROLES = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body",
  "body-strong",
  "label",
  "small",
  "small-b",
  "eyebrow",
  "button",
  "button-sm",
  "button-lg",
  "grade-sm",
  "grade-md",
  "grade-lg",
  "grade-xl",
] as const;

export const Z_LAYERS = [
  "table-head",
  "rank-moving",
  "sticky",
  "action-bar",
  "topbar",
  "popover",
  "offline",
  "overlay",
  "toast",
] as const;

const twMerge = extendTailwindMerge<"text-role">({
  extend: {
    theme: {
      shadow: ["1", "2", "3", "bnav"],
      radius: ["nav", "pill"],
      ease: ["krea", "bounce"],
    },
    classGroups: {
      // Un rol fija familia, peso, tamaño, alto de línea y tracking a la vez
      "text-role": [{ text: [...TEXT_ROLES] }],
      z: [{ z: [...Z_LAYERS] }],
      duration: [{ duration: ["fast", "normal", "rank", "celebrate"] }],
      "fvn-spacing": ["nums"],
      h: [{ h: ["topbar", "bnav", "screen-side"] }],
      w: [{ w: ["side"] }],
    },
    conflictingClassGroups: {
      "text-role": [
        "font-size",
        "leading",
        "font-family",
        "font-weight",
        "tracking",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
