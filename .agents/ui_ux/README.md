# UI & UX Index Routing

> **Overview:** Central navigation index for the Agentic Dev when implementing frontend interfaces, layout structures, media players, design tokens, and user experience flows.  
> **When to Use:** Inspect this routing table to identify the exact styling or UX specification required before building or modifying any view or component.

---

## 1. Navigation Matrix

| Target File | Scope & Implementation Domain |
| :--- | :--- |
| `DESIGN_TOKENS.md` | Neutral zinc color tokens, dark/light mode pairing, typography matrix, borderless anti-card philosophy, high-density home page specs, and consistent margin alignments. |
| `INFORMATION_NAVIGATION_FLOW.md` | Compound URLs, query-param state preservation against hard reloads, sticky desktop Scrollspy Table of Contents, breadcrumbs, and distinct curated vs. autonomous feeds. |
| `INTERACTION_STATE.md` | Universal modal standards (darkened backdrop, body scroll lock, ESC/click-outside dismissal), zero dead clicks, copy-to-clipboard feedback, and content-matched skeletons. |
| `MEDIA_PRESENTATION.md` | Native Sanity assets, responsive YouTube/Vimeo embed wrappers, syntax-highlighted code blocks, Mermaid.js SVG styling, and the responsive image lightbox modal. |
| `PAGINATION_AND_PERFORMANCE.md` | Smooth infinite scrolling on continuous devlog feeds, discrete page-based pagination for project catalogs, keyboard navigation, focus traps, and reduced-motion compliance. |

---

## 2. Context Loading Guidelines for Agentic Dev
- **Token & Spacing Layouts:** Load `DESIGN_TOKENS.md` when defining base layouts, Tailwind styles, or the home page overview.
- **Routing & Navigation:** Load `INFORMATION_NAVIGATION_FLOW.md` when designing page hierarchies, URL search params, or the desktop TOC.
- **Modals & Interactive Elements:** Load `INTERACTION_STATE.md` when creating buttons, dialogs, drawers, or skeleton loaders.
- **Media, Code & Diagrams:** Load `MEDIA_PRESENTATION.md` when handling code blocks, Mermaid charts, videos, or lightbox galleries.
- **Feeds & Accessibility:** Load `PAGINATION_AND_PERFORMANCE.md` when writing infinite-scroll observers, pagination bars, or accessibility keyboard hooks.