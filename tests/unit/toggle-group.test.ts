import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Radix no da el patrón radiogroup "de fábrica" en versiones viejas: se comprueba el HTML real.
describe("ToggleGroup (D038)", () => {
  const html = renderToStaticMarkup(
    createElement(
      ToggleGroup,
      { defaultValue: "5A", "aria-label": "Sección" },
      createElement(ToggleGroupItem, { value: "5A" }, "5.º A"),
      createElement(ToggleGroupItem, { value: "5C" }, "5.º C"),
    ),
  );

  test("el grupo es un radiogroup con nombre", () => {
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Sección"');
  });

  test("cada opción es un radio con aria-checked", () => {
    expect(html.match(/role="radio"/g)?.length).toBe(2);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain("aria-pressed");
  });
});
