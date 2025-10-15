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
    <div className="grid-container" onMouseLeave={handlePointerUp} onMouseUp={handlePointerUp}>
      {Array.from({ length: ROWS }).map((_, row) => (
        <div className="grid-row" key={row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const key = `${row}-${col}`;
            return (
              <div
                key={col}
                className={`grid-cell ${selectedCells[key] ? "selected" : ""}`}
                tabIndex={0} // para VoiceOver
                onFocus={() => markCell(row, col)} // VoiceOver
                onPointerDown={() => handlePointerDown(row, col)} // mouse/touch
                onPointerEnter={() => handlePointerEnter(row, col)}
                onPointerUp={handlePointerUp}
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
