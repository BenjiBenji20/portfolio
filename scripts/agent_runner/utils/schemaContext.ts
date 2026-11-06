/**
 * Sanity Schema Definition & Context Contracts
 * 
 * Single source of schema understanding for the Agentic Writer.
 * Distilled from src/sanity/schemas/project.ts and src/sanity/schemas/workLog.ts.
 * Eliminates redundant field dictionaries while keeping token context lightweight (< 250 tokens).
 */

export const VALID_BADGES = [
  'Production Release',
  'Architecture',
  'Optimization',
  'Security',
  'Feature',
  'Refactor',
] as const;

export type ValidBadge = (typeof VALID_BADGES)[number];

export const VALID_PROJECT_STATUSES = [
  'development',
  'production',
  'completed',
  'archived',
] as const;

export type ValidProjectStatus = (typeof VALID_PROJECT_STATUSES)[number];

export const VALID_PLATFORMS = [
  'GitHub',
  'Live Demo',
  'Documentation',
  'Figma',
  'Pull Request',
] as const;

export type ValidPlatform = (typeof VALID_PLATFORMS)[number];

/**
 * Concise Schema Definitions for AI Prompt Grounding
 */
export const SANITY_SCHEMA_CONTEXT_PROMPT = `
SANITY SCHEMA FIELD CONTRACTS & VALUE BOUNDARIES:

1. WORKLOG SCHEMA (Document Type: "workLog"):
- title (string, required): Log Title / Milestone (concise outcome, e.g. "PPR Layout Boundaries")
- badge (string, required): MUST BE EXACTLY ONE OF: [${VALID_BADGES.map((b) => `"${b}"`).join(', ')}]
- description (text, required): 2-3 sentence overview highlighting practical value, problem solved, and technical approach
- date (date, required): Current date (YYYY-MM-DD)
- author (string, required): "Agentic Writer"
- developers (array of string): Contributing developer usernames (e.g. [sender, "Agentic Writer"])
- affectedSubsystems (array of string): Subsystems touched (e.g. ["Ingestion Pipeline", "Redis Cache"])
- backlinks (array of objects): External references. Field "platform" MUST BE ONE OF: [${VALID_PLATFORMS.map((p) => `"${p}"`).join(', ')}]. Field "url" must be valid URL.
- content (array of Portable Text blocks): Rich engineering narrative supporting:
  * Typography: Normal paragraphs, headings (h2, h3), quotes, and bulleted lists
  * Mermaid Diagrams: Interactive architecture flowcharts and sequence diagrams
  * Media Images: Embedded screenshots and diagram captures (projectMediaImage)
  * Video Embeds: Native Sanity videos, YouTube, and Vimeo blocks (projectMediaYoutube, projectMediaVimeo)

2. PROJECT SCHEMA (Document Type: "project"):
- title (string, required): Project Title
- slug (slug, required): URL identifier
- projectType (string): Domain classification (e.g. "Automation", "Edge AI", "RAG", "Engineering")
- shortDescription (text, required, MAX 280 chars): Concise summary displayed on project and home cards
- status (string, required): MUST BE EXACTLY ONE OF: [${VALID_PROJECT_STATUSES.map((s) => `"${s}"`).join(', ')}]
- author (string, required): "Agentic Writer"
- hidden (boolean, default: true): Approval Gate. When true, hides project from public portfolio until reviewed.
- priorityValue (number, default: 0): Weight for display ordering
- repository (url): Source GitHub repository URL
- website (url): Live deployed site URL
- content (array of Portable Text blocks): Deep technical narrative, architecture breakdown, media gallery, diagrams, and video embeds
`;

