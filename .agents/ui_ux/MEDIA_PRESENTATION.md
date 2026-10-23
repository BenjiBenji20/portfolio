# Media, Asset Presentation & Code Display Standards

> **Overview:** Instructs the Agentic Dev on rendering media assets, external video embeds, code blocks, Mermaid diagrams, and the interactive lightbox modal with responsive metadata layouts.  
> **When to Use:** Reference when implementing image galleries, code renderers, video components, or the portfolio lightbox viewer.

---

## 1. Asset Source Types & Video Embeds
- **Native Sanity Assets:**
  - Support high-performance rendering for images, native HTML5 videos (`.mp4`, `.webm`), and `.gif` animations uploaded directly to Sanity's CDN.
  - Apply responsive `next/image` or optimized video players with skeleton loading states to prevent cumulative layout shift (CLS).
- **External Video Embeds (YouTube & Vimeo):**
  - Detect YouTube (`youtube.com`, `youtu.be`) and Vimeo URLs from post metadata or PR descriptions.
  - Dynamically generate lightweight, responsive embed wrappers (`aspect-video`) using lazy-loaded facades/iframes to maintain fast initial page loads.

---

## 2. Code Blocks & Architectural Diagrams
- **Syntax-Highlighted Code:**
  - Render code with a `zinc-900` surface, subtle borderless styling, line numbers, explicit language pill, and a one-click copy button with active feedback.
  - Preserve formatting using horizontal scroll (`overflow-x-auto`); never force line-wrapping that breaks code syntax.
- **Mermaid.js Flowcharts & Architecture:**
  - Render inside an isolated SVG wrapper styled to match the dark zinc palette (`zinc-800` nodes, high-contrast text).
  - Include an "Expand Diagram" trigger or pan/zoom support for complex schemas on compact viewports.

---

## 3. Interactive Lightbox & Gallery Navigation
- **Click-to-Expand Trigger:** Clicking any screenshot or project image opens an immersive fullscreen modal overlay (`bg-zinc-950/90` backdrop).
- **Interactive Zoom & Pan:** Provide smooth zoom controls (pinch-to-zoom on touch, scroll wheel, and zoom in/out toggle buttons).
- **Bottom Thumbnail Filmstrip:**
  - Render a clean horizontal strip of thumbnail previews at the bottom of the modal.
  - Allow visitors to jump between adjacent images, highlighting the active image with an accent border.
  - **Right-Side Details Panel:** Display a fixed, independently scrollable sidebar on the right containing the active image's title, category, and detailed project description, updating dynamically as visitors navigate between gallery images.

---

## 4. Responsive Image Metadata & Description Layout
- **Desktop Breakpoint (`lg:` $\ge$ 1024px):**
  - Render a split-view modal: the zoomable image occupies the main viewport area (70–75% width).
  - Dock a dedicated details card on the right-hand side (25–30% width) containing title, caption, commit context, and technical descriptions.
- **Mobile & Tablet Breakpoints (`< lg:` / Mobile & iPad):**
  - Image takes full viewport width with the thumbnail filmstrip tucked directly beneath it.
  - Position image description and metadata directly below the media using a truncated teaser pattern: `"[excerpt text]... Read more"`.
  - Expanding "Read more" reveals full text in-place or via a sliding bottom sheet without obscuring the image.