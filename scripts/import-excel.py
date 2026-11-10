"""Extrae alumnos, grupos y la tarea individual de Notas.xlsx a data/seed/*.json.

Uso: python -I scripts/import-excel.py <ruta a Notas.xlsx> [carpeta de salida]
Sin dependencias (lee el XML del .xlsx). Ignora la hoja "Sheet1" (no es del liceo).
Regla D003: nota 0 en el Excel = no entregado -> null.
"""
import json, re, sys, unicodedata, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RELNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def read_sheets(path):
    z = zipfile.ZipFile(path)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    rels = {
        r.get("Id"): r.get("Target")
        for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    }
    sheets = {}
    for s in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        target = rels[s.get(RELNS)].lstrip("/").removeprefix("xl/")
        cells = {}
        for c in ET.fromstring(z.read(f"xl/{target}")).iter(f"{{{NS['m']}}}c"):
            v = c.find("m:v", NS)
            if v is None:
                continue
            cells[c.get("r")] = shared[int(v.text)] if c.get("t") == "s" else v.text
        sheets[s.get("name").strip()] = cells
    return sheets


def num(v):
    return None if v in (None, "", "None") else float(v)


def grade(v):
    n = num(v)
    return None if not n else n  # 0 = no entregado


def ced(v):
    """Cédula como texto de dígitos: el export de Google Sheets la guarda como 3.2828381E7."""
    return None if v in (None, "", "None") else str(int(float(v)))


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def rows(cells, first, last_col):
    r = first
    while cells.get(f"B{r}") or cells.get(f"A{r}") or cells.get(f"K{r}"):
        yield r
        r += 1


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "data/seed")
    out.mkdir(parents=True, exist_ok=True)
    sh = read_sheets(src)
    al = sh["Alumnos"]

    grupos = []
    for r in rows(al, 3, "Q"):
        nombre = al.get(f"K{r}")
        if not nombre or nombre == "Sin asignar":
            continue
        seccion = nombre[:2]
        tema = al.get(f"L{r}") or None
        grupos.append({
            "id": nombre.split(" ")[0].lower(),
            "nombre": nombre,
            "seccion": seccion,
            "tema": tema,
            "capitanCedula": ced(al.get(f"M{r}")),
            "ajusteCapitan": num(al.get(f"P{r}")) or 0,
            "notaGrupal": grade(al.get(f"Q{r}")),
        })
    by_name = {g["nombre"]: g["id"] for g in grupos}

    alumnos = []
    for r in rows(al, 3, "I"):
        cedula = ced(al.get(f"D{r}"))
        if not cedula:
            continue
        g = al.get(f"H{r}")
        alumnos.append({
            "cedula": cedula,
            "anio": int(float(al[f"B{r}"])),
            "seccion": f"{int(float(al[f'B{r}']))}{al[f'C{r}']}",
            "nombres": al[f"E{r}"],
            "apellidos": al[f"F{r}"],
            "notaIndividual": grade(al.get(f"G{r}")),
            "grupoId": by_name.get(g),
            "baseEvaluacion": 20,
        })

    # Tarea individual (hoja "Notas"): fila 5 = preguntas, filas 6+ = puntaje por pregunta.
    nt = sh["Notas"]
    cols = "BCDEFGHI"
    preguntas = [nt[f"{c}5"] for c in cols]
    # Valores máximos observados (D004): la suma tiene que dar 20.
    valores = [1, 1, 3, 3, 2, 4, 4, 2]
    ev = []
    for r in range(6, 40):
        name = nt.get(f"A{r}")
        if not name:
            continue
        ev.append({
            "alumno": name,
            "puntos": [num(nt.get(f"{c}{r}")) or 0 for c in cols],
            "nota": num(nt.get(f"J{r}")),
        })
    # El Excel de notas usa nombres cortos (a veces mal escritos): se empareja por nota
    # idéntica y, entre empates, por la mayor cantidad de letras iniciales en común.
    for e in ev:
        cands = [a for a in alumnos if a["notaIndividual"] == e["nota"]]
        words = slug(e["alumno"]).split("-")
        def score(a):
            full = slug(a["nombres"] + " " + a["apellidos"]).split("-")
            return sum(1 for w in words for f in full if f[:4] == w[:4])
        best = max(cands, key=score, default=None)
        e["cedula"] = best["cedula"] if best and score(best) else None
    tarea = {
        "id": "identidad-de-marca",
        "titulo": "Identidad de marca",
        "tipo": "individual",
        "preguntas": [
            {"id": f"p{i+1}", "enunciado": p, "formato": "texto", "valor": v}
            for i, (p, v) in enumerate(zip(preguntas, valores))
        ],
        "evaluaciones": ev,
    }
    assert sum(valores) == 20

    for name, data in (("grupos", grupos), ("alumnos", alumnos), ("tarea-identidad-marca", tarea)):
        (out / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(alumnos)} alumnos · {len(grupos)} grupos · {len(ev)} evaluaciones -> {out}")


if __name__ == "__main__":
    main()
