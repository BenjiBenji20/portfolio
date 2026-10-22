# Codebase Layout & Route Encapsulation

**Date Started:** 2026-10-22  
**Status:** Active Architecture  

## 1. Overview
Defines the directory topology, Next.js App Router grouping, and layout boundaries separating public portfolio routes from the embedded Sanity Studio.

## 2. Directory Structure
```text
src/
├── app/
│   ├── (portfolio)/         # Public views wrapped by AppShell
│   │   ├── layout.tsx       # Mounts <AppShell> (HeaderNav + ProfileSidebar)
│   │   ├── page.tsx         # Home overview (/)
│   │   ├── projects/        # Projects catalog (/projects)
│   │   └── blogs/           # Engineering writeups (/blogs)
│   ├── studio/[[...tool]]/  # Embedded Sanity Studio (/studio)
│   ├── api/                 # Serverless route handlers (chat, webhooks)
│   ├── globals.css          # Dark zinc theme tokens & typography
│   └── layout.tsx           # Minimal root HTML/body shell (Geist fonts)
├── components/layout/       # AppShell, HeaderNav, ProfileSidebar
├── sanity/
│   ├── schemas/             # Sanity schemas (profile singleton, etc.)
│   └── lib/                 # Public client, queries, image helpers
└── types/                   # Strict compile-time TypeScript contracts
```

## 3. Layout Encapsulation

```mermaid
graph TD
    Root[src/app/layout.tsx: Minimal HTML + Fonts]
    Root --> Port[src/app/(portfolio)/layout.tsx: AppShell]
    Root --> Studio[src/app/studio/[[...tool]]: Fullscreen Studio]
    Port --> Home[/]
    Port --> Projects[/projects]
    Port --> Blogs[/blogs]
```

- **`(portfolio)` Route Group:** Encapsulates `/`, `/projects`, and `/blogs` inside `<AppShell>`, providing persistent navigation and profile sidebar across all public pages without lateral layout shift.
- **`/studio` Isolation:** Bypasses `<AppShell>` to render `<NextStudio />` as an unconstrained, full-screen editorial workspace.
- **Client Component Boundary:** Studio routes are client-isolated (`Studio.tsx`) to prevent Turbopack server-component module conflicts with internal Studio packages.
