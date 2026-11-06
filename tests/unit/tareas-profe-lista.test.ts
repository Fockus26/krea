import { describe, expect, test } from "bun:test";
import { conLaQueSale, vecinaAlQuitar } from "@/lib/tareas-profe-lista";

const t = (id: string) => ({ id });
const ids = (l: ReadonlyArray<{ id: string }>) => l.map((x) => x.id);

describe("lista de tareas al eliminar (D243)", () => {
  test("la que sale se queda en su sitio aunque el servidor ya la quitó", () => {
    const q = { tarea: t("b"), indice: 1, hecha: true };
    expect(ids(conLaQueSale([t("a"), t("c")], q))).toEqual(["a", "b", "c"]);
    // Todavía en la lista: no se duplica
    expect(ids(conLaQueSale([t("a"), t("b"), t("c")], q))).toEqual([
      "a",
      "b",
      "c",
    ]);
    // Índice fuera de rango (cambió el filtro): al final
    expect(
      ids(conLaQueSale([t("a")], { tarea: t("z"), indice: 9, hecha: true })),
    ).toEqual(["a", "z"]);
    expect(ids(conLaQueSale([t("a")], null))).toEqual(["a"]);
  });

  test("el foco va a la siguiente, si no a la anterior, si no a ninguna", () => {
    const l = [t("a"), t("b"), t("c")];
    expect(vecinaAlQuitar(l, "a")?.id).toBe("b");
    expect(vecinaAlQuitar(l, "c")?.id).toBe("b");
    expect(vecinaAlQuitar([t("a")], "a")).toBeNull();
    expect(vecinaAlQuitar(l, "x")).toBeNull();
  });
});
