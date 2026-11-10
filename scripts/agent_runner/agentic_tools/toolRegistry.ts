import type { SanityClient } from 'next-sanity';
import {
  projectHistoryDigestTool,
  articleBySlugTool,
  sanityProjectsTool,
} from './sanityGroqTool';
import { readRepositoryFileTool } from './repositoryTool';

/**
 * Standardized Agentic Tool Calling Registry
 * 
 * Central registry and dispatch engine for all autonomous tools defined in
 * `.agents/skills/AGENTIC_TOOL_CALLING.md`. Provides a unified interface
 * matching OpenAI / Google Gemini function calling specifications.
 */

export type ToolScope = 'triage' | 'synthesis' | 'all';

export interface ToolContext {
  targetRepo?: string;
  commitSha?: string;
  projectSlug?: string;
  sanityClient?: SanityClient;
  repoRoot?: string;
}

export interface AgenticToolDeclaration<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  scopes?: ToolScope[];
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
  // Sanity Content Lake Tools
  fetch_project_history_digest: projectHistoryDigestTool,
  fetch_article_by_slug: articleBySlugTool,
  fetch_sanity_projects: sanityProjectsTool,

  // Repository Inspection Tools
  read_repository_file: readRepositoryFileTool,
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
  args: Record<string, unknown> = {},
  context: ToolContext = {}
): Promise<TResult> {
  const tool = getAgenticTool(name);
  if (!tool) {
    throw new Error(`[ToolRegistry] Tool "${name}" is not registered in AGENTIC_TOOL_REGISTRY.`);
  }

  try {
    return (await tool.execute(args, context)) as TResult;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[ToolRegistry] Tool "${name}" threw execution error: ${errorMsg}`);
    // Return structured error object so LLM can adapt instead of crashing the runner
    return {
      status: 'error',
      tool: name,
      message: errorMsg,
    } as unknown as TResult;
  }
}

/**
 * Generates an OpenAPI / Gemini SDK-compatible function declarations array.
 * Filtered by execution scope (e.g. 'triage' vs 'synthesis').
 */
export function getGeminiFunctionDeclarations(scope?: ToolScope): Array<{
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description?: string; enum?: readonly string[] }>;
    required: string[];
  };
}> {
  const filteredTools = Object.values(AGENTIC_TOOL_REGISTRY).filter((tool) => {
    if (!scope || scope === 'all') return true;
    if (!tool.scopes || tool.scopes.includes('all')) return true;
    return tool.scopes.includes(scope);
  });

  return filteredTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, val]) => [
          key,
          {
            type: val.type.toUpperCase(),
            description: val.description,
            ...(val.enum ? { enum: val.enum } : {}),
          },
        ])
      ),
      required: tool.parameters.required,
    },
  }));
}

/**
 * Generates an explicit, programmatic prompt manifest detailing available tools,
 * their descriptions, and parameter contracts for dynamic prompt injection.
 */
export function getAgenticToolManifestPrompt(scope?: ToolScope): string {
  const filteredTools = Object.values(AGENTIC_TOOL_REGISTRY).filter((tool) => {
    if (!scope || scope === 'all') return true;
    if (!tool.scopes || tool.scopes.includes('all')) return true;
    return tool.scopes.includes(scope);
  });

  const toolEntries = filteredTools.map((tool) => {
    const paramsList = Object.entries(tool.parameters.properties)
      .map(
        ([paramKey, paramVal]) =>
          `  * \`${paramKey}\` (${paramVal.type}${tool.parameters.required.includes(paramKey) ? ', required' : ', optional'}): ${paramVal.description || 'No description provided'}`
      )
      .join('\n');

    return `### Tool: \`${tool.name}\`\nDescription: ${tool.description}\nParameters:\n${paramsList || '  * (No parameters required)'}`;
  });

  return `AVAILABLE AGENTIC TOOLS & CONTRACTS:\n\n${toolEntries.join('\n\n')}`;
}
