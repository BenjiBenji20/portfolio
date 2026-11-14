import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki';

// Core languages prioritized for the developer portfolio and autonomous devlogs
export const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'python',
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'bash',
  'shellscript',
  'json',
  'yaml',
  'markdown',
  'html',
  'css',
  'sql',
  'dockerfile',
];

export const PRIMARY_THEME: BundledTheme = 'tokyo-night';

// Language alias mapping
const LANGUAGE_ALIASES: Record<string, BundledLanguage> = {
  py: 'python',
  python: 'python',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  tsx: 'tsx',
  jsx: 'jsx',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  shellscript: 'shellscript',
  zsh: 'bash',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  html: 'html',
  css: 'css',
  sql: 'sql',
  docker: 'dockerfile',
  dockerfile: 'dockerfile',
};

// Extension to language mapping
const EXTENSION_MAP: Record<string, BundledLanguage> = {
  py: 'python',
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  sh: 'bash',
  bash: 'bash',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  html: 'html',
  css: 'css',
  sql: 'sql',
  dockerfile: 'dockerfile',
};

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Returns a cached singleton instance of the Shiki highlighter.
 */
export async function getHighlighterSingleton(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [PRIMARY_THEME],
      langs: SUPPORTED_LANGUAGES,
    });
  }
  return highlighterPromise;
}

export interface CodeMetadata {
  cleanedCode: string;
  filename?: string;
  language: string;
}

/**
 * Parses raw code text to extract leading file path annotations and infer language.
 * Supports patterns like:
 *   // src/extractor/extract_invoice.py
 *   # scripts/deploy.py
 *   /* src/components/Button.tsx * /
 */
export function extractCodeMetadata(
  rawCode: string,
  defaultFilename?: string,
  defaultLang?: string
): CodeMetadata {
  if (!rawCode) {
    return { cleanedCode: '', filename: defaultFilename, language: defaultLang || 'text' };
  }

  const lines = rawCode.split('\n');
  const firstLine = lines[0]?.trim() || '';

  let detectedFilename = defaultFilename;
  let codeLines = lines;

  // Pattern matches // path/to/file.ext or # path/to/file.ext or /* path/to/file.ext */
  const headerMatch = firstLine.match(
    /^(?:\/\/|#|\/\*)\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9_\-]+)\s*(?:\*\/)?$/
  );

  if (headerMatch && headerMatch[1]) {
    detectedFilename = detectedFilename || headerMatch[1].replace(/\\/g, '/');
    // Drop the comment line from the rendered code block so it appears cleanly in the header
    codeLines = lines.slice(1);
    // If the next line is an empty line immediately following the header comment, strip it as well
    if (codeLines.length > 0 && codeLines[0].trim() === '') {
      codeLines = codeLines.slice(1);
    }
  }

  // Infer language
  let normalizedLang = (defaultLang || '').toLowerCase().trim();

  // If language is unspecified or plain 'text', attempt resolution via filename extension
  if ((!normalizedLang || normalizedLang === 'text' || normalizedLang === 'plain') && detectedFilename) {
    const ext = detectedFilename.split('.').pop()?.toLowerCase();
    if (ext && EXTENSION_MAP[ext]) {
      normalizedLang = EXTENSION_MAP[ext];
    } else if (detectedFilename.toLowerCase().includes('dockerfile')) {
      normalizedLang = 'dockerfile';
    }
  }

  const finalLanguage = LANGUAGE_ALIASES[normalizedLang] || normalizedLang || 'text';

  return {
    cleanedCode: codeLines.join('\n'),
    filename: detectedFilename,
    language: finalLanguage,
  };
}

/**
 * Highlights a snippet of code with Shiki using Tokyo Night theme.
 * Gracefully falls back to escaped HTML if language is unsupported or highlighting fails.
 */
export async function highlightCode(
  code: string,
  lang = 'text'
): Promise<{ html: string; language: string }> {
  const normalizedLang = LANGUAGE_ALIASES[lang.toLowerCase()] || lang.toLowerCase();

  try {
    const highlighter = await getHighlighterSingleton();
    const availableLangs = highlighter.getLoadedLanguages();

    const targetLang = availableLangs.includes(normalizedLang) ? normalizedLang : 'text';

    const html = highlighter.codeToHtml(code, {
      lang: targetLang,
      theme: PRIMARY_THEME,
    });

    return { html, language: targetLang };
  } catch (err) {
    console.warn(`[CodeHighlighter] Highlighting failed for lang "${lang}", falling back:`, err);
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return {
      html: `<pre class="shiki tokyo-night"><code>${escaped}</code></pre>`,
      language: 'text',
    };
  }
}
