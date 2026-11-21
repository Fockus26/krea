import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { borrarImagenes } from "@/lib/almacen/borrar-imagenes";

let errores: ReturnType<typeof spyOn>;
beforeEach(() => {
  errores = spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => errores.mockRestore());

const almacenDoble = (fallan: string[] = [], lanzan: string[] = []) => {
  const pedidas: string[] = [];
  return {
    pedidas,
    almacen: {
      borrar: async (clave: string) => {
        pedidas.push(clave);
        if (lanzan.includes(clave)) throw new Error("red");
        return fallan.includes(clave)
          ? ({ ok: false, error: "x" } as never)
          : ({ ok: true } as never);
      },
    },
  };
};

describe("borrarImagenes", () => {
  test("borra todas las claves y no registra nada", async () => {
    const { almacen, pedidas } = almacenDoble();
    await borrarImagenes(almacen, ["a", "b"], "eliminarTarea");
    expect(pedidas).toEqual(["a", "b"]);
    expect(errores).not.toHaveBeenCalled();
  });

  test("sin claves no toca el almacén ni registra, aunque falte", async () => {
    await borrarImagenes(null, [], "eliminarTarea");
    expect(errores).not.toHaveBeenCalled();
  });

  test("sin almacén configurado: registra con la acción y no lanza", async () => {
    await borrarImagenes(null, ["a", "b"], "eliminarEquipo");
    expect(errores).toHaveBeenCalledWith(
      "[eliminarEquipo] almacén sin configurar: 2 imágenes sin borrar",
    );
  });

  test("un fallo (resultado no ok o rechazo) se cuenta, intenta las demás y no lanza", async () => {
    const { almacen, pedidas } = almacenDoble(["b"], ["c"]);
    await borrarImagenes(almacen, ["a", "b", "c"], "eliminarAlumno:imagenes");
    expect(pedidas).toEqual(["a", "b", "c"]);
    expect(errores).toHaveBeenCalledWith(
      "[eliminarAlumno:imagenes] almacén: 2 de 3 imágenes sin borrar",
    );
  });
});
