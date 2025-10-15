import React, { useState } from "react";
import "./App.css";

const ROWS = 10;
const COLS = 10;

function App() {
  const [selectedCells, setSelectedCells] = useState({});
  const [drawing, setDrawing] = useState(false);

  const markCell = (row, col) => {
    const key = `${row}-${col}`;
    setSelectedCells((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  // Eventos de touch/mouse para dibujo libre
  const handlePointerDown = (row, col) => {
    setDrawing(true);
    markCell(row, col);
  };

  const handlePointerEnter = (row, col) => {
    if (drawing) markCell(row, col);
  };

  const handlePointerUp = () => {
    setDrawing(false);
  };

  return (
    <div
      className="grid-container"
      role="application"
      aria-label="Cuadrícula de dibujo"
      onMouseLeave={handlePointerUp} // para cuando el mouse sale del contenedor
    >
      {Array.from({ length: ROWS }).map((_, row) => (
        <div className="grid-row" key={row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const key = `${row}-${col}`;
            return (
              <div
                key={col}
                className={`grid-cell ${selectedCells[key] ? "selected" : ""}`}
                onFocus={() => markCell(row, col)} // VoiceOver
                onPointerDown={() => handlePointerDown(row, col)} // mouse / touch
                onPointerEnter={() => handlePointerEnter(row, col)}
                onPointerUp={handlePointerUp}
                tabIndex={0} // permite que VoiceOver pueda enfocar la celda
                aria-label={`Celda ${row + 1}, ${col + 1}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default App;
