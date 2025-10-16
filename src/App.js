import React, { useState, useRef, useEffect } from "react";

const ROWS = 16;
const COLS = 16;

// Genera una grilla vacía
function makeGrid(rows, cols) {
  const g = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(false);
    g.push(row);
  }
  return g;
}

export default function App() {
  const [grid, setGrid] = useState(() => makeGrid(ROWS, COLS));
  const [drawMode, setDrawMode] = useState(false); // modo táctil/arrastre
  const [paintOnFocus, setPaintOnFocus] = useState(true); // pintar al recibir foco
  const drawingRef = useRef(false);
  const gridRef = useRef(null);
  const [focused, setFocused] = useState({ r: 0, c: 0 });

  // --- Función para pintar una celda ---
  const paintCell = (r, c) => {
    setGrid((prev) => {
      const copy = prev.map((row) => row.slice());
      copy[r][c] = true;
      return copy;
    });
  };

  // --- Eventos pointer (para modo táctil) ---
  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;

    const onPointerDown = (ev) => {
      if (!drawMode) return;
      ev.preventDefault();
      drawingRef.current = true;
      const cell = ev.target.closest("[data-cell]");
      if (cell) {
        const r = Number(cell.dataset.r);
        const c = Number(cell.dataset.c);
        paintCell(r, c);
      }
    };

    const onPointerMove = (ev) => {
      if (!drawMode || !drawingRef.current) return;
      ev.preventDefault();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cell = el?.closest?.("[data-cell]");
      if (cell) {
        const r = Number(cell.dataset.r);
        const c = Number(cell.dataset.c);
        paintCell(r, c);
      }
    };

    const onPointerUp = () => {
      drawingRef.current = false;
    };

    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drawMode]);

  // --- Mover foco con flechas ---
  const focusCell = (r, c) => {
    const el = gridRef.current?.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el) el.focus();
  };

  const onKeyGrid = (e) => {
    const { r, c } = focused;
    let nr = r,
      nc = c;
    if (e.key === "ArrowUp" || e.key === "w") nr = Math.max(0, r - 1);
    if (e.key === "ArrowDown" || e.key === "s") nr = Math.min(ROWS - 1, r + 1);
    if (e.key === "ArrowLeft" || e.key === "a") nc = Math.max(0, c - 1);
    if (e.key === "ArrowRight" || e.key === "d") nc = Math.min(COLS - 1, c + 1);
    if (nr !== r || nc !== c) {
      setFocused({ r: nr, c: nc });
      focusCell(nr, nc);
      e.preventDefault();
    }
    if (e.key === " " || e.key === "Enter") {
      paintCell(r, c);
      e.preventDefault();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🎨 Grilla accesible para pintar</h2>

      <div role="toolbar" aria-label="Herramientas de pintura" style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={drawMode}
            onChange={(e) => setDrawMode(e.target.checked)}
          />{" "}
          Activar modo táctil (arrastrar)
        </label>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={paintOnFocus}
            onChange={(e) => setPaintOnFocus(e.target.checked)}
          />{" "}
          Pintar al recibir foco (modo accesible)
        </label>

        <button
          onClick={() => {
            setGrid(makeGrid(ROWS, COLS));
            const live = document.getElementById("live-region");
            if (live) live.textContent = "Grilla reiniciada";
          }}
        >
          Reiniciar
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>Controles (accesibles):</div>
          <div>
            <button
              onClick={() => {
                const nr = Math.max(0, focused.r - 1);
                setFocused((s) => ({ r: nr, c: s.c }));
                focusCell(nr, focused.c);
              }}
            >
              ↑
            </button>
            <button
              onClick={() => {
                const nc = Math.max(0, focused.c - 1);
                setFocused((s) => ({ r: s.r, c: nc }));
                focusCell(focused.r, nc);
              }}
            >
              ←
            </button>
            <button
              onClick={() => {
                const nc = Math.min(COLS - 1, focused.c + 1);
                setFocused((s) => ({ r: s.r, c: nc }));
                focusCell(focused.r, nc);
              }}
            >
              →
            </button>
            <button
              onClick={() => {
                const nr = Math.min(ROWS - 1, focused.r + 1);
                setFocused((s) => ({ r: nr, c: s.c }));
                focusCell(nr, focused.c);
              }}
            >
              ↓
            </button>
            <button onClick={() => paintCell(focused.r, focused.c)}>Pintar</button>
          </div>
        </div>

        <div
          id="live-region"
          aria-live="polite"
          style={{
            position: "absolute",
            left: -9999,
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        />
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label="Lienzo de dibujo"
        tabIndex={0}
        onKeyDown={onKeyGrid}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 28px)`,
          gridTemplateRows: `repeat(${ROWS}, 28px)`,
          gap: 2,
          touchAction: drawMode ? "none" : "auto",
          maxWidth: "fit-content",
          border: "1px solid #bbb",
          padding: 4,
        }}
      >
        {grid.map((row, r) =>
          row.map((painted, c) => (
            <div
              key={`${r}-${c}`}
              data-cell
              data-r={r}
              data-c={c}
              role="gridcell"
              tabIndex={0}
              aria-label={`Celda ${r + 1}, columna ${c + 1}, ${
                painted ? "pintada" : "sin pintar"
              }`}
              onFocus={() => {
                setFocused({ r, c });
                if (paintOnFocus) paintCell(r, c);
              }}
              onClick={() => paintCell(r, c)}
              style={{
                width: 28,
                height: 28,
                background: painted ? "#1e90ff" : "#fff",
                border: "1px solid #ddd",
                outline:
                  focused.r === r && focused.c === c ? "2px solid #ffb" : "none",
                borderRadius: 2,
              }}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#333" }}>
        <strong>Notas:</strong>
        <ul>
          <li>
            Si usás TalkBack o VoiceOver, activá “Pintar al recibir foco”. Al moverte
            por la grilla, las celdas se pintarán automáticamente.
          </li>
          <li>
            Si preferís dibujar con el dedo, activá “Modo táctil (arrastrar)”.
            Cuando el lector esté activo, podés intentar usar dos dedos.
          </li>
          <li>Los botones de flechas te permiten moverte sin gestos táctiles.</li>
        </ul>
      </div>
    </div>
  );
}
