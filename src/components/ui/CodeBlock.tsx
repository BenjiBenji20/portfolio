'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import { FiCopy, FiCheck, FiCode, FiTerminal } from 'react-icons/fi';
import { extractCodeMetadata, highlightCode } from '@/lib/codeHighlighter';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const blockId = useId();

  // Extract leading file comments and infer language from file extension if needed
  const { cleanedCode, filename: detectedFilename, language: resolvedLanguage } = useMemo(
    () => extractCodeMetadata(code, filename, language),
    [code, filename, language]
  );

  const lines = useMemo(() => cleanedCode.split('\n'), [cleanedCode]);
  const lineCount = lines.length;

  useEffect(() => {
    let isMounted = true;

    async function runHighlight() {
      try {
        const result = await highlightCode(cleanedCode, resolvedLanguage);
        if (isMounted) {
          setHighlightedHtml(result.html);
        }
      } catch (err) {
        console.warn('[CodeBlock] Highlighting error:', err);
      }
    }

    runHighlight();

    return () => {
      isMounted = false;
    };
  }, [cleanedCode, resolvedLanguage]);

  const handleCopy = async () => {
    if (!cleanedCode) return;
    try {
      await navigator.clipboard.writeText(cleanedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[CodeBlock] Clipboard copy failed:', err);
    }
  };

  const isTerminalOrBash =
    resolvedLanguage === 'bash' ||
    resolvedLanguage === 'shell' ||
    resolvedLanguage === 'sh' ||
    resolvedLanguage === 'shellscript';

  return (
    <div
      className={`my-5 sm:my-6 w-full max-w-full min-w-0 overflow-hidden rounded-none border border-zinc-800/80 bg-zinc-950 shadow-2xl transition-all ${className}`}
    >
      {/* IDE Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 select-none">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Subtle IDE dots (hidden on extra-small mobile to prioritize filename) */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/60" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1 text-zinc-400">
            {isTerminalOrBash ? (
              <FiTerminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            ) : (
              <FiCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}

            {detectedFilename ? (
              <span className="font-mono text-[11px] sm:text-xs text-zinc-200 font-medium truncate">
                {detectedFilename}
              </span>
            ) : (
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-zinc-400 font-medium truncate">
                {resolvedLanguage}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {detectedFilename && (
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700/50">
              {resolvedLanguage}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            title="Copy code to clipboard"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 text-[11px] font-medium">Copied</span>
              </>
            ) : (
              <>
                <FiCopy className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex w-full max-w-full min-w-0 font-mono text-[11px] sm:text-xs bg-[#1a1b26]">
        {/* Line Numbers Gutter (stays pinned while code scrolls horizontally) */}
        {showLineNumbers && lineCount > 1 && (
          <div
            className="select-none py-3 sm:py-3.5 pl-2.5 pr-2 sm:pl-3.5 sm:pr-3 text-right text-zinc-600 bg-zinc-950/60 border-r border-zinc-800/60 shrink-0 font-mono text-[11px] sm:text-xs leading-5 sm:leading-6"
            aria-hidden="true"
          >
            {lines.map((_, i) => (
              <div key={`${blockId}-ln-${i}`} className="h-5 sm:h-6 leading-5 sm:leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Syntax Tokens Content (horizontally scrollable on mobile/narrow screens) */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 py-3 sm:py-3.5 px-3 sm:px-4 font-mono text-[11px] sm:text-xs leading-5 sm:leading-6 text-zinc-200">
          {highlightedHtml ? (
            <div
              className="ide-shiki-container"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre className="font-mono text-[11px] sm:text-xs leading-5 sm:leading-6 text-zinc-300 m-0 p-0 bg-transparent">
              <code>
                {lines.map((line, idx) => (
                  <div key={`${blockId}-raw-${idx}`} className="h-5 sm:h-6 leading-5 sm:leading-6 whitespace-pre">
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
