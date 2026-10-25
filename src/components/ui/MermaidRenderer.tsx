'use client';

import { useEffect, useId, useState } from 'react';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

function autoFormatMermaid(input: string): string {
  let s = input
    .replace(/^`{3,4}(?:text)?\s*/i, '')
    .replace(/^`{3,4}(?:mermaid)?\s*/i, '')
    .replace(/`{3,4}$/i, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .trim();

  // If already multiline, return directly
  if (s.includes('\n')) return s;

  // 1. Flowchart / Graph single line:
  if (/^(?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR)/i.test(s)) {
    s = s.replace(/^((?:graph|flowchart)\s+(?:TD|TB|BT|RL|LR))\s+/i, '$1\n  ');
    s = s.replace(/(\]|[\)\}])\s+([A-Za-z0-9_]+(?:\s*\[|\s*\(|\s*\{|\s*-->|\s*-.->|\s*==>))/g, '$1\n  $2');
    return s;
  }

  // 2. Sequence diagram single line:
  if (/^sequenceDiagram/i.test(s)) {
    s = s.replace(/^(sequenceDiagram)\s+/i, '$1\n  ');
    s = s.replace(/\s+(autonumber|actor\s+|participant\s+|loop\s+|alt\s+|opt\s+|end\b|[A-Za-z0-9_]+->>|[A-Za-z0-9_]+-->>|[A-Za-z0-9_]+->)/g, '\n  $1');
    return s;
  }

  // 3. State diagram single line:
  if (/^stateDiagram(?:-v2)?/i.test(s)) {
    s = s.replace(/^(stateDiagram(?:-v2)?)\s+/i, '$1\n  ');
    s = s.replace(/\s+(\[\*\]|[A-Za-z0-9_]+)\s*-->/g, '\n  $1 -->');
    return s;
  }

  return s;
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

        const sanitized = autoFormatMermaid(chart);
        if (!sanitized) return;

        const id = `mermaid_${uniqueId}_${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, sanitized);

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
