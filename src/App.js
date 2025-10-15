import React, { useEffect, useMemo, useRef, useState } from "react";

// -------- Utilidades de geometría (JS puro) --------
function cellId(r, c) {
  return `${r}:${c}`;
}

function cellCenter(id, size) {
  const [r, c] = id.split(":").map(Number);
  return { x: c * size + size / 2, y: r * size + size / 2 };
}

// Catmull–Rom (centrípeta) → segmentos Bezier cúbicos, devuelve atributo `d` para <path>
function catmullRomToBezier(points, alpha = 0.5) {
  if (!points || points.length < 2) return "";
  const pts = points.slice();
  // duplicar extremos para condiciones de contorno
  pts.unshift(points[0]);
  pts.push(points[points.length - 1]);

  const d = [`M ${pts[1].x} ${pts[1].y}`];

  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3];

    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

    // Evitar ceros
    const d01a = Math.pow(d01 || 1, alpha);
    const d12a = Math.pow(d12 || 1, alpha);
    const d23a = Math.pow(d23 || 1, alpha);

    const A = (2 * d01a + d12a), B = (d01a + 2 * d12a);
    const C = (2 * d23a + d12a), E = (d23a + 2 * d12a);

    // Denominadores de control; fallback a puntos intermedios
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

// -------- Componente principal --------
export default function App() {
  // Ajusta la densidad de la grilla aquí
  const rows = 32, cols = 64, cellSize = 14;
  const strokeColor = "#0d6efd", strokeWidth = 2, alpha = 0.5;

  // Estado de celdas pintadas
  const [painted, setPainted] = useState(new Set());
  // Celda con foco (roving tabindex)
  const [focusCell, setFocusCell] = useState({ r: 0, c: 0 });
  // Trazo actual y trazos finalizados (para la vista previa suave)
  const [current, setCurrent] = useState(null);      // { cells: string[], points: {x,y}[] }
  const [strokes, setStrokes] = useState([]);        // array de strokes terminados

  const liveRef = useRef(null);

  const announce = (msg) => {
    if (liveRef.current) {
      liveRef.current.textContent = msg;
    }
  };

  // Comienza un trazo en (r,c)
  const startStroke = (r, c) => {
    const id = cellId(r, c);
    const p = cellCenter(id, cellSize);
    setPainted(prev => new Set(prev).add(id));
    setCurrent({ cells: [id], points: [p] });
    announce("Inicio de trazo.");
  };

  // Termina el trazo actual
  const finishStroke = () => {
    if (!current) return;
    setStrokes(prev => [...prev, current]);
    setCurrent(null);
    announce("Trazo finalizado.");
  };

  // Activa/desactiva una celda; si hay trazo en curso, añade punto
  const toggleCell = (r, c) => {
    const id = cellId(r, c);
    setPainted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (current) {
      setCurrent({
        cells: [...current.cells, id],
        points: [...current.points, cellCenter(id, cellSize)]
      });
    }
    announce(`Celda ${r + 1}, ${c + 1} ${painted.has(id) ? "desactivada" : "pintada"}.`);
  };

  // Mueve el foco con flechas
  const moveFocus = (dr, dc) => {
    const r = (focusCell.r + dr + rows) % rows;
    const c = (focusCell.c + dc + cols) % cols;
    setFocusCell({ r, c });
    const el = document.getElementById(`cell-${r}-${c}`);
    if (el) el.focus();
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
        if (!current) startStroke(r, c); else toggleCell(r, c);
        break;
      case "Enter":
        e.preventDefault();
        if (!current) startStroke(r, c); else finishStroke();
        break;
      default: break;
    }
  };

  // Foco inicial en [0,0]
  useEffect(() => {
    const el = document.getElementById("cell-0-0");
    if (el) el.focus();
  }, []);

  // Paths suavizados (previos y actual)
  const previousPaths = useMemo(
    () => strokes.map(s => catmullRomToBezier(s.points, alpha)),
    [strokes, alpha]
  );
  const currentPath = useMemo(
    () => (current && current.points && current.points.length >= 2)
      ? catmullRomToBezier(current.points, alpha) : "",
    [current, alpha]
  );

  const W = cols * cellSize, H = rows * cellSize;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 12px" }}>Firma por grilla (accesible) + suavizado</h1>
      <p id="grid-help" style={{ marginTop: 0 }}>
        Use <strong>flechas</strong> para moverse, <strong>Barra espaciadora</strong> para pintar,
        <strong> Enter</strong> para iniciar/terminar un trazo.
        Con VoiceOver, active celdas con doble toque.
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
              <button
                key={id}
                id={`cell-${r}-${c}`}
                role="gridcell"
                aria-selected={selected}
                aria-label={`Celda ${r + 1}, ${c + 1}${selected ? ", pintada" : ""}`}
                tabIndex={isFocus ? 0 : -1}
                onKeyDown={(e) => onCellKeyDown(e, r, c)}
                onClick={() => (!current ? startStroke(r, c) : toggleCell(r, c))}
                style={{
                  width: cellSize,
                  height: cellSize,
                  border: "1px solid #6c757d",
                  background: selected ? "#0d6efd" : "#ffffff",
                  // foco visible (WCAG 2.4.7)
                  outline: isFocus ? "2px solid #ff922b" : "none",
                  outlineOffset: 0,
                  padding: 0,
                  lineHeight: 0
                }}
              />
            );
          })
        )}
      </div>

      {/* Región de mensajes (no mueve el foco) */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}
      />

      {/* Vista previa suavizada */}
      <div style={{ marginTop: 12 }}>
        <svg
          width={W}
          height={H}
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
