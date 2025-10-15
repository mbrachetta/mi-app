import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 40; // px

function App() {
  const [selectedCells, setSelectedCells] = useState({});
  const [drawing, setDrawing] = useState(false);
  const containerRef = useRef(null);

  const markCell = (row, col) => {
    const key = `${row}-${col}`;
    setSelectedCells((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  // ---- VoiceOver ----
  const handleFocus = (row, col) => {
    markCell(row, col);
  };

  // ---- Mouse / Touch ----
  const getCellFromPointer = (x, y) => {
    const rect = containerRef.current.getBoundingClientRect();
    const col = Math.floor((x - rect.left) / CELL_SIZE);
    const row = Math.floor((y - rect.top) / CELL_SIZE);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      return { row, col };
    }
    return null;
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDrawing(true);
    const pointerX = e.touches ? e.touches[0].clientX : e.clientX;
    const pointerY = e.touches ? e.touches[0].clientY : e.clientY;
    const cell = getCellFromPointer(pointerX, pointerY);
    if (cell) markCell(cell.row, cell.col);
  };

  const handlePointerMove = (e) => {
    if (!drawing) return;
    const pointerX = e.touches ? e.touches[0].clientX : e.clientX;
    const pointerY = e.touches ? e.touches[0].clientY : e.clientY;
    const cell = getCellFromPointer(pointerX, pointerY);
    if (cell) markCell(cell.row, cell.col);
  };

  const handlePointerUp = () => {
    setDrawing(false);
  };

  return (
    <div
      ref={containerRef}
      className="grid-container"
      role="application"
      aria-label="Cuadrícula de dibujo"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {Array.from({ length: ROWS }).map((_, row) => (
        <div className="grid-row" key={row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const key = `${row}-${col}`;
            return (
              <div
                key={col}
                className={`grid-cell ${selectedCells[key] ? "selected" : ""}`}
                tabIndex={0} // para VoiceOver
                onFocus={() => handleFocus(row, col)} // VoiceOver
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

