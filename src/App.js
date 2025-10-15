import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <header
        style={{
          background: "#222",
          color: "white",
          padding: "0.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.2rem" }}>Firma accesible con tldraw</h1>
        <p>
          Use su mouse o dedo para firmar. Los lectores de pantalla pueden usar
          navegación por teclado para explorar herramientas y avisos.
        </p>
      </header>

      <main
        role="region"
        aria-label="Área de firma"
        style={{ width: "100%", height: "calc(100% - 80px)" }}
      >
        <Tldraw />
      </main>
    </div>
  );
}

export default App;
