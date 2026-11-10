import type { SanityClient } from 'next-sanity';
import { projectHistoryDigestTool, articleBySlugTool } from './sanityGroqTool';

/**
 * Standardized Agentic Tool Calling Registry
 * 
 * Central registry and dispatch engine for all autonomous tools defined in
 * `.agents/skills/AGENTIC_TOOL_CALLING.md`. Provides a unified interface
 * matching OpenAI / Google Gemini function calling specifications.
 */

export interface ToolContext {
  targetRepo?: string;
  commitSha?: string;
  projectSlug?: string;
  sanityClient?: SanityClient;
}

export interface AgenticToolDeclaration<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: readonly string[];
      }
    >;
    required: string[];
  };
  execute: (args: TArgs, context: ToolContext) => Promise<TResult>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AGENTIC_TOOL_REGISTRY: Record<string, AgenticToolDeclaration<any, any>> = {
  // Concrete Registered Tools: Sanity Content Lake Queries
  fetch_project_history_digest: projectHistoryDigestTool,
  fetch_article_by_slug: articleBySlugTool,

  // Tool 1: YouTube Channel Video Fetcher & Embedder (Pre-wired stub)
  fetch_youtube_video: {
    name: 'fetch_youtube_video',
    description: 'Searches developer YouTube channel metadata for relevant feature demonstrations or project walkthroughs.',
    parameters: {
      type: 'object',
      properties: {
        searchQuery: { type: 'string', description: 'Keywords describing the feature demonstration' },
      },
      required: ['searchQuery'],
    },
    execute: async (args: { searchQuery?: string }) => {
      console.log(`[Tool 1: YouTube Matcher] Executing search for: ${args?.searchQuery}`);
      return { matchFound: false, videoUrl: null };
    },
  },

  // Tool 4: Repository Full-File & Architecture Reader (Pre-wired stub)
  read_repository_full_file: {
    name: 'read_repository_full_file',
    description: 'Fetches the complete contents of a source file from the tracked repository when the diff is insufficient.',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to source file in repo (e.g. src/auth/session.py)' },
      },
      required: ['filePath'],
    },
    execute: async (args: { filePath?: string }, context: ToolContext) => {
      console.log(`[Tool 4: File Reader] Fetching ${args?.filePath} from ${context.targetRepo}...`);
      return { content: `// File content for ${args?.filePath}` };
    },
  },

  // Tool 5: Historical Commit & Blame Inspector (Pre-wired stub)
  inspect_git_history: {
    name: 'inspect_git_history',
    description: 'Inspects recent git commit logs and file evolution across sequential commits.',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to target source file' },
        limit: { type: 'number', description: 'Number of past commits to inspect' },
      },
      required: ['filePath'],
    },
    execute: async (args: { filePath?: string }) => {
      console.log(`[Tool 5: Git History] Inspecting history for: ${args?.filePath}`);
      return { commits: [] };
    },
  },
};

/**
 * Retrieves a registered tool declaration by name.
 */
export function getAgenticTool(name: string): AgenticToolDeclaration | undefined {
  return AGENTIC_TOOL_REGISTRY[name];
}

/**
 * Standardized tool execution dispatcher.
 * Validates tool registration, injects context, and invokes the tool handler.
 */
export async function executeAgenticTool<TResult = unknown>(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext = {}
): Promise<TResult> {
  const tool = getAgenticTool(name);
  if (!tool) {
    throw new Error(`[ToolRegistry] Tool "${name}" is not registered in AGENTIC_TOOL_REGISTRY.`);
  }

  return (await tool.execute(args, context)) as TResult;
}

