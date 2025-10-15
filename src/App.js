import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect } from "react";

function DrawingCanvas() {
  const editor = useEditor();

  useEffect(() => {
    if (!editor) return;

    // Selecciona automáticamente la herramienta de lápiz al iniciar
    editor.setCurrentTool("draw");

    // Añadimos un label ARIA para accesibilidad
    const canvasEl = document.querySelector('[data-testid="canvas"]');
    if (canvasEl) {
      canvasEl.setAttribute("role", "application");
      canvasEl.setAttribute("aria-label", "Área de dibujo para firmar o dibujar con el dedo");
      canvasEl.setAttribute("tabindex", "0");
    }
  }, [editor]);

  return null;
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Tldraw autoFocus hideUi>
        <DrawingCanvas />
      </Tldraw>
    </div>
  );
}

