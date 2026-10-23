# Media Sizing & Aspect Ratio Guidelines

**Date Started:** 2026-10-23  
**Status:** Active Specification  

## 1. Overview
Defines canonical media dimensions, aspect ratios, and format requirements across all UI components in the portfolio to guarantee zero layout shifts (CLS), optimal rendering fidelity, and responsive sharpness.

## 2. Component Media Matrix

| Component | Target Role | Aspect Ratio | Canonical Dimensions | Supported Formats |
| :--- | :--- | :--- | :--- | :--- |
| `ProjectMediaCarousel` | Project Card Hero & Slides | `16:10` / `16:9` | **1280 × 800px** (min: 800 × 500px) | WebP, PNG, JPG, MP4, WebM |
| `AmbientImage` | Uncropped Contained Foreground | Free / Auto | Native aspect ratio (centered) | Any imag e format |
| `AmbientImage (Backdrop)` | Ambient Blurred Layer | Container-fill | Stretched & blurred (`scale-110`) | Auto-mirrored from source |
| `ProjectLogo` | Card & Header Brand Icon | `1:1` (Square) | **128 × 128px** (rendered: 28 × 28px) | SVG, Transparent PNG |
| `ProfileAvatar` | Persistent Sidebar Headshot | `1:1` (Square) | **400 × 400px** (rendered: 208 × 208px) | WebP, PNG, JPG |
| `VideoEmbedFacade` | YouTube & Vimeo Posters | `16:9` / `16:10` | **1280 × 720px** | WebP, JPG |
| `TopicDiagram` | System / Mermaid SVGs | Vector / Auto | Max width: **1400px** (height auto) | SVG |

## 3. Rendering Invariants
- **Ambient Blurred Canvas (`AmbientImage`):** Any image uploaded with unconventional aspect ratios (portrait, panoramic, mobile screenshots) must be wrapped in `<AmbientImage />`. This displays the full, uncropped asset via `object-fit: contain` over a darkened, blurred `object-cover` clone, eliminating hard letterboxing.
- **Auto-Play Carousel Timing:** Multi-media carousels automatically advance every **5,000ms (5s)** when not paused by an active video player or modal interaction.
- **Optimization Delivery:** All uploaded raster images should be served via Sanity CDN WebP transforms with width/height bounding parameters to avoid oversized client payloads.
