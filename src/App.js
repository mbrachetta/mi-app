// App.js
import React, { useState } from 'react';
import './App.css';

const ROWS = 20;
const COLS = 20;

function App() {
  // Estado de la grilla: false = celda vacía, true = celda marcada
  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  );

  // Función para marcar/desmarcar celda
  const toggleCell = (row, col) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
  };

  // Función para limpiar la grilla
  const clearGrid = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
  };

  return (
    <div className="App">
      <h1>Área de dibujo accesible</h1>
      <p>
        Toca o haz click en las celdas para dibujar. Funciona con VoiceOver y TalkBack.
      </p>
      <div role="grid" aria-label="Área de dibujo accesible">
        {grid.map((row, i) => (
          <div role="row" key={i} style={{ display: 'flex' }}>
            {row.map((cell, j) => (
              <button
                key={j}
                role="gridcell"
                aria-label={`Fila ${i + 1}, columna ${j + 1}`}
                aria-pressed={cell}
                onClick={() => toggleCell(i, j)}
                onTouchStart={() => toggleCell(i, j)}
                style={{
                  width: 25,
                  height: 25,
                  margin: 1,
                  backgroundColor: cell ? 'black' : 'white',
                  border: '1px solid gray',
                  padding: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={clearGrid}
        style={{ marginTop: 20, padding: '10px 20px' }}
      >
        Borrar dibujo
      </button>
    </div>
  );
}

export default App;



