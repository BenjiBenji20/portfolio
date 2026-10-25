'use client';

import { useEffect, useId, useState } from 'react';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

export function MermaidRenderer({ chart, className = '' }: MermaidRendererProps) {
  const uniqueId = useId().replace(/[:]/g, '_');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart || !chart.trim()) return;

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            darkMode: true,
            background: '#09090b',
            primaryColor: '#0369a1',
            primaryTextColor: '#f4f4f5',
            primaryBorderColor: '#38bdf8',
            lineColor: '#71717a',
            secondaryColor: '#18181b',
            tertiaryColor: '#27272a',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
          securityLevel: 'loose',
        });

        const id = `mermaid_${uniqueId}_${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[MermaidRenderer] Diagram render failed:', err);
          setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax');
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, uniqueId]);

  if (error) {
    return (
      <div className="my-4 p-4 border border-zinc-800 bg-zinc-950/80 rounded-none space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
          Mermaid Diagram (Raw Source)
        </div>
        <pre className="text-xs font-mono text-zinc-400 overflow-x-auto p-2 bg-zinc-900/60 border border-zinc-800/60">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="my-4 p-6 border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-center text-xs font-mono text-zinc-500 animate-pulse">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className={`my-4 p-4 sm:p-6 border border-zinc-800/80 bg-zinc-950/80 overflow-x-auto shadow-md scrollbar-thin scrollbar-thumb-zinc-700 flex items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
