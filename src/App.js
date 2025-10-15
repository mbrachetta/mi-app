import React, { useEffect, useMemo, useRef, useState } from "react";

/* --- Utilidades --- */
function cellId(r, c) { return `${r}:${c}`; }
function cellCenter(id, size) {
  const [r, c] = id.split(":").map(Number);
  return { x: c * size + size / 2, y: r * size + size / 2 };
}
// Catmull–Rom (centrípeta) → Bezier cúbicas (para <path d="...">)
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

/* --- App --- */
export default function App() {
  // Ajustes
  const rows = 24, cols = 48, cellSize = 16;  // puedes ajustar densidad
  const strokeColor = "#0d6efd", strokeWidth = 2, alpha = 0.5;

  // Estado
  const [paintMode, setPaintMode] = useState(false);     // ON: pinta al enfocar
  const [painted, setPainted] = useState(new Set());     // celdas pintadas
  const [focusCell, setFocusCell] = useState({ r: 0, c: 0 });
  const [current, setCurrent] = useState(null);          // {cells:[], points:[]}
  const [strokes, setStrokes] = useState([]);            // trazos finalizados
  const liveRef = useRef(null);

  const announce = (msg) => { if (liveRef.current) liveRef.current.textContent = msg; };
  const W = cols * cellSize, H = rows * cellSize;

  // Acciones de trazo
  const startStrokeAt = (r, c) => {
    const id = cellId(r, c);
    const p = cellCenter(id, cellSize);
    setPainted(prev => new Set(prev).add(id));
    setCurrent({ cells: [id], points: [p] });
    announce("Inicio de trazo.");
  };
  const addCellToStroke = (r, c) => {
    const id = cellId(r, c);
    setPainted(prev => { const n = new Set(prev); n.add(id); return n; });
    if (current) {
      setCurrent({
        cells: [...current.cells, id],
        points: [...current.points, cellCenter(id, cellSize)]
      });
    }
    announce(`Celda ${r+1}, ${c+1} pintada.`);
  };
  const finishStroke = () => {
    if (!current) return;
    setStrokes(prev => [...prev, current]);
    setCurrent(null);
    announce("Trazo finalizado.");
  };

  // Foco / navegación
  const moveFocus = (dr, dc) => {
    const r = (focusCell.r + dr + rows) % rows;
    const c = (focusCell.c + dc + cols) % cols;
    setFocusCell({ r, c });
    const el = document.getElementById(`cell-${r}-${c}`);
    if (el) el.focus();
    if (paintMode) {
      if (!current) startStrokeAt(r, c); else addCellToStroke(r, c);
    }
  };
  const onCellFocus = (r, c) => {
    setFocusCell({ r, c });
    if (paintMode) {
      if (!current) startStrokeAt(r, c); else addCellToStroke(r, c);
    }
  };
  const onCellKeyDown = (e, r, c) => {
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); moveFocus(0, 1); break;
      case "ArrowLeft":  e.preventDefault(); moveFocus(0,-1); break;
      case "ArrowDown":  e.preventDefault(); moveFocus(1, 0); break;
      case "ArrowUp":    e.preventDefault(); moveFocus(-1,0); break;
      case " ":
        e.preventDefault();
        if (!current) startStrokeAt(r, c); else addCellToStroke(r, c);
        break;
      case "Enter":
        e.preventDefault();
        if (!current) startStrokeAt(r, c); else finishStroke();
        break;
      default: break;
    }
  };
  const onCellActivate = (r, c) => { // click / doble toque VO
    if (!current) startStrokeAt(r, c); else addCellToStroke(r, c);
  };

  // Foco inicial
  useEffect(() => {
    const el = document.getElementById("cell-0-0");
    el && el.focus();
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

  // Controles superiores
  const togglePaintMode = () => {
    const next = !paintMode;
    setPaintMode(next);
    if (!next && current) finishStroke(); // al apagar, cerramos trazo
    if (next && !current) startStrokeAt(focusCell.r, focusCell.c); // al encender, arrancamos
  };
  const resetAll = () => {
    setPainted(new Set()); setCurrent(null); setStrokes([]);
    announce("Lienzo reiniciado.");
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px" }}>Firma por grilla accesible (VO) + suavizado</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={togglePaintMode}
          aria-pressed={paintMode}
          aria-label={`Modo pintar ${paintMode ? "activado" : "desactivado"}`}
        >
          {paintMode ? "🖊️ Modo pintar: ON" : "🖊️ Modo pintar: OFF"}
        </button>
        <button onClick={() => (!current ? startStrokeAt(focusCell.r, focusCell.c) : finishStroke())}>
          {!current ? "Iniciar trazo (Enter)" : "Finalizar trazo (Enter)"}
        </button>
        <button onClick={resetAll}>Reiniciar</button>
      </div>

      <p id="help">
        Con <strong>Modo pintar ON</strong>, al moverte con VoiceOver por las celdas
        estas se pintan automáticamente y el trazo se construye. Con <strong>Modo pintar OFF</strong>,
        activa celdas con doble toque (VO) o con barra espaciadora. Usa <kbd>Enter</kbd> para
        iniciar/finalizar trazo.
      </p>

      {/* --- REJILLA DE BOTONES (no usamos role="grid" para evitar problemas móviles) --- */}
      <div
        aria-labelledby="help"
        aria-describedby="help"
        role="group"
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: 2
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const id = cellId(r, c);
            const pressed = painted.has(id);
            const isFocus = (focusCell.r === r && focusCell.c === c);
            return (
              <button
                key={id}
                id={`cell-${r}-${c}`}
                aria-pressed={pressed}
                aria-label={`Celda ${r+1}, ${c+1}${pressed ? ", pintada" : ""}`}
                tabIndex={isFocus ? 0 : -1}
                onFocus={() => onCellFocus(r, c)}
                onKeyDown={(e) => onCellKeyDown(e, r, c)}
                onClick={() => onCellActivate(r, c)}
                style={{
                  width: cellSize, height: cellSize,
                  border: "1px solid #6c757d",
                  background: pressed ? "#0d6efd" : "#ffffff",
                  outline: isFocus ? "2px solid #ff922b" : "none",
                  padding: 0, lineHeight: 0
                }}
              />
            );
          })
        )}
      </div>

      {/* Región de mensajes accesibles (VO anunciará estados sin mover foco) */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}
      />

      {/* --- VISTA PREVIA SUAVIZADA --- 
           IMPORTANTÍSIMO: aria-hidden="true" para que VO NO se vaya a la "imagen" */}
      <div style={{ marginTop: 12 }}>
        <svg
          width={W} height={H}
          aria-hidden="true" focusable="false"
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
