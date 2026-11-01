import crypto from 'node:crypto';

export interface PortableTextChild {
  _key: string;
  _type: 'span';
  text: string;
  marks: string[];
}

export interface PortableTextBlock {
  _key: string;
  _type: 'block';
  style: 'normal' | 'h1' | 'h2' | 'h3' | 'blockquote';
  children: PortableTextChild[];
  markDefs: Array<{ _key: string; _type: string; href?: string }>;
  listItem?: 'bullet' | 'number';
  level?: number;
}

function genKey(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Parses inline formatting (**bold**, *italic*, `code`, [link](url)) into PortableTextChild spans.
 */
function parseInlineSpans(text: string, markDefs: Array<{ _key: string; _type: string; href?: string }>): PortableTextChild[] {
  if (!text) {
    return [{ _key: genKey(), _type: 'span', text: '', marks: [] }];
  }

  // Regex tokens: links, bold, italic, code
  // [text](url) | **bold** | *italic* | `code`
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const spans: PortableTextChild[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Leading plain text
    if (match.index > lastIndex) {
      spans.push({
        _key: genKey(),
        _type: 'span',
        text: text.slice(lastIndex, match.index),
        marks: [],
      });
    }

    if (match[2] && match[3]) {
      // Link: [text](url)
      const linkKey = genKey();
      markDefs.push({ _key: linkKey, _type: 'link', href: match[3] });
      spans.push({
        _key: genKey(),
        _type: 'span',
        text: match[2],
        marks: [linkKey],
      });
    } else if (match[4]) {
      // Bold: **text**
      spans.push({
        _key: genKey(),
        _type: 'span',
        text: match[4],
        marks: ['strong'],
      });
    } else if (match[5]) {
      // Italic: *text*
      spans.push({
        _key: genKey(),
        _type: 'span',
        text: match[5],
        marks: ['em'],
      });
    } else if (match[6]) {
      // Code: `text`
      spans.push({
        _key: genKey(),
        _type: 'span',
        text: match[6],
        marks: ['code'],
      });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    spans.push({
      _key: genKey(),
      _type: 'span',
      text: text.slice(lastIndex),
      marks: [],
    });
  }

  return spans.length > 0 ? spans : [{ _key: genKey(), _type: 'span', text, marks: [] }];
}

/**
 * Converts markdown text into an array of Sanity Portable Text blocks.
 */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const rawLines = markdown.split(/\r?\n/);
  const blocks: PortableTextBlock[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Code Block Fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Closing code block
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n');
        codeBuffer = [];
        if (codeText.trim()) {
          blocks.push({
            _key: genKey(),
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [
              {
                _key: genKey(),
                _type: 'span',
                text: codeText,
                marks: ['code'],
              },
            ],
          });
        }
      } else {
        // Opening code block
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Skip empty lines (Portable Text separates paragraphs naturally)
    if (!trimmed) {
      continue;
    }

    // Strip out raw HTML wrapper tags like <div align="..."> or </div> or <p>
    const cleanLine = trimmed
      .replace(/^<\/?(div|p|span|section)[^>]*>/gi, '')
      .replace(/<\/?(div|p|span|section)[^>]*>$/gi, '')
      .trim();

    if (!cleanLine) {
      continue;
    }

    const markDefs: Array<{ _key: string; _type: string; href?: string }> = [];

    // 2. Headings
    if (cleanLine.startsWith('# ')) {
      blocks.push({
        _key: genKey(),
        _type: 'block',
        style: 'h1',
        markDefs,
        children: parseInlineSpans(cleanLine.slice(2).trim(), markDefs),
      });
      continue;
    }
    if (cleanLine.startsWith('## ')) {
      blocks.push({
        _key: genKey(),
        _type: 'block',
        style: 'h2',
        markDefs,
        children: parseInlineSpans(cleanLine.slice(3).trim(), markDefs),
      });
      continue;
    }
    if (cleanLine.startsWith('### ')) {
      blocks.push({
        _key: genKey(),
        _type: 'block',
        style: 'h3',
        markDefs,
        children: parseInlineSpans(cleanLine.slice(4).trim(), markDefs),
      });
      continue;
    }

    // 3. Blockquotes
    if (cleanLine.startsWith('>')) {
      blocks.push({
        _key: genKey(),
        _type: 'block',
        style: 'blockquote',
        markDefs,
        children: parseInlineSpans(cleanLine.replace(/^>\s*/, '').trim(), markDefs),
      });
      continue;
    }

    // 4. Bullet Lists
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      blocks.push({
        _key: genKey(),
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs,
        children: parseInlineSpans(cleanLine.slice(2).trim(), markDefs),
      });
      continue;
    }

    // 5. Standard Paragraph
    blocks.push({
      _key: genKey(),
      _type: 'block',
      style: 'normal',
      markDefs,
      children: parseInlineSpans(cleanLine, markDefs),
    });
  }

  // Handle unclosed code block if file ends
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      _key: genKey(),
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: genKey(),
          _type: 'span',
          text: codeBuffer.join('\n'),
          marks: ['code'],
        },
      ],
    });
  }

  return blocks;
}

