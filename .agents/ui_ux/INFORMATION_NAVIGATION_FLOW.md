# Information Architecture & Navigation Flow Specification

> **Overview:** Specifies URL routing hierarchies, deep linking, filter persistence, breadcrumb patterns, sticky desktop Table of Contents (Scrollspy), and the navigational distinction between curated projects and autonomous devlogs for the Agentic Dev.  
> **When to Use:** Reference when setting up `/app` routes, query parameter handlers, tabs, filter bars, breadcrumb components, project post layouts, or pagination links.

---

## 1. Route Hierarchy & Compound URL Strategy
- **Hard Reload Resilience:** Never maintain critical view states, modal overlays, or tab selections solely in client React state. Every view must map to a deterministic, shareable URL so a browser hard reload (`Ctrl+R` / `Cmd+R`) restores the exact active state.
- **Canonical Route Structure:**
  - `/`: High-density overview (identity, quick stack, featured project entries, latest live logs feed).
  - `/projects`: Complete index of tracked repositories and systems.
  - `/projects/[slug]`: Core project profile, high-level architecture, tech stack, and dedicated log feed.
  - `/projects/[slug]/logs/[logSlug]`: Deep-linked individual devlog / milestone entry.
  - `/logs`: Global chronological feed of autonomous agent-generated updates across all repositories.

## 2. Compounding URLs for Filters, Tabs & Modals
- **Nuanced State via Search Params:** Encode view modes, active tabs, and filtering criteria directly into query parameters:
  - Tab State: `/projects/[slug]?tab=architecture` vs. `/projects/[slug]?tab=logs`
  - Tech Stack Filters: `/projects?stack=FastAPI` or `/logs?stack=Next.js&category=milestone`
- **Lightbox & Modal Deep Links:**
  - Route media previews through parallel routes or intercepting routes with shallow URL pushes (e.g., `/projects/[slug]?assetId=xyz` or `/projects/[slug]/gallery/[assetId]`).
  - When the user refreshes with a query parameter present, the page must mount directly with that specific tab or media viewer open.
- **Router Method Rule:** Use `router.push(..., { scroll: false })` or `usePathname` + `useSearchParams` synchronization for filter state mutations to preserve scroll position without dumping the user back to the top of the route.

## 3. Desktop Floating Table of Contents (Scrollspy)
- **Viewport Visibility:** Mount the Table of Contents strictly on desktop viewports (`hidden xl:block` or `hidden lg:block`). Completely omit from mobile and tablet screens to protect reading width.
- **Sticky Side Placement:** Position alongside long-form content (e.g., `/projects/[slug]` case studies and deep-dive devlogs) in an aside column using `sticky top-24` with zero layout jitter.
- **Active Section Scrollspy:**
  - Dynamically observe heading intersections (`h2`, `h3`) using an `IntersectionObserver`.
  - Highlight the currently active section in the TOC list with subtle accent styling (e.g., text color shift to `zinc-100` or a fine accent pip).
- **Smooth Anchor Navigation:** Clicking any TOC link must smoothly scroll the target heading into view while updating the browser hash (`#section-id`) without triggering full-page rerenders.

## 4. Autonomous Feed vs. Curated Highlights
- **Distinct Visual Boundaries:**
  - **Curated Projects:** High-context case studies with architectural overviews, live previews, and design decisions.
  - **Autonomous DevLogs:** Live, chronological, agent-generated entries detailing individual commit diffs, feature merges, and technical refactors.
- **Source Labeling:** Clearly tag automated entries with an agentic badge (e.g., `Auto-Generated Log`, `Commit Milestone`) to distinguish algorithmic updates from hand-crafted case studies.
- **Bi-Directional Bridging:**
  - Every autonomous devlog entry must prominently link back to its parent project (`<- Back to [Project Name]`).
  - Every project page must include an embedded stream of its own autonomous devlogs.

## 5. Breadcrumb Navigation & Wayfinding
- **Deterministic Trail:** Render a subtle, borderless breadcrumb on all nested pages:
  - `Projects / [Project Name] / Logs / [Log Title]`
- **Active Root Links:** All intermediate breadcrumb segments must be interactive, valid links pointing to their respective canonical URLs.
- **Zero Dead Ends:** If a filter returns zero matching devlogs or projects, display a minimal empty-state with a one-click "Reset Filters" action returning to the unparameterized base route.