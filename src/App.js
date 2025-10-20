import { useRef, useEffect, useState } from "react";

export default function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const startDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(true);
      const { x, y } = getCoords(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoords(e, canvas);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const stopDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(false);
      ctx.closePath();
    };

    const getCoords = (e, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    // Eventos táctiles y de mouse
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
      <h1 className="title">Área de dibujo accesible</h1>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        tabIndex={-1}
        className="drawing-area"
      ></canvas>
    </div>
  );
}
