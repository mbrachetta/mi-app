import React, { useMemo, useRef, useState } from "react";

/* ---------- Utilidades ---------- */
function idOf(r, c) { return `${r}:${c}`; }
function centerOf(id, size) {
  const [r, c] = id.split(":").map(Number);
  return { x: c * size + size / 2, y: r * size + size / 2 };
}
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
    const A = (2 * d01a + d12a), C = (2 * d23a + d12a);
    const denom1 = (A + d01a) || 1, denom2 = (C + d23a) || 1;
    const c1x = (-d12a * p0.x + A * p1.x + d01a * p2.x) / denom1;
    const c1y = (-d12a * p0.y + A * p1.y + d01a * p2.y) / denom1;
    const c2x = ( d12a * p3.x + C * p2.x - d23a * p1.x) / denom2;
    const c2y = ( d12a * p3.y + C * p2.y - d23a * p1.y) / denom2;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

/* ---------- App ---------- */
export default function App() {
  // Tamaño del lienzo
  const rows = 32, cols = 64, cellSize = 14;
  const W = cols * cellSize, H = rows * cellSize;

  // Estado accesible
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [paintMode, setPaintMode] = useState(false);
  const [painted, setPainted] = useState(new Set());          // celdas pintadas
  const [current, setCurrent] = useState(null);               // trazo actual {cells:[], points:[]}
  const [strokes, setStrokes] = useState([]);                 // trazos finalizados
  const liveRef = useRef(null);

  const announce = (msg) => { if (liveRef.current) liveRef.current.textContent = msg; };

  // Acciones de trazo
  const startStrokeAt = (r, c) => {
    const k = idOf(r,c);
    const p = centerOf(k, cellSize);
    setPainted(prev => new Set(prev).add(k));
    setCurrent({ cells:[k], points:[p] });
    announce(`Inicio de trazo en fila ${r+1}, columna ${c+1}.`);
  };
  const addCellToStroke = (r, c) => {
    const k = idOf(r,c);
    setPainted(prev => { const n = new Set(prev); n.add(k); return n; });
    if (current) {
      setCurrent({
        cells: [...current.cells, k],
        points: [...current.points, centerOf(k, cellSize)]
      });
    }
    announce(`Pintada fila ${r+1}, columna ${c+1}.`);
  };
  const finishStroke = () => {
    if (!current) return;
    setStrokes(prev => [...prev, current]);
    setCurrent(null);
    announce("Trazo finalizado.");
  };

  // Cuando muevas Fila/Columna (con VO: gestos de ajuste), pinta si el modo está ON
  const onChangeRow = (e) => {
    const r = Number(e.target.value);
    setRow(r);
    if (paintMode) {
      if (!current) startStrokeAt(r, col); else addCellToStroke(r, col);
    } else {
      announce(`Fila ${r+1} de ${rows}.`);
    }
  };
  const onChangeCol = (e) => {
    const c = Number(e.target.value);
    setCol(c);
    if (paintMode) {
      if (!current) startStrokeAt(row, c); else addCellToStroke(row, c);
    } else {
      announce(`Columna ${c+1} de ${cols}.`);
    }
  };

  const togglePaintMode = () => {
    const next = !paintMode;
    setPaintMode(next);
    if (!next && current) finishStroke();            // al apagar, cerramos el trazo
    if (next && !current) startStrokeAt(row, col);   // al encender, arrancamos en la celda actual
  };
  const resetAll = () => {
    setPainted(new Set()); setStrokes([]); setCurrent(null);
    announce("Lienzo reiniciado.");
  };

  // Paths suavizados (vista previa)
  const strokeColor = "#0d6efd", strokeWidth = 2, alpha = 0.5;
  const previousPaths = useMemo(
    () => strokes.map(s => catmullRomToBezier(s.points, alpha)),
    [strokes, alpha]
  );
  const currentPath = useMemo(
    () => (current && current.points && current.points.length >= 2)
      ? catmullRomToBezier(current.points, alpha) : "",
    [current, alpha]
  );

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px" }}>Firma por grilla + panel accesible (VO)</h1>

      {/* Panel de control accesible */}
      <div role="group" aria-labelledby="ctl-title" style={{ display:"grid", gap:8, maxWidth: 420 }}>
        <h2 id="ctl-title" style={{ margin: 0, fontSize: 18 }}>Controles</h2>

        <label>
          Fila: {row+1} / {rows}
          <input
            type="range"
            min="0" max={rows-1} step="1"
            value={row}
            onChange={onChangeRow}
            aria-label="Fila"
          />
        </label>

        <label>
          Columna: {col+1} / {cols}
          <input
            type="range"
            min="0" max={cols-1} step="1"
            value={col}
            onChange={onChangeCol}
            aria-label="Columna"
          />
        </label>

        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={togglePaintMode}
            aria-pressed={paintMode}
            aria-label={`Modo pintar ${paintMode ? "activado" : "desactivado"}`}
          >
            {paintMode ? "🖊️ Modo pintar: ON" : "🖊️ Modo pintar: OFF"}
          </button>

          <button onClick={() => (!current ? startStrokeAt(row, col) : finishStroke())}>
            {!current ? "Iniciar trazo" : "Finalizar trazo"}
          </button>

          <button onClick={resetAll}>Reiniciar</button>
        </div>
      </div>

      {/* Mensajes accesibles sin mover foco */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ position:"absolute", left:-9999, width:1, height:1, overflow:"hidden" }}
      />

      {/* Grilla visual (no focusable) */}
      <div
        aria-label="Grilla de firma"
        role="img"
        aria-description={`Vista del lienzo. Celda actual fila ${row+1}, columna ${col+1}.`}
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: 2,
          userSelect: "none",
          touchAction: "none" // no es esencial para VO, pero evita scroll accidental
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const k = idOf(r,c);
            const isPainted = painted.has(k);
            const isCursor = r === row && c === col;
            return (
              <div
                key={k}
                style={{
                  width: cellSize, height: cellSize,
                  border: "1px solid #6c757d",
                  background: isPainted ? "#0d6efd" : "#fff",
                  outline: isCursor ? "2px solid #ff922b" : "none",
                  outlineOffset: 0
                }}
              />
            );
          })
        )}
      </div>

      {/* Vista previa suavizada (oculta para VO) */}
      <div style={{ marginTop: 12 }}>
        <svg
          width={W} height={H}
          aria-hidden="true" focusable="false"
          style={{ display:"block", border:"1px solid #ddd", background:"#fff" }}
        >
          {previousPaths.map((d,i) => (
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
