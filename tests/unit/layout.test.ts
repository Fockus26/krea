import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { containerClass } from "@/lib/layout";

const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

describe("containerClass", () => {
  test("estudiante y profesor usan su contenedor", () => {
    expect(containerClass("estudiante")).toBe("container-student");
    expect(containerClass("profesor")).toBe("container-teacher");
  });

  test("lectura es igual para los dos roles", () => {
    expect(containerClass("estudiante", "lectura")).toBe(
      "container-reading-start",
    );
    expect(containerClass("profesor", "lectura")).toBe(
      "container-reading-start",
    );
  });

  test("cada clase existe como utilidad en globals.css", () => {
    for (const c of [
      containerClass("estudiante"),
      containerClass("profesor"),
      containerClass("estudiante", "lectura"),
    ])
      expect(css).toContain(`@utility ${c} {`);
  });
});

describe("layout en globals.css", () => {
  test("el smooth scroll solo existe dentro de prefers-reduced-motion: no-preference", () => {
    const i = css.indexOf("scroll-behavior: smooth");
    expect(i).toBeGreaterThan(-1);
    const before = css.slice(0, i);
    expect(
      before.lastIndexOf("@media (prefers-reduced-motion: no-preference)"),
    ).toBeGreaterThan(before.lastIndexOf("}\n\n"));
    expect(css.match(/scroll-behavior: smooth/g)?.length).toBe(1);
  });
});
