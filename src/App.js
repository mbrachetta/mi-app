import React, { useRef, useState } from "react";
import Signature from "@uiw/react-signature";

function App() {
  const sigRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Área de firma vacía");

  const handlePointer = (pts) => {
    setPoints(pts);
    setStatusMessage("Usuario está firmando");
  };

  const clear = () => {
    sigRef.current.clear();
    setPoints([]);
    setStatusMessage("Firma borrada");
  };

  const save = () => {
    const svgData = sigRef.current.toDataURL("image/svg+xml");
    console.log("Datos SVG:", svgData);
    console.log("Coordenadas:", points);
    setStatusMessage("Firma guardada");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Firma accesible</h1>

      <div
        role="region"
        aria-label="Área de firma. Use el dedo, ratón o teclado para firmar."
        tabIndex={0}
        style={{
          border: "2px solid black",
          width: "300px",
          height: "200px",
          marginBottom: "10px",
        }}
      >
        <Signature
          ref={sigRef}
          onPointer={handlePointer}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div>
        <button onClick={clear} aria-label="Limpiar firma">
          Limpiar
        </button>
        <button onClick={save} aria-label="Guardar firma">
          Guardar
        </button>
      </div>

      <div aria-live="polite" style={{ position: "absolute", opacity: 0 }}>
        {statusMessage}
      </div>
    </div>
  );
}

export default App;

