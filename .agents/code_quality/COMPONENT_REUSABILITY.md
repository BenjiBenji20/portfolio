# Component Discovery & Reusability Standards

> **Overview:** Mandates pre-implementation audits to prevent duplicate UI elements, defines rules for identifying recurring patterns, and instructs the Agentic Dev on when and how to extract reusable components.  
> **When to Use:** Reference before scaffolding any new UI feature, touching `/components/`, or designing views in `/app/`.

---

## 1. Mandatory Pre-Implementation Audit (Discovery First)
- **Inventory Check:** Before writing a single line of new TSX/TS, inspect `components/` and existing page routes to verify if the required element or a close variant already exists.
- **Search Key Primitives:** Actively check for pre-existing UI patterns (e.g., buttons, badges, modals, markdown renderers, Mermaid wrappers, chat bubbles, syntax highlighters).
- **Compose Over Recreate:** If an existing component covers 70%+ of the needed behavior, extend it via optional props or wrap it rather than creating a parallel duplicate.

## 2. Extraction & Reusability Triggers (Rule of Two)
- **Recurrence Threshold:** If an identical or near-identical layout, widget, or presentation pattern appears in two or more places, immediately abstract it into a shared component.
- **Location Conventions:**
  - Route-specific components: Colocate inside the route folder (e.g., `app/(portfolio)/_components/`).
  - Globally shared primitives: Place in `components/ui/` (primitives) or `components/shared/` (composite widgets).

## 3. Reusable Component Design Principles
- **Separation of Concerns:** Keep reusable components strictly presentational and state-minimal. Never hardcode data fetching, domain logic, or environment secrets inside them.
- **Composable Interfaces:** 
  - Expose clean props; accept standard HTML/React attributes (`className`, `children`, `style`).
  - Avoid boolean prop explosions (`isBlue`, `hasBorderLarge`, `isDevlogCard`); favor variant systems (e.g., `cva` or Tailwind utility classes) and composition slots.
- **Strict Typing:** Every extracted component must export a dedicated interface for its props (e.g., `CardProps`).

## 4. Refactoring & Regression Safeguards
- **Zero-Breakage Refactoring:** When promoting an inline element to a shared component, immediately update all existing call sites to use the new abstraction.
- **Verification Requirement:** Run `npm run type-check` to verify that prop migrations did not break downstream consumers across the app.