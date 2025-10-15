import React, { useState } from "react";
import "./App.css";

const ROWS = 10;
const COLS = 10;

function App() {
  const [selectedCells, setSelectedCells] = useState({});

  const markCell = (row, col) => {
    const key = `${row}-${col}`;
    setSelectedCells((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  return (
    <div className="grid-container" role="application" aria-label="Cuadrícula de dibujo">
      {Array.from({ length: ROWS }).map((_, row) => (
        <div className="grid-row" key={row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const key = `${row}-${col}`;
            return (
              <button
                key={col}
                className={`grid-cell ${selectedCells[key] ? "selected" : ""}`}
                onFocus={() => markCell(row, col)}
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
