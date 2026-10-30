import { describe, expect, test } from "bun:test";
import {
  STATUS_BADGES,
  SUBMISSION_STATUSES,
  TASK_STATUSES,
} from "@/components/krea/status-badge";
import { type BadgeVariant, badgeVariants } from "@/components/ui/badge";

describe("STATUS_BADGES (HANDOFF §2.4)", () => {
  test("estados de tarea: palabra y variante", () => {
    expect(TASK_STATUSES.map((s) => STATUS_BADGES[s].label)).toEqual([
      "Borrador",
      "Abierta",
      "Evaluada",
    ]);
    expect(TASK_STATUSES.map((s) => STATUS_BADGES[s].variant)).toEqual([
      "neutral",
      "ok",
      "acc",
    ]);
  });

  test("estados de entrega: palabra y variante", () => {
    expect(SUBMISSION_STATUSES.map((s) => STATUS_BADGES[s].label)).toEqual([
      "Entregada",
      "Por entregar",
      "Vencida",
    ]);
    expect(SUBMISSION_STATUSES.map((s) => STATUS_BADGES[s].variant)).toEqual([
      "ok",
      "warn",
      "err",
    ]);
  });

  test("todos llevan ícono y palabra (nunca solo color)", () => {
    for (const { icon, label } of Object.values(STATUS_BADGES)) {
      expect(icon).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("badgeVariants (HANDOFF §2.4)", () => {
  const classes = (variant?: BadgeVariant) =>
    badgeVariants({ variant }).split(/\s+/);

  test("chip base: 28 de alto, radio 10, 13/18 700", () => {
    expect(classes("ok")).toEqual(
      expect.arrayContaining(["h-7", "rounded-sm", "px-2.5", "text-small-b"]),
    );
  });

  test("ok y warn usan el tinte del tema, no un porcentaje fijo", () => {
    expect(classes("ok")).toContain("bg-chip-ok");
    expect(classes("warn")).toContain("bg-chip-warn");
  });

  test("acc: texto en --text, el ícono en el acento", () => {
    expect(classes("acc")).toContain("text-text");
    expect(classes("acc")).not.toContain("text-accent-ink");
  });

  test("tu: 22 de alto y redondo", () => {
    expect(classes("tu")).toEqual(
      expect.arrayContaining(["h-5.5", "rounded-pill", "bg-accent"]),
    );
  });
});
