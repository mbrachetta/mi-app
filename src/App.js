import React, { useRef, useState, useEffect } from "react";

/**
 * Accessible signature SVG:
 * - Touch/mouse drawing (works when SR not intercepting touches)
 * - Keyboard drawing mode (usable with VoiceOver/TalkBack + external keyboard or accessibility keyboard)
 * - aria-live announcements
 */

export default function App() {
  const [lines, setLines] = useState([]); // array of lines; each line is [{x,y},...]
  const [drawing, setDrawing] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [status, setStatus] = useState("Área de firma vacía");
  const svgRef = useRef(null);
  const cursorRef = useRef({ x: 150, y: 100 }); // keyboard cursor position
  const step = 8; // pixels per arrow key press in keyboard mode

  // Helpers para coordenadas relativas al svg
  const getCoords = (e) => {
    const svg = svgRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: Math.max(0, Math.min(svg.width, touch.clientX - svg.left)),
      y: Math.max(0, Math.min(svg.height, touch.clientY - svg.top)),
    };
  };

  // Touch / Mouse handlers
  const startDrawing = (e) => {
    if (keyboardMode) return;
    e.preventDefault();
    const pt = getCoords(e);
    setLines((L) => [...L, [pt]]);
    setDrawing(true);
    setStatus("Dibujando...");
  };

  const draw = (e) => {
    if (keyboardMode) return;
    if (!drawing) return;
    e.preventDefault();
    const pt = getCoords(e);
    setLines((L) => {
      const copy = [...L];
      copy[copy.length - 1] = [...copy[copy.length - 1], pt];
      return copy;
    });
  };

  const endDrawing = (e) => {
    if (keyboardMode) return;
    if (!drawing) return;
    e && e.preventDefault();
    setDrawing(false);
    setStatus("Trazo finalizado");
  };

  // Keyboard drawing handlers (for accessibility)
  useEffect(() => {
    const handler = (e) => {
      if (!keyboardMode) return;
      // prevent page scrolling for arrow keys while in keyboard mode
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      // Toggle drawing with Enter
      if (e.key === "Enter") {
        setLines((L) => {
          // if currently not drawing -> start new line
          if (!drawing) {
            const pos = { ...cursorRef.current };
            setDrawing(true);
            setStatus("Modo teclado: dibujando");
            return [...L, [pos]];
          } else {
            // finish current line
            setDrawing(false);
            setStatus("Modo teclado: trazo finalizado");
            return L;
          }
        });
        return;
      }

      // Move cursor with arrows
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        const cur = cursorRef.current;
        let nx = cur.x;
        let ny = cur.y;
        if (e.key === "ArrowUp") ny = Math.max(0, cur.y - step);
        if (e.key === "ArrowDown") ny = Math.min(getSvgHeight(), cur.y + step);
        if (e.key === "ArrowLeft") nx = Math.max(0, cur.x - step);
        if (e.key === "ArrowRight")
          nx = Math.min(getSvgWidth(), cur.x + step);

        cursorRef.current = { x: nx, y: ny };

        // If currently drawing, append point
        if (drawing) {
          setLines((L) => {
            const copy = [...L];
            copy[copy.length - 1] = [
              ...copy[copy.length - 1],
              { x: nx, y: ny },
            ];
            return copy;
          });
        }

        // Announce cursor moved
        setStatus(`Cursor movido a ${nx}, ${ny}${drawing ? " — dibujando" : ""}`);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardMode, drawing]);

  // Utilities to get svg size safely
  const getSvgWidth = () =>
    svgRef.current ? svgRef.current.getBoundingClientRect().width : 300;
  const getSvgHeight = () =>
    svgRef.current ? svgRef.current.getBoundingClientRect().height : 200;

  // Actions
  const clearAll = () => {
    setLines([]);
    setDrawing(false);
    setStatus("Área de firma vacía");
  };

  const save = () => {
    // Build a simple SVG string from current lines (could be saved or sent to backend)
    const w = getSvgWidth();
    const h = getSvgHeight();
    const paths = lines
      .map(
        (ln) =>
          `<polyline fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${ln
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}" />`
      )
      .join("\n");
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${paths}</svg>`;
    // For demo: log it. In prod: send to server or save as file
    console.log("SVG guardado:", svgString);
    console.log("Coordenadas:", lines);
    setStatus("Firma guardada");
  };

  // Accessibility helper: toggle keyboard mode
  const toggleKeyboardMode = () => {
    setKeyboardMode((k) => {
      const next = !k;
      setStatus(
        next
          ? "Modo teclado activado. Use las flechas para mover el cursor y Enter para comenzar/terminar el trazo."
          : "Modo teclado desactivado. Use touch o mouse para dibujar."
      );
      return next;
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f2f2f2",
        touchAction: "none", // evita gestos del navegador en touch
      }}
    >
      <header
        style={{
          padding: 12,
          background: "#222",
          color: "white",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 16, margin: 0 }}>Firma accesible</h1>

        <button
          onClick={toggleKeyboardMode}
          aria-pressed={keyboardMode}
          aria-label="Alternar modo teclado"
          style={{
            marginLeft: 12,
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: keyboardMode ? "#0a84ff" : "#444",
            color: "white",
          }}
        >
          {keyboardMode ? "Modo teclado: ON" : "Modo teclado: OFF"}
        </button>

        <button
          onClick={clearAll}
          aria-label="Borrar firma"
          style={{
            marginLeft: "auto",
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: "#b91c1c",
            color: "white",
          }}
        >
          Borrar
        </button>

        <button
          onClick={save}
          aria-label="Guardar firma"
          style={{
            marginLeft: 8,
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: "#059669",
            color: "white",
          }}
        >
          Guardar
        </button>
      </header>

      <main
        style={{
          padding: 12,
          height: "calc(100% - 56px)",
        }}
      >
        <div
          role="region"
          aria-label={
            keyboardMode
              ? "Área de firma en modo teclado. Use las flechas para mover el cursor y Enter para empezar/terminar el trazo."
              : "Área de firma. Dibuje con el dedo o mouse."
          }
          tabIndex={0}
          aria-describedby="signature-help"
          style={{
            border: "2px solid #999",
            borderRadius: 8,
            background: "white",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            style={{ display: "block" }}
          >
            {/* existing strokes */}
            {lines.map((ln, i) => (
              <polyline
                key={i}
                fill="none"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ln.map((p) => `${p.x},${p.y}`).join(" ")}
              />
            ))}

            {/* keyboard cursor indicator */}
            {keyboardMode && (
              <circle
                cx={cursorRef.current.x}
                cy={cursorRef.current.y}
                r={6}
                fill="#ff3b30"
                opacity={0.9}
              />
            )}
          </svg>
        </div>

        <div id="signature-help" style={{ marginTop: 8 }}>
          <p style={{ margin: 0 }}>
            {keyboardMode
              ? "Modo teclado: flechas = mover, Enter = comenzar/terminar trazo"
              : "Toca y dibuja con el dedo. Si VoiceOver/TalkBack intercepta, activa 'Modo teclado' para firmar con las flechas."}
          </p>
        </div>

        {/* Live region para anuncios */}
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            left: -10000,
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          {status}
        </div>
      </main>
    </div>
  );
}


