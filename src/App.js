import { useRef, useEffect, useState } from "react";

export default function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [status, setStatus] = useState("Listo para dibujar");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(true);
      setStatus("Dibujando…");
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const stopDrawing = (e) => {
      e.preventDefault();
      if (isDrawing) setStatus("Dibujo detenido");
      setIsDrawing(false);
      ctx.closePath();
    };

    // Eventos táctiles y mouse
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing, { passive: false });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [isDrawing]);

  return (
    <div className="app">
      <h1 className="title">Área de dibujo accesiblet</h1>

      {/* Región interactiva que cede control táctil a la app */}
      <div role="application" aria-labelledby="title">
        <canvas
          ref={canvasRef}
          id="areaDibujo"
          aria-label="Área interactiva para dibujar"
          className="drawing-area"
        ></canvas>
        <p aria-live="polite" id="status" className="sr-only">
          {status}
        </p>
      </div>
    </div>
  );
}
