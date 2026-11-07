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

export const SANITY_WORKLOG_SCHEMA_CONTEXT_PROMPT = `
WORKLOG - SANITY SCHEMA FIELD CONTRACTS & VALUE BOUNDARIES:

WORKLOG SCHEMA (Document Type: "workLog"):
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
`;

export const SANITY_PROJECT_SCHEMA_CONTEXT_PROMPT = `
PROJECTS - SANITY SCHEMA FIELD CONTRACTS & VALUE BOUNDARIES:

PROJECT SCHEMA (Document Type: "project"):
- title (string, required): Project Title
- slug (slug, required): URL identifier
- projectType (string): Domain classification (e.g. "Automation", "Edge AI", "RAG", "Engineering")
- shortDescription (text, required, MAX 280 chars): Concise summary displayed on project and home cards
- dateStarted (date, format: YYYY-MM-DD): The project inception or development start date
- status (string, required): MUST BE EXACTLY ONE OF: [${VALID_PROJECT_STATUSES.map((s) => `"${s}"`).join(', ')}]
- author (string, required): "Agentic Writer"
- hidden (boolean, default: true): Approval Gate. When true, hides project from public portfolio until reviewed.
- priorityValue (number, default: 0): Weight for display ordering
- repository (url): Source GitHub repository URL
- website (url): Live deployed site URL
- content (array of Portable Text blocks): Full comprehensive technical narrative with NO character limit. Supports rich typography, architecture breakdowns, diagrams, and media.
`;

export const SANITY_ARTICLE_SCHEMA_CONTEXT_PROMPT = `
ARTICLES - SANITY SCHEMA FIELD CONTRACTS & VALUE BOUNDARIES:

ARTICLE SCHEMA (Document Type: "article"):
- title (string, required): Article Title (e.g. "Inside Benjineer: Designing an Autonomous Multi-Agent DevLog Engine")
- slug (slug, required, maxLength: 96): Unique URL identifier for this article route (kebab-case)
- project (reference to "project", required): The parent project this article belongs to (search and select existing project)
- excerpt (text, required, MAX 300 chars): Teaser summary displayed in the 2x2 article grid
- coverImage (image with hotspot and alt text string): Article cover image
- publishedAt (datetime, required, ISO 8601 string): Published Date (e.g. 2026-11-07T12:00:00.000Z)
- readTime (string, e.g. "6 min read"): Estimated Read Time
- priorityValue (number, integer, default: 0): Display weight (higher values display first in the 2x2 grid)
- author (string, required): "Agentic Writer"
- developers (array of string): Names of developer(s) who contributed to, authored, or collaborated on this article or feature
- hidden (boolean, default: true): Approval Gate: If enabled (true), this article will not be visible on the public site. Set to false to approve and publish. (Mandatory for autonomous AI runs)
- content (array of PortableText blocks): Rich article narrative with typography, code, and extensible media blocks:
  * Block styles: Normal ("normal"), Heading 1 ("h1"), Heading 2 ("h2"), Heading 3 ("h3"), Quote ("blockquote")
  * Inline decorators: Bold ("strong"), Emphasis ("em"), Inline Code ("code")
  * Annotations: Link ("link" with href url)
  * Media members: projectMediaImage, projectMediaSanityVideo, projectMediaYoutube, projectMediaVimeo
`;

export const MERMAID_DIAGRAM_FORMAT_PROMPT = `
MERMAID DIAGRAM GRAMMAR CONTRACT:
- Diagram Types: ONLY "flowchart TD", "flowchart LR", or "sequenceDiagram".
- Edge Labels: MUST be clean plain text inside pipes WITHOUT ANY QUOTES: e.g. A -->|Execute Command| B or A -->|Display Report (stdout)| B. NEVER wrap edge labels in quotes or place quotes inside pipes.
- Connectors: Use standard ASCII arrows (--> , -.-> , ==>). NEVER use Unicode arrow glyphs (→ , ⇒).
- Node Labels: Always wrap node text in double quotes inside shape delimiters: ID["Step Name"], DB[("Database")], Client("User Input"). Avoid '::' inside labels.
`;