# UI Design Tokens, Layout Patterns & Media Guidelines

> **Overview:** Central styling and layout specification for the Agentic Dev. Dictates the neutral-heavy zinc design tokens, the anti-card / borderless layout philosophy, the high-density home page architecture, responsive viewport constraints, and consistent layout spacing & margin rules.  
> **When to Use:** Always consult when authoring Tailwind classes, configuring CSS tokens, structuring page layouts, or designing media/code display components.

---

## 1. Visual Design Tokens & Palette System
- **Scale Foundation:** Strictly utilize the Tailwind `zinc` scale for backgrounds, surfaces, text, and dividers.
- **Dark Mode Default:**
  - Base Background: `zinc-950`
  - Subtle Surface Elevation: `zinc-900`
  - Accent / Raised Surface: `zinc-850` or `zinc-800`
  - Body Text: `zinc-400` / Primary Heading Text: `zinc-100` / Muted Text: `zinc-500`
- **Light Mode Pairing:**
  - Base Background: `zinc-50`
  - Subtle Surface Elevation: `zinc-100`
  - Body Text: `zinc-700` / Primary Heading Text: `zinc-900` / Muted Text: `zinc-500`
- **Single Accent Color:** Strictly utilize **Sky Blue (`sky-400` / `#38bdf8`)** for interactive indicators, active status text, emphasized keywords, link hovers, and nav underlines. Avoid emerald-green (which conveys generic AI styling). Normal body and heading texts remain clean white and zinc (`zinc-100` / `zinc-300`).
- **Typography Matrix:**
  - Reading / UI: Clean sans-serif (`font-sans`, e.g., Geist Sans, Inter).
  - Technical Data: Monospace (`font-mono`, e.g., Geist Mono, JetBrains Mono) for commit hashes, timestamps, tech tags, and file diffs.

---

## 2. Layout Philosophy & Anti-Card Patterns
- **No Border Fetish:** Strictly avoid wrapping every UI block in heavy, high-contrast borders (`border border-zinc-700`). Prefer whitespace, subtle background shifts (`bg-zinc-900/50`), and subtle divider lines over hard-outlined bounding boxes.
- **Selective Card Rule:** Reserve cards exclusively for high-priority featured milestones or standalone blog post previews that demand isolated visual weight. Never use cards for basic skill tags, contact items, or simple log rows.
- **Alternative List Patterns:**
  - **Chronological Timeline Feeds:** Clean vertical lists connected by minimal gutter spacing or a delicate vertical line.
  - **Tabular Data Rows:** Minimalist horizontal rows featuring date/hash on the left, title and description center, and tag chips on the far right.
  - **Inline Metadata Blocks:** Group related text elements using whitespace and typography weights rather than enclosing them in pill-shaped borders.

---

## 3. Persistent Profile Sidebar & Layout Architecture
Across all primary routes under `(portfolio)`, developer identity is anchored globally via a GitHub-inspired layout rather than disconnected hero banners:
- **Left Profile Sidebar (Desktop & Tablet `>= md`, >= 768px):**
  - Persistent left column occupying ~25–30% layout width (`w-full md:w-64 lg:w-72 shrink-0`).
  - Houses user information:
    - Circular avatar with availability status indicator (`bg-sky-500`).
    - Legal name (`h1`, `text-xl font-bold text-zinc-100`) and headline/role (`zinc-400`).
    - Constrained 1–2 line motto (max 120 characters, italic `zinc-400`).
    - Active availability status pill (`text-sky-400`).
    - `react-icons` metadata list: current company/role, location, education, 1-click copy email, personal website, GitHub, and LinkedIn.
    - Core stack chips (`font-mono text-[11px] bg-zinc-900 border border-zinc-800`).
    - *Exclusions:* No `@username` handle, no dynamic timezone clock, no downloadable resume button.
- **Top Profile As Hero (Mobile `< md`, < 768px):**
  - Stacks linearly at the top of the viewport as a compact hero block before main page content.
- **Main Content Area (~70–75% width):**
  - Renders alongside the sidebar on tablet/desktop, housing route-specific views (Home overview, Projects index, or Case studies).

---

## 4. Responsive Breakpoints & Viewport Rules
- **Breakpoints:** Follow standard Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
- **Mobile-First Layout:**
  - Single-column linear flow on mobile screens (`< 768px`).
  - Minimum touch target area of `44x44px` for all clickable buttons, social icons, and nav links.
  - Tables and horizontal timeline rows must gracefully collapse into stacked vertical items on mobile.
- **Desktop Grid:** Max container width capped at `max-w-4xl` or `max-w-5xl` for centered reading comfort, avoiding excessively stretched line lengths.

---

## 5. Consistent Layout Spacing, Margins & Alignment
- **Global Margin Alignment:** Enforce identical horizontal side padding across all pages, views, and dynamic tabs (`px-4 sm:px-6 md:px-8`).
- **Container Center-Lock:** All content wrappers must share the exact same maximum container width (`max-w-4xl` or `max-w-5xl`) centered via `mx-auto`.
- **Avoid `justify-between` / `space-between`:** Favor explicit, cohesive gaps (`gap-4`, `gap-6`) over wide `justify-between` splits that detach related elements on wider viewports. Reserve edge-to-edge justification strictly for global navigation headers.
- **Center-Biased Alignment:** Avoid centered layouts for hero titles, empty/loading states, media previews, and focal text blocks (`text-center`, `items-center`, `justify-center`) rather than floating content haphazardly to opposing edges. Standardize left alignment only for multi-line body paragraphs and technical code logs to preserve reading flow.
- **Zero Lateral Shift:** Header, navigation bar, content blocks, and footer must strictly align along the same vertical grid lines across routes to eliminate jarring layout jumps during tab switching.
- **Section Spacing Rhythm:** Standardize vertical spacing between logical sections (`py-8 sm:py-12`) across every view for consistent rhythm.
