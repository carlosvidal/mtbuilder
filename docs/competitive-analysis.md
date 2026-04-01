# MT Builder — Competitive Analysis

## Overview

MT Builder is a zero-dependency, Web Component-based page builder. This document compares it against the leading page builder tools and assesses production readiness.

## Competitive Landscape

### Feature Comparison

| Feature | **MT Builder** | **Elementor** | **Bee Free** | **Divi** |
|---|---|---|---|---|
| **Architecture** | Web Components (vanilla JS) | WordPress plugin (PHP + JS) | React SaaS | WordPress plugin (PHP + JS) |
| **Dependencies** | Zero | WordPress required | React + backend | WordPress required |
| **Bundle size** | ~35KB gzipped | ~3MB+ | SaaS (N/A) | ~5MB+ |
| **Element types** | 12 | 100+ widgets | 30+ blocks | 46+ modules |
| **Drag & Drop** | Rows + elements | Sections/columns/widgets | Rows/columns/modules | Sections/rows/modules |
| **Templates** | None | 300+ (Pro) | 1,500+ | 2,000+ layouts |
| **Responsive breakpoints** | 1 (768px) | 3+ custom | Mobile preview | 3+ custom |
| **Undo/Redo** | 50 states | Unlimited + revisions | Yes | Unlimited + revisions |
| **Media handling** | URL only | Upload + library + editor | Upload + Unsplash | Upload + library |
| **Form elements** | No | Yes (Pro) | No (email focus) | Yes |
| **Animations** | No | Motion effects | No | Yes |
| **Collaboration** | No | No | Yes (co-editing) | No |
| **Output format** | Standalone HTML/JSON | WordPress-bound markup | HTML email / HTML | WordPress-bound markup |
| **i18n** | 3 languages (en, es, fr) | 50+ languages | 10+ languages | 30+ languages |
| **XSS protection** | Built-in sanitizer | WordPress nonces | Server-side | WordPress nonces |
| **License** | MIT (free) | $59-399/year | $0-600/year | $89/year |
| **Deployment** | Any web stack | WordPress only | SaaS hosted | WordPress only |

### Detailed Competitor Profiles

#### Elementor
- **Strengths:** Massive widget library, third-party ecosystem (100+ addon packs), theme builder, popup builder, WooCommerce integration, global styles.
- **Weaknesses:** WordPress-only, heavy (adds 3MB+ to page), generates complex non-portable markup, performance issues on large pages.
- **Market:** WordPress site builders, agencies, freelancers.

#### Bee Free
- **Strengths:** Email-first design, real-time collaboration, 1,500+ templates, Unsplash integration, content locking for brand consistency.
- **Weaknesses:** Primarily email-focused, SaaS-only (no self-hosted option), expensive at scale, limited page building capabilities.
- **Market:** Marketing teams, email designers, enterprise brand teams.

#### Divi
- **Strengths:** Full theme builder, 2,000+ layouts, split testing (A/B), bulk editing, global elements, extensive design options per module.
- **Weaknesses:** WordPress-only, shortcode-based output (not clean HTML), heavy frontend CSS/JS, slower page load times.
- **Market:** WordPress agencies, designers, small businesses.

## MT Builder's Competitive Position

### Key Differentiators

1. **Zero dependencies** — No framework, CMS, or runtime required. Pure Web Components.
2. **Truly portable** — Works in any HTML page. Embed with a single `<page-builder>` tag.
3. **Clean output** — Generates standalone HTML, not framework-locked markup.
4. **Lightweight** — Orders of magnitude smaller than any competitor (~35KB vs 3-5MB).
5. **Shadow DOM isolation** — No CSS conflicts with host application.
6. **Embeddable in any SaaS** — Can be integrated into any platform (PHP, Rails, Django, Node, Vue, React).
7. **MIT licensed** — Free for commercial use, no vendor lock-in.

### Unique Market Niche

None of the three competitors offer a **framework-agnostic, embeddable page builder as a Web Component**. This is MT Builder's primary strategic advantage:

- Elementor and Divi are locked to WordPress.
- Bee Free is a SaaS product that cannot be self-hosted.
- MT Builder can be embedded into **any** web application with a single HTML tag.

**Target market:** SaaS platforms, custom web apps, and headless CMS solutions that need an embeddable page builder without WordPress or framework dependencies.

### Comparable Open-Source Alternatives

| Project | Approach | Limitation vs MT Builder |
|---|---|---|
| GrapesJS | Canvas-based, framework-agnostic | Heavier (~200KB), jQuery-like API, not Web Components |
| Editor.js | Block editor (like Notion) | Not a visual page builder, no grid layout |
| Craft.js | React-based | Requires React runtime |
| BlockSuite | Framework-agnostic blocks | Complex, early stage, heavier |

**GrapesJS** is the closest competitor in the embeddable builder space. MT Builder differentiates through Web Components, zero dependencies, and smaller bundle size.

## Production Readiness Assessment

### Ready Now

- Core drag-and-drop functionality
- 12 element types covering common use cases
- Row/column grid system with responsive support
- Undo/redo with 50-state history
- HTML/JSON export (clean, standalone output)
- XSS sanitization
- i18n (3 languages)
- Event-driven API for external integration
- localStorage and API persistence modes
- Shadow DOM style isolation

### Critical Gaps (Blocks Adoption)

| Gap | Impact | Effort |
|---|---|---|
| **No templates** | Users expect starting points, not blank canvas | Medium |
| **No image upload** | URL-only input is unusable for non-technical users | Medium |
| **No responsive preview** | Can't preview mobile/tablet in the editor | Low-Medium |
| **No form elements** | Contact forms are a basic expectation | Medium |

### Important Gaps (Limits Retention)

| Gap | Impact | Effort |
|---|---|---|
| Single breakpoint (768px only) | Tablet layouts look broken | Low |
| No global styles / design tokens | Repetitive styling, no brand consistency | Medium |
| No basic animations | Pages feel static compared to competitors | Medium |
| No keyboard shortcuts docs | Power users can't work efficiently | Low |
| Limited element library | Missing icons, accordion, tabs, maps | Medium-High |

### Nice to Have

| Feature | Notes |
|---|---|
| Dark mode editor | Developer preference |
| Copy/paste between pages | Power user workflow |
| More languages | Portuguese, German, Italian |
| Plugin/extension system | Third-party element types |
| AI content generation | Text/image generation within editor |

## Verdict by Use Case

| Use Case | Ready? | Notes |
|---|---|---|
| **Internal builder for MiTienda** (store landing pages) | Yes, with caveats | Add image upload via Cloudflare R2 |
| **Embeddable builder for SaaS platforms** | Almost | Templates + media upload are must-haves |
| **Standalone product competing with Elementor/Divi** | No | Feature gap too large, different market |
| **Open-source library for developers** | Yes | Strong niche as zero-dep Web Component builder |

## Strategic Recommendation

Focus on the **embeddable SaaS builder** niche. No competitor serves this market well:

1. Ship templates + image upload to remove critical blockers.
2. Position as "the page builder Web Component for SaaS platforms."
3. Grow the open-source community around the MIT-licensed library.
4. Monetize through premium templates, support, or hosted media storage.
