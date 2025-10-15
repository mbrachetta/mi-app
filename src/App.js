import { useState, useRef } from "react";

export default function App() {
  const [lines, setLines] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const svgRef = useRef(null);

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoords(e);
    setLines([...lines, [{ x, y }]]);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const newLines = [...lines];
    newLines[newLines.length - 1].push({ x, y });
    setLines(newLines);
  };

  const endDrawing = () => setDrawing(false);

  const getCoords = (e) => {
    const svg = svgRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - svg.left,
      y: touch.clientY - svg.top,
    };
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f8f8f8",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <button
        aria-label="Borrar dibujo"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
        }}
        onClick={() => setLines([])}
      >
        Borrar
      </button>

      <svg
        ref={svgRef}
        role="application"
        aria-label="Área de dibujo accesible. Dibuje con el dedo o mouse."
        width="100%"
        height="100%"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        style={{
          background: "#fff",
          display: "block",
        }}
      >
        {lines.map((line, i) => (
          <polyline
            key={i}
            fill="none"
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={line.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        ))}
      </svg>
    </div>
  );
}

