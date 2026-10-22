# Accessibility, Performance & Feed Pagination Specification

> **Overview:** Specifies guidelines for accessible keyboard navigation, reduced motion, performance budgets, and explicit pagination strategies—distinguishing smooth infinite scrolling on long feed pages from fast page-based pagination everywhere else.  
> **When to Use:** Reference when implementing feed loaders, list virtualization, pagination controls, keyboard focus traps, and accessibility standards.

---

## 1. Pagination Strategies: Infinite Scroll vs. Page-Based Navigation
- **Smooth Infinite Scroll (Long Feeds & Global Logs):**
  - **Scope:** Reserved strictly for high-volume chronological feeds (e.g., `/logs`, the embedded autonomous devlog stream under `/projects/[slug]`).
  - **Implementation:** Use a sentinel element observed via `IntersectionObserver` to trigger the next page batch before reaching the footer.
  - **Smooth Append:** Append incoming items without resetting the user's scroll position or inducing layout jitter.
  - **URL Synchronization:** Optionally sync the cursor or page index to the URL query string (`?cursor=...`) on scroll without pushing full browser history entries.
  - **Terminal Feed State:** When all logs are loaded, display a clean, centered end-of-feed marker (e.g., `"All devlogs loaded"`) and disconnect the observer.
- **Page-Based Navigation (Structured Collections):**
  - **Scope:** Applied everywhere else (e.g., `/projects` catalog, search/filter results, tabular tables).
  - **Deterministic Controls:** Use explicit Previous/Next buttons and numbered pills (`Page 1 of 5`) with `rel="prev"` / `rel="next"`.
  - **Performance Advantage:** Keeps DOM node counts minimal and memory footprints low by completely unmounting previous pages on transition.

---

## 2. Keyboard Navigation & Focus Trapping
- **Skip to Content:** Provide an invisible `<a href="#main-content">Skip to content</a>` link at the root of every page that becomes visible on keyboard focus (`focus:top-4 focus:left-4 focus:z-50`).
- **Logical Tab Order:** Ensure sequential DOM order matches the visual reading flow. Never rely on CSS hacks (`order`) that disrupt tab navigation.
- **Focus Trapping:** Modal overlays, the image lightbox, and the expanded chat drawer must strictly trap keyboard focus inside their container while mounted.
- **Accessible Escape:** Pressing `Escape` must close any open popover, dropdown, lightbox, or drawer and return focus to the triggering element.

---

## 3. Motion & Reduced Motion Hygiene
- **`prefers-reduced-motion` Compliance:**
  - Wrap non-essential CSS transitions, transforms, and pulse animations in `@media (prefers-reduced-motion: reduce)`.
  - Instantly resolve transitions (duration: `0ms`) when reduced motion is requested by the OS.
- **Subtle Micro-Interactions:** Default animations must stay under 200ms. Avoid bouncy springs, large sliding hero elements, or continuous pulsating graphics.

---

## 4. Performance Budgets & DOM Health
- **List Virtualization Threshold:** If an infinite-scroll feed exceeds 100 items in a single session, virtualize the list (e.g., via `@tanstack/react-virtual`) to cap DOM node overhead.
- **Image Priority:** Use `priority` on above-the-fold images (hero profile photo) and lazy-load all below-the-fold devlog screenshots, GIFs, and video facades.
- **Zero CLS on Pagination:** Reserve container min-heights for dynamic lists so data fetching states never cause content jumping.