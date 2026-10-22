# Interactive States, Feedback & Modal Experience Specification

> **Overview:** Specifies guidelines for interaction states, loading behaviors, visual feedback patterns, and universal modal behavior for the Agentic Dev.  
> **When to Use:** Reference when building interactive components, buttons, forms, copy-to-clipboard utilities, loading skeletons, and dialog/modal overlays.

---

## 1. Zero Dead Clicks & Interaction Affordances
- **Mandatory State Coverage:** Every interactive element (buttons, filters, tab triggers, links, icon toggles) must provide distinct, visible styling across four states:
  - **Hover:** Subtle zinc surface lift (`hover:bg-zinc-900` or `hover:text-zinc-200`). Avoid heavy border flashes.
  - **Focus-Visible:** High-contrast, accessibility-compliant ring (`focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none`) for keyboard users.
  - **Active/Pressed:** Subtle scale compression (`active:scale-[0.98]`) or deeper surface shift (`active:bg-zinc-800`).
  - **Disabled:** Dimmed opacity (`opacity-50 pointer-events-none cursor-not-allowed`) with explicit `aria-disabled="true"`.
- **External Link Affordance:** All outbound hyperlinks (GitHub repos, live demos, external articles) must visually display an outbound arrow icon (`↗`) and safely set `rel="noopener noreferrer" target="_blank"`.

## 2. Feedback Patterns & Copy-to-Clipboard
- **Copy Actions:** Code snippet headers, commit SHAs, and contact items must provide an interactive copy button:
  - Transition immediately on click to an active confirmation icon (e.g., checkmark) with subtle accent feedback.
  - Automatically revert to the default clipboard icon after 2000ms.
- **Filter & Tab Transitions:** Keep filter switches snappy (< 150ms). Use lightweight opacity/translate micro-transitions rather than sluggish animations.

## 3. Structural Skeletons over Generic Spinners
- **Zero Full-Page Spinners:** Never block entire views behind a solitary loading spinner.
- **Content-Matched Placeholders:** Skeletons must mirror the exact dimensions, padding, and layout of the incoming data:
  - Timeline rows: Monospace date pill skeleton + heading skeleton + tag pills.
  - Diff viewers: Alternating-width line blocks with `bg-zinc-900/60 animate-pulse`.
  - Project entries: Structured block matching the final horizontal card or row layout.
- **Prevent Cumulative Layout Shift (CLS):** Set explicit aspect ratios or minimum heights on dynamic containers so the layout does not jump when live data loads.

## 4. Universal Modal & Pop-up Dialog Rules
Every dialog, lightbox viewer, image modal, or sheet drawer must adhere strictly to the following behavior:
- **Darkened Backdrop:** Mount a backdrop overlay covering 100% of the viewport with a darkened wash (`bg-zinc-950/80` or `backdrop-blur-sm`).
- **Body Scroll Lock:** Freeze page scrolling on mount by applying `overflow: hidden` to `document.body` (compensating for layout shift if scrollbars disappear). Restore scrolling immediately upon unmounting.
- **Escape Key Dismissal:** Listen to `keydown` events globally; pressing `Escape` must immediately close the active top-level modal.
- **Click-Outside Dismissal:** Clicking anywhere on the darkened backdrop outside the bounds of the modal content container must trigger the close handler.
- **Focus Trap & Restoration:** Trap keyboard focus within the modal container while open, and return focus to the triggering element upon exit.