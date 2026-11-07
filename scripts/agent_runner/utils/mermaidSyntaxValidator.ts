/**
 * Stringent Mermaid Syntax Validator & Sanitizer
 * 
 * Enforces literal diagram syntax conforming strictly to documentation/mermaid_diagram_syntax_guide.md:
 * - Flowchart TD / LR: Nodes wrapped in double quotes (e.g. NodeA["Step Name"], DB[("Database")])
 * - Sequence diagrams: Actor, participant, autonumber, directional arrows (->>, -->>)
 * - Auto-sanitizes unquoted shape contents and validates line-by-line syntax.
 */

export interface MermaidValidationResult {
  valid: boolean;
  sanitized?: string;
  errorReport?: string;
}

const VALID_HEADERS = [
  'flowchart TD',
  'flowchart LR',
  'flowchart TB',
  'flowchart BT',
  'flowchart RL',
  'graph TD',
  'graph LR',
  'graph TB',
  'graph BT',
  'graph RL',
  'sequenceDiagram',
  'stateDiagram-v2',
  'stateDiagram',
];

/**
 * Sanitizes edge labels inside pipe notation |...|:
 * - Strips all quotes (" and ') and shape delimiters (parentheses, brackets, curly braces)
 *   from edge labels so Mermaid parses them as clean, valid plain text.
 * e.g. |Run Audit Command("-b")| -> |Run Audit Command -b|
 *      |"Display Report(" 'stdout' ")"| -> |Display Report stdout|
 *      |"Execute 'deadlink'"| -> |Execute deadlink|
 */
function sanitizeEdgeLabels(line: string): string {
  return line.replace(/\|([^|\r\n]+)\|/g, (_match, inner) => {
    // Strip quotes and shape delimiter characters that trigger Mermaid tokenizer crashes
    const cleanText = inner.replace(/["'()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
    return `|${cleanText}|`;
  });
}

/**
 * Auto-wraps unquoted text inside node shapes with double quotes to prevent parser crashes,
 * and sanitizes special characters like '::' (class binding operator) inside node labels.
 * e.g. NodeA[Web Browser (Client)] -> NodeA["Web Browser (Client)"]
 *      DB[(Sanity Content Lake)] -> DB[("Sanity Content Lake")]
 */
function autoQuoteNodeLabels(line: string): string {
  let result = line;

  // Sanitize double colons '::' inside brackets to single colons ': ' to avoid Mermaid class operator confusion
  result = result.replace(/(\[[^\]]*?)::([^\]]*?\])/g, '$1: $2');

  // 1. Cylinder: ID[(Label)] -> ID[("Label")]
  result = result.replace(/(\b\w+)\s*\[\(\s*([^"\]\)]+?)\s*\)\]/g, '$1[("$2")]');

  // 2. Stadium: ID([Label]) -> ID(["Label"])
  result = result.replace(/(\b\w+)\s*\(\[\s*([^"\]\)]+?)\s*\]\)/g, '$1(["$2"])');

  // 3. Circle: ID((Label)) -> ID(("Label"))
  result = result.replace(/(\b\w+)\s*\(\(\s*([^"\]\)]+?)\s*\)\)/g, '$1(("$2"))');

  // 4. Rectangle: ID[Label] or ID["Label with ("inner") quotes"] -> ID["Clean Label"]
  result = result.replace(/(\b\w+)\s*\[\s*([^\]|]+?)\s*\]/g, (match, id, text) => {
    const trimmed = text.trim();
    // If text is a cylinder or stadium delimiter, leave alone
    if (trimmed.startsWith('(') || trimmed.endsWith(')')) {
      return match;
    }
    let inner = trimmed;
    if (inner.startsWith('"') && inner.endsWith('"')) {
      inner = inner.slice(1, -1);
    }
    // Strip all inner quotes from node label to prevent Mermaid tokenizer crashes
    const clean = inner.replace(/["']/g, '').trim();
    return `${id}["${clean}"]`;
  });

  // 5. Rounded: ID(Label) -> ID("Label")
  result = result.replace(/(\b\w+)\s*\(\s*([^)\(]+?)\s*\)/g, (match, id, text) => {
    const trimmed = text.trim();
    if (trimmed.startsWith('[') || trimmed.endsWith(']')) {
      return match;
    }
    let inner = trimmed;
    if (inner.startsWith('"') && inner.endsWith('"')) {
      inner = inner.slice(1, -1);
    }
    const clean = inner.replace(/["']/g, '').trim();
    return `${id}("${clean}")`;
  });

  // 6. Rhombus / Decision: ID{Label} -> ID{"Label"}
  result = result.replace(/(\b\w+)\s*\{\s*([^}{]+?)\s*\}/g, (_match, id, text) => {
    let inner = text.trim();
    if (inner.startsWith('"') && inner.endsWith('"')) {
      inner = inner.slice(1, -1);
    }
    const clean = inner.replace(/["']/g, '').trim();
    return `${id}{"${clean}"}`;
  });

  return result;
}

/**
 * Validates delimiter pairing (square brackets, parentheses, curly braces)
 */
function checkDelimiterBalance(code: string): string | null {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ']': '[', ')': '(', '}': '{' };

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '"') {
      // Skip quoted strings
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') i++; // Skip escaped char
        i++;
      }
      continue;
    }

    if (char === '[' || char === '(' || char === '{') {
      stack.push(char);
    } else if (char === ']' || char === ')' || char === '}') {
      const last = stack.pop();
      if (last !== pairs[char]) {
        return `Mismatched shape delimiter: found '${char}' but expected matching for '${last || 'none'}'.`;
      }
    }
  }

  if (stack.length > 0) {
    return `Unclosed shape delimiter: '${stack.pop()}' is missing its closing counterpart.`;
  }

  return null;
}

/**
 * Main validator: sanitizes fences, checks header, balances delimiters, and ensures line integrity.
 */
export function validateAndSanitizeMermaid(rawInput?: string | null): MermaidValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { valid: true, sanitized: undefined };
  }

  // 1. Strip markdown fences and whitespace
  const rawClean = rawInput
    .replace(/^`{3,4}(?:mermaid)?\r?\n?/i, '')
    .replace(/\r?\n?`{3,4}$/i, '')
    .trim();

  if (!rawClean) {
    return { valid: true, sanitized: undefined };
  }

  const lines = rawClean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { valid: true, sanitized: undefined };
  }

  // 2. Validate Declaration Header
  const firstLine = lines[0];
  const hasValidHeader = VALID_HEADERS.some(
    (h) => firstLine.toLowerCase() === h.toLowerCase() || firstLine.toLowerCase().startsWith(`${h.toLowerCase()} `)
  );

  if (!hasValidHeader) {
    return {
      valid: false,
      errorReport: `Invalid Mermaid header: "${firstLine}". Must begin with one of: ${VALID_HEADERS.slice(0, 4).join(', ')}, or sequenceDiagram.`,
    };
  }

  // 3. Auto-sanitize edge labels (replaces nested quotes in |"..."| with single quotes)
  const edgeSanitizedLines = lines.map(sanitizeEdgeLabels);
  const intermediateCode = edgeSanitizedLines.join('\n');

  // 4. Delimiter Balance Check
  const balanceError = checkDelimiterBalance(intermediateCode);
  if (balanceError) {
    return {
      valid: false,
      errorReport: `Mermaid Syntax Error: ${balanceError}`,
    };
  }

  // 5. Auto-sanitize line by line (auto-quote unquoted labels and strip inline styles)
  const sanitizedLines: string[] = [edgeSanitizedLines[0]];

  for (let i = 1; i < edgeSanitizedLines.length; i++) {
    let line = edgeSanitizedLines[i];

    // Strip forbidden inline css/classes (e.g. style A fill:#fff, classDef ...)
    if (/^\s*(?:style\s+|classDef\s+|class\s+\w+\s+\w+)/i.test(line)) {
      continue;
    }

    // Auto-quote shape labels for flowchart diagrams
    if (edgeSanitizedLines[0].toLowerCase().startsWith('flowchart') || edgeSanitizedLines[0].toLowerCase().startsWith('graph')) {
      line = autoQuoteNodeLabels(line);
    }

    sanitizedLines.push(line);
  }

  const finalCode = sanitizedLines.join('\n');

  return {
    valid: true,
    sanitized: finalCode,
  };
}

