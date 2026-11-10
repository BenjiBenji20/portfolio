import * as fs from 'fs';
import * as path from 'path';
import type { AgenticToolDeclaration, ToolContext } from './toolRegistry';

export interface ReadRepositoryFileArgs {
  filePath: string;
  startLine?: number;
  maxLines?: number;
}

export interface ReadRepositoryFileResult {
  filePath: string;
  startLine: number;
  linesRead: number;
  totalLines: number;
  content: string;
  truncated: boolean;
}

const FORBIDDEN_FILE_PATTERNS = [
  /^\.env/i,
  /\.env(\..+)?$/i,
  /\.git([\\/].*)?$/i,
  /node_modules([\\/].*)?$/i,
  /\.(pem|key|pfx|pkcs12)$/i,
  /id_rsa/i,
  /\.secret/i,
];

const MAX_ALLOWED_LINES = 200;
const MAX_ALLOWED_CHARS = 8000;

/**
 * Standardized Tool: Repository Full-File & Architecture Reader
 * 
 * Safely inspects source files within the active repository, enforcing strict path
 * traversal prevention, credential blacklist filters, and line/token ceilings.
 */
export async function readRepositoryFile(
  filePath: string,
  startLine = 1,
  maxLines = 100,
  repoRoot: string = process.cwd()
): Promise<ReadRepositoryFileResult> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('[RepositoryTool] Invalid parameter: filePath must be a non-empty string.');
  }

  // Normalize path and verify it stays inside repository root
  const resolvedPath = path.resolve(repoRoot, filePath);
  const normalizedRoot = path.resolve(repoRoot);

  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`[RepositoryTool] Security Exception: Path traversal attempt blocked ("${filePath}").`);
  }

  const relativePath = path.relative(normalizedRoot, resolvedPath);

  // Check forbidden sensitive file patterns
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(relativePath) || pattern.test(path.basename(resolvedPath))) {
      throw new Error(`[RepositoryTool] Security Exception: Access to sensitive file pattern blocked ("${relativePath}").`);
    }
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`[RepositoryTool] File not found: "${relativePath}".`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`[RepositoryTool] Target is not a file: "${relativePath}".`);
  }

  const rawContent = fs.readFileSync(resolvedPath, 'utf8');
  const allLines = rawContent.split(/\r?\n/);
  const totalLines = allLines.length;

  const validStart = Math.max(1, startLine);
  const boundedMaxLines = Math.min(Math.max(1, maxLines), MAX_ALLOWED_LINES);
  const startIndex = validStart - 1;
  const endIndex = Math.min(startIndex + boundedMaxLines, totalLines);

  const selectedLines = allLines.slice(startIndex, endIndex);
  let content = selectedLines.join('\n');
  let truncated = false;

  if (content.length > MAX_ALLOWED_CHARS) {
    content = content.slice(0, MAX_ALLOWED_CHARS) + '\n... [TRUNCATED: Character ceiling reached]';
    truncated = true;
  } else if (endIndex < totalLines) {
    truncated = true;
  }

  return {
    filePath: relativePath.replace(/\\/g, '/'),
    startLine: validStart,
    linesRead: selectedLines.length,
    totalLines,
    content,
    truncated,
  };
}

/**
 * Standardized Agentic Tool Declaration: Repository File Reader
 */
export const readRepositoryFileTool: AgenticToolDeclaration<ReadRepositoryFileArgs, ReadRepositoryFileResult> = {
  name: 'read_repository_file',
  description:
    'Reads up to 200 lines of a source file within the active repository to inspect complete interfaces, schemas, or system architecture. Path traversal and sensitive credential files are strictly blocked.',
  scopes: ['triage', 'synthesis'],
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Relative path to source file within the repository (e.g. "src/sanity/schemas/project.ts")',
      },
      startLine: {
        type: 'number',
        description: 'Starting line number (1-based index, default: 1)',
      },
      maxLines: {
        type: 'number',
        description: 'Maximum lines to read (default: 100, maximum: 200)',
      },
    },
    required: ['filePath'],
  },
  execute: async (args: ReadRepositoryFileArgs, context: ToolContext) => {
    const repoRoot = context.repoRoot || process.cwd();
    return readRepositoryFile(args.filePath, args.startLine, args.maxLines, repoRoot);
  },
};

