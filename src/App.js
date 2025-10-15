import React, { useEffect, useMemo, useRef, useState } from "react";

/* ==== Utilidades ==== */
function cellId(r, c) { return `${r}:${c}`; }
function cellCenter(id, size) {
  const [r, c] = id.split(":").map(Number);
  return { x: c * size + size / 2, y: r * size + size / 2 };
}

// Catmull–Rom (centrípeta) → Bezier cúbicas (atributo `d` de <path>)
function catmullRomToBezier(points, alpha = 0.5) {
  if (!points || points.length < 2) return "";
  const pts = points.slice();
  pts.unshift(points[0]); pts.push(points[points.length - 1]);

  const d = [`M ${pts[1].x} ${pts[1].y}`];
  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i], p1 = pts[i+1], p2 = pts[i+2], p3 = pts[i+3];
    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y) || 1;

    const d01a = Math.pow(d01, alpha), d12a = Math.pow(d12, alpha), d23a = Math.pow(d23, alpha);
    const A = (2 * d01a + d12a), B = (d01a + 2 * d12a);
    const C = (2 * d23a + d12a), E = (d23a + 2 * d12a);

    const denom1 = (A + d01a) || 1;
    const denom2 = (C + d23a) || 1;

    const c1x = (-d12a * p0.x + A * p1.x + d01a * p2.x) / denom1;
    const c1y = (-d12a * p0.y + A * p1.y + d01a * p2.y) / denom1;

    const c2x = ( d12a * p3.x + C * p2.x - d23a * p1.x) / denom2;
    const c2y = ( d12a * p3.y + C * p2.y - d23a * p1.y) / denom2;

    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

/* ==== App ==== */
export default function App() {
  // Ajustes de lienzo
  const rows = 32, cols = 64, cellSize = 14;
  const strokeColor = "#0d6efd", strokeWidth = 2, alpha = 0.5;

  // Estado
  const [painted, setPainted] = useState(new Set());
  const [focusCell, setFocusCell] = useState({ r: 0, c: 0 });
  const [current, setCurrent] = useState(null); // { cells:[], points:[] }
  const [strokes, setStrokes] = useState([]);
  const [paintMode, setPaintMode] = useState(false); // NUEVO: Modo pintar
  const liveRef = useRef(null);

  const W = cols * cellSize, H = rows * cellSize;

  const announce = (msg) => { if (liveRef.current) liveRef.current.textContent = msg; };

  // Iniciar/terminar trazo
  const startStrokeAt = (r, c) => {
    const id = cellId(r, c);
    const p = cellCenter(id, cellSize);
    setPainted(prev => new Set(prev).add(id));
    setCurrent({ cells: [id], points: [p] });
    announce("Inicio de trazo.");
  };
  const finishStroke = () => {
    if (!current) return;
    setStrokes(prev => [...prev, current]);
    setCurrent(null);
    announce("Trazo finalizado.");
  };

  // Pintar una celda (y añadir al trazo si existe)
  const paintCell = (r, c) => {
    const id = cellId(r, c);
    setPainted(prev => {
      const next = new Set(prev); next.add(id); return next;
    });
    if (current) {
      setCurrent({
        cells: [...current.cells, id],
        points: [...current.points, cellCenter(id, cellSize)]
      });
    }
  };

  // Click / doble toque
  const onActivateCell = (r, c) => {
    if (!current) startStrokeAt(r, c);
    else paintCell(r, c);
    announce(`Celda ${r + 1}, ${c + 1} pintada.`);
  };

  // Desplazar foco con flechas
  const moveFocus = (dr, dc) => {
    const r = (focusCell.r + dr + rows) % rows;
    const c = (focusCell.c + dc + cols) % cols;
    setFocusCell({ r, c });
    const el = document.getElementById(`cell-${r}-${c}`); el && el.focus();
    // Si modo pintar está ON y hay trazo, pintamos al entrar
    if (paintMode) {
      if (!current) startStrokeAt(r, c); else paintCell(r, c);
    }
  };

  // Teclado por celda
  const onCellKeyDown = (e, r, c) => {
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); moveFocus(0, 1); break;
      case "ArrowLeft":  e.preventDefault(); moveFocus(0,-1); break;
      case "ArrowDown":  e.preventDefault(); moveFocus(1, 0); break;
      case "ArrowUp":    e.preventDefault(); moveFocus(-1,0); break;
      case " ":
        e.preventDefault();
        onActivateCell(r, c);
        break;
      case "Enter":
        e.preventDefault();
        if (!current) startStrokeAt(r, c); else finishStroke();
        break;
      default: break;
    }
  };

  // Pintar al entrar con foco (para VO) SÓLO si modo pintar está ON
  const onCellFocus = (r, c) => {
    setFocusCell({ r, c });
    if (paintMode) {
      if (!current) startStrokeAt(r, c); else paintCell(r, c);
    }
  };

  // Foco inicial
  useEffect(() => {
    const el = document.getElementById("cell-0-0");
    if (el) el.focus();
  }, []);

  // Paths suavizados
  const previousPaths = useMemo(
    () => strokes.map(s => catmullRomToBezier(s.points, alpha)),
    [strokes, alpha]
  );
  const currentPath = useMemo(
    () => (current && current.points && current.points.length >= 2)
      ? catmullRomToBezier(current.points, alpha) : "",
    [current, alpha]
  );

  // Alterna Modo pintar (si se apaga, cierra el trazo)
  const togglePaintMode = () => {
    const next = !paintMode;
    setPaintMode(next);
    if (!next && current) finishStroke();
    if (next && !current) {
      // Arranca inmediatamente en la celda enfocada (con VO esto evita doble gesto)
      startStrokeAt(focusCell.r, focusCell.c);
    }
  };

  const resetAll = () => {
    setPainted(new Set()); setCurrent(null); setStrokes([]);
    announce("Lienzo reiniciado.");
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 12px" }}>Grilla accesible + suavizado (VO compatible)</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={togglePaintMode}
          aria-pressed={paintMode}
          aria-label={`Modo pintar ${paintMode ? "activado" : "desactivado"}`}
        >
          {paintMode ? "🖊️ Modo pintar: ON" : "🖊️ Modo pintar: OFF"}
        </button>
        <button onClick={resetAll}>Reiniciar</button>
      </div>

      <p id="grid-help" style={{ marginTop: 0 }}>
        Con <strong>Modo pintar ON</strong>: al moverte por la grilla (flechas o gestos VO) se va
        pintando y el trazo se construye automáticamente.{" "}
        Con <strong>Modo pintar OFF</strong>: pinta con <kbd>Espacio</kbd> o con doble toque (VO) celda a celda.
        Usa <kbd>Enter</kbd> para iniciar/finalizar trazo.
      </p>

      {/* Grilla accesible */}
      <div
        role="grid"
        aria-labelledby="grid-help"
        aria-rowcount={rows}
        aria-colcount={cols}
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: 2
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const id = cellId(r, c);
            const selected = painted.has(id);
            const isFocus = focusCell.r === r && focusCell.c === c;
            return (
              <div
                key={id}
                id={`cell-${r}-${c}`}
                role="gridcell"
                tabIndex={isFocus ? 0 : -1}
                aria-selected={selected}
                aria-label={`Celda ${r + 1}, ${c + 1}${selected ? ", pintada" : ""}`}
                onFocus={() => onCellFocus(r, c)}
                onKeyDown={(e) => onCellKeyDown(e, r, c)}
                onClick={() => onActivateCell(r, c)}
                style={{
                  width: cellSize, height: cellSize,
                  border: "1px solid #6c757d",
                  background: selected ? "#0d6efd" : "#ffffff",
                  outline: isFocus ? "2px solid #ff922b" : "none",
                  outlineOffset: 0
                }}
              />
            );
          })
        )}
      </div>

      {/* Región de mensajes de estado accesibles */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}
      />

      {/* Vista previa suavizada */}
      <div style={{ marginTop: 12 }}>
        <svg
          width={W} height={H}
          role="img"
          aria-label="Vista previa suavizada del trazo"
          style={{ display: "block", border: "1px solid #ddd", background: "#fff" }}
        >
          {previousPaths.map((d, i) => (
            <path key={i} d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
          ))}
          {currentPath && (
            <path d={currentPath} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
          )}
        </svg>
      </div>
    </div>
  );
}
