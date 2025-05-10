"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [id] = useState<string>(`mermaid-${Math.random().toString(36).substring(2, 11)}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid with a theme that works with both light and dark modes
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "strict",
      fontFamily: "inherit",
    });

    const renderDiagram = async () => {
      try {
        setError(null);
        // Use the mermaid API to render the diagram
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (e) {
        console.error("Failed to render mermaid diagram:", e);
        setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/20 text-sm">
        <p className="font-medium">Error rendering diagram:</p>
        <pre className="mt-2 text-xs overflow-auto">{error}</pre>
        <pre className="mt-2 text-xs overflow-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`my-4 flex justify-center overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
} 