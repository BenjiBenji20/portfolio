# Page Specifications & View Hierarchy

> **Overview:** Defines the structural hierarchy, section layouts, dynamic tab states, and navigation routes across Home, Projects, and Project Blog views for the Agentic Dev.  
> **When to Use:** Reference when implementing route layouts in `/app`, structuring section components, coordinating sub-tab navigation, or organizing page-level data fetching.

---

## 1. Home Page (`/`)
High-density single-glance developer profile designed to communicate core capabilities and background immediately.

- **Hero Section:**
  - Developer identity: Profile photo, legal name, professional title, and concise high-impact value proposition.
  - Current availability badge / status pill (e.g., active, open to select engineering opportunities).
  - Quick outbound action triggers: Direct contact link, GitHub profile (`↗`), and primary portfolio CTA.
- **About Section:**
  - Background synopsis focusing on backend engineering, system re-architecture, and autonomous AI systems.
  - Compact experience timeline: Chronological list of roles and core impact (dates, company, key contributions) presented as clean inline rows.
  - Core tech stack overview: Grouped by category (Backend, Frontend, Cloud/Data) using clean, non-card inline tags.

---

## 2. Projects Page (`/projects`)
Comprehensive index of tracked repositories, active systems, and featured architectures.

- **Projects Header & Quick Filter:**
  - High-level overview of engineering repositories.
  - Interactive stack filter pills (e.g., "All", "FastAPI", "Next.js", "AI Pipelines") syncing to URL query params (`?stack=...`).
- **Projects Section:**
  - Chronological or impact-ranked project entries presented in borderless list or table-row layouts.
  - Each item displays: Project name, concise description, primary tech tags, live status indicator, and direct GitHub link.
  - **Click Behavior:** Clicking any project row or title navigates directly to its dedicated blog workspace (`/projects/[slug]`).

---

## 3. Blog & Project Knowledge Base (`/projects/[slug]`)
Dynamic workspace serving both as developer portfolio context and as deep-dive project documentation.

- **Global Blog Layout (Sidebar + Main Workspace):**
  - **Desktop Sidebar (`lg:block`):**
    - Developer Profile snippet & persistent project switcher (quick-jump list to other tracked projects).
    - Status pill indicating last agent-tracked commit hash and sync date.
  - **Main Content Area:** Host for the dynamic multi-level tab system.

### Tab Hierarchy & Sub-Views:
- **`Overview` Tab (`?tab=overview`):**
  - High-level project blueprint, problem statement, key engineering constraints, and live preview/demo links.
- **`Topics` Sub-Tabs (`?tab=topics&topic=[topic-slug]`):**
  - Specific architectural chapters and milestones (e.g., System Architecture, Deployment & CI/CD, Performance Optimization).
  - Sticky desktop Table of Contents (Scrollspy) tracking long-form reading progress.
- **`DevLogs` Sub-Tab (`?tab=devlogs`):**
  - Autonomous chronological stream of commit diffs, feature merges, and agent-generated milestone logs.
  - Infinite-scroll enabled with direct commit SHA links back to GitHub.
- **`Technologies` Tab (`?tab=tech`):**
  - Detailed stack breakdown with rationale for each tool, library version, and infrastructure choice.
- **`Media & Gallery` Tab (`?tab=media`):**
  - Visual gallery containing screenshots, GIFs, and video embeds (YouTube / Vimeo) with click-to-lightbox support.
  - Dedicated architecture sub-section rendering Mermaid.js flowcharts and system diagrams.

---

## 4. Global Persistent Elements and Section
- **Global Portfolio Chat Trigger:**
  - Minimalist floating chat widget docked in the bottom corner of all pages.
  - Opens a non-intrusive drawer or popover allowing visitors to query project details via RAG/GROQ grounding.
- **Route State Resilience:**
  - Every tab and sub-tab selection must update the browser query string (`?tab=...&topic=...`) so hard reloads restore the active view without defaulting back to the root overview.
- **Contact Section:**
  - Direct communication channels (email trigger with 1-click copy, verified socials, LinkedIn).
  - Clean, borderless footer with timezone indicator and copyright.