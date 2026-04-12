# Slice 17a-1: Token Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the complete design system token architecture (type scale, shadows, z-index, transitions, colors, containers, breakpoints) and migrate all arbitrary type values to the semantic scale.

**Architecture:** Tokens are defined in `src/lib/styles/tokens.css` as CSS custom properties. Tailwind v4's `@theme` block in `src/app.css` maps tokens to utility classes. Components consume tokens via Tailwind utilities or `var()` references. No arbitrary values.

**Tech Stack:** Tailwind CSS v4 (@theme), CSS custom properties, `color-mix()` for shadow alpha, `clamp()` for fluid type.

**Design spec:** `docs/specs/2026-04-11-slice-17-standardization-design.md` (Section 4 + 7.1)
**Audit reference:** `docs/reference/AUDIT-SLICE-17.md` (exact file paths for every migration)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/styles/tokens.css` | Add type scale, shadow, z-index, transition, opacity, container, color tokens |
| Modify | `src/app.css` | Map all new tokens to `@theme`, fix radius naming, add utility classes |
| Create | `docs/reference/CSS.md` | Design system reference documentation |
| Modify | 31 `.svelte` files | Replace `text-[Npx]` arbitrary values with semantic type scale |
| Create | `src/lib/styles/__tests__/tokens.test.ts` | Token validation tests |
| Modify | `docs/slices/slice-17-browser-cohesion.md` | Replace with 17a-1 slice spec |

---

## Task 1: Branch Setup + Slice Spec

**Files:**
- Create: `docs/slices/slice-17a-1-token-foundation.md`
- Modify: `docs/slices/slice-17-browser-cohesion.md` (archive or replace)

- [ ] **Step 1: Create branch from main**

```bash
git checkout main && git pull
git checkout -b feature/slice-17a-1-token-foundation
```

- [ ] **Step 2: Write slice spec**

Create `docs/slices/slice-17a-1-token-foundation.md` with scope from design spec Section 7.1. This locks the acceptance criteria for this sub-slice.

- [ ] **Step 3: Commit**

```bash
git add docs/slices/slice-17a-1-token-foundation.md
git commit -m "docs(slice-17a-1): add slice spec for token foundation"
```

---

## Task 2: Semantic Type Scale Tokens

**Files:**
- Modify: `src/lib/styles/tokens.css`

- [ ] **Step 1: Replace the old type scale in tokens.css**

Replace the existing 6-token type scale:

```css
/* Type scale */
--text-h1: 2rem;
--text-h2: 1.5rem;
--text-h3: 1.125rem;
--text-body: 1rem;
--text-small: 0.875rem;
--text-xs: 0.75rem;
```

With the new 9-token semantic scale:

```css
/* Type scale — semantic names, fluid headings via clamp() */
/* Hard rules: body ≥ 16px, mono ≥ 13px, labels ≥ 12px */
--text-display: clamp(2.5rem, 5vw, 4rem);       /* 40-64px — hero headlines, page titles */
--text-title: clamp(1.75rem, 4vw, 2.5rem);       /* 28-40px — section headings (H2) */
--text-heading: clamp(1.25rem, 3vw, 1.5rem);     /* 20-24px — card titles, H3 */
--text-subheading: 1.125rem;                       /* 18px — subtitles, H4 */
--text-body: 1rem;                                 /* 16px — paragraphs, descriptions */
--text-body-lg: 1.125rem;                          /* 18px — lead paragraphs, hero subtitles */
--text-small: 0.875rem;                            /* 14px — metadata, labels */
--text-caption: 0.75rem;                           /* 12px — timestamps, footnotes */
--text-mono: 0.8125rem;                            /* 13px — terminal text, code, SQL */
```

- [ ] **Step 2: Verify the site still builds**

```bash
bun run build
```

Expected: Success. No components reference the old token names (`--text-h1`, `--text-h2`, `--text-h3`, `--text-xs`) in a way that would break — audit shows they were barely used.

- [ ] **Step 3: Commit**

```bash
git add src/lib/styles/tokens.css
git commit -m "feat(slice-17a-1): replace type scale with 9-token semantic scale"
```

---

## Task 3: Shadow, Z-Index, Transition, Opacity, Container Tokens

**Files:**
- Modify: `src/lib/styles/tokens.css`

- [ ] **Step 1: Add all new token categories to `:root` block**

After the existing type scale section, add:

```css
/* Shadow scale — uses color-mix() to stay connected to brand tokens */
--shadow-glow-sm: 0 0 6px color-mix(in srgb, var(--brand-primary) 30%, transparent);
--shadow-glow-md: 0 0 12px color-mix(in srgb, var(--brand-primary) 20%, transparent);
--shadow-glow-lg: 0 0 24px color-mix(in srgb, var(--brand-primary) 15%, transparent),
                  0 0 60px color-mix(in srgb, var(--brand-primary) 6%, transparent);
--shadow-card: 0 0 16px color-mix(in srgb, var(--brand-primary) 8%, transparent),
              0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-section: 0 8px 32px color-mix(in srgb, var(--brand-primary) 6%, transparent);
--shadow-nav: 0 4px 30px rgba(0, 0, 0, 0.5),
             0 0 0 1px rgba(255, 255, 255, 0.03);
--shadow-status: 0 0 6px color-mix(in srgb, var(--status-live) 40%, transparent);

/* Z-index scale — global stacking context */
--z-base: 0;
--z-content: 1;
--z-rail: 30;
--z-footer: 40;
--z-sheet: 50;
--z-menu: 60;
--z-nav: 70;

/* Transition tokens */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
--ease-default: ease;
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-decel: cubic-bezier(0, 0, 0.2, 1);

/* Opacity scale */
--opacity-muted: 0.6;
--opacity-dim: 0.3;
--opacity-subtle: 0.15;
--opacity-faint: 0.05;

/* Container widths */
--container-content: 64rem;   /* 1024px — primary content */
--container-wide: 72rem;      /* 1152px — wide layouts */
--container-prose: 65ch;      /* prose columns */
```

- [ ] **Step 2: Add missing semantic color tokens to dark theme block**

In the `[data-theme="dark"], .theme-dark` block, add after `--status-live`:

```css
--bg-card: #1a1a1a;
--bg-deep: #0D0D0D;
--border-strong: #333333;
--status-error: #ff5f57;
--status-success: #28c840;
--text-code: #cccccc;
```

- [ ] **Step 3: Add the same tokens to the `prefers-color-scheme: dark` media query block**

Duplicate the 6 new tokens into the `:root:not([data-theme="light"])` block inside the dark media query so they're available by default.

- [ ] **Step 4: Add light theme equivalents for ALL dark-only tokens**

In the `[data-theme="light"], .theme-light` block, add:

```css
--bg-terminal: #F5F5F0;
--border-subtle: #D8D4CA;
--text-dim: #AAAAAA;
--status-live: #16a34a;
--bg-manifesto: #F0EDE5;
--bg-card: #FFFFFF;
--bg-deep: #F0EDE5;
--border-strong: #C0BDB5;
--status-error: #dc2626;
--status-success: #16a34a;
--text-code: #333333;
```

Add the same to the `prefers-color-scheme: light` media query block.

- [ ] **Step 5: Verify build**

```bash
bun run build
```

Expected: Success. These are additive — no component references them yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/styles/tokens.css
git commit -m "feat(slice-17a-1): add shadow, z-index, transition, opacity, container, color tokens"
```

---

## Task 4: Unify Radius Naming + Map All Tokens to @theme

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Replace the existing @theme block with the complete token bridge**

Replace the entire `@theme { ... }` block in `src/app.css` with:

```css
@theme {
  /* Brand colors — static palette, not theme-switching */
  --color-brand-primary: #E07800;
  --color-brand-accent: #FFB627;
  --color-brand-primary-hover: #C96A00;
  --color-brand-accent-hover: #E5A220;

  /* Dark palette */
  --color-dark-bg: #141414;
  --color-dark-surface: #1E1E1E;
  --color-dark-elevated: #2A2A2A;
  --color-dark-border: #3A3A3A;

  /* Light palette */
  --color-light-bg: #FAFAF8;
  --color-light-surface: #F0EDE5;
  --color-light-elevated: #FFFFFF;
  --color-light-border: #D8D4CA;

  /* Font families */
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Type scale — maps tokens to text-* utilities */
  --font-size-display: var(--text-display);
  --font-size-title: var(--text-title);
  --font-size-heading: var(--text-heading);
  --font-size-subheading: var(--text-subheading);
  --font-size-body: var(--text-body);
  --font-size-body-lg: var(--text-body-lg);
  --font-size-small: var(--text-small);
  --font-size-caption: var(--text-caption);
  --font-size-mono: var(--text-mono);

  /* Border radius — UNIFIED naming (fixes tokens.css/theme split-brain) */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-glow-sm: var(--shadow-glow-sm);
  --shadow-glow-md: var(--shadow-glow-md);
  --shadow-glow-lg: var(--shadow-glow-lg);
  --shadow-card: var(--shadow-card);
  --shadow-section: var(--shadow-section);
  --shadow-nav: var(--shadow-nav);
  --shadow-status: var(--shadow-status);

  /* Z-index */
  --z-index-base: var(--z-base);
  --z-index-content: var(--z-content);
  --z-index-rail: var(--z-rail);
  --z-index-footer: var(--z-footer);
  --z-index-sheet: var(--z-sheet);
  --z-index-menu: var(--z-menu);
  --z-index-nav: var(--z-nav);

  /* Container widths */
  --width-content: var(--container-content);
  --width-wide: var(--container-wide);
  --width-prose: var(--container-prose);

  /* Terminal / SQL panel */
  --color-terminal-bg: #0a0a0a;
  --color-terminal-border: #2a2a2a;
  --color-dim: #4a4a4a;
  --color-live: #22c55e;

  /* Breakpoints — documented here, defined via Tailwind v4 screens */
  /* sm: 360px, md: 520px, lg: 768px, xl: 1024px, 2xl: 1440px */
}
```

- [ ] **Step 2: Search for old radius names and verify no breakage**

Search for `rounded-brand` in `.svelte` files — these used the old `--radius-brand` which is now `--radius-md`. The `rounded-md` class maps to the same 8px value, so they're equivalent. If `rounded-brand` was used, find-and-replace with `rounded-md`.

```bash
bun run build && bun run check
```

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "feat(slice-17a-1): complete @theme mapping — type scale, shadows, z-index, radius unified"
```

---

## Task 5: Breakpoint System

**Files:**
- Modify: `src/app.css` (add screen definitions if Tailwind v4 needs them)

- [ ] **Step 1: Verify Tailwind v4 breakpoint configuration**

Tailwind v4 uses `@theme` for screens. Check if custom screens are needed or if the defaults suffice. The canonical breakpoints are:

| Token | Width | Tailwind Default |
|-------|-------|-----------------|
| `sm` | 360px | 640px (DIFFERENT) |
| `md` | 520px | 768px (DIFFERENT) |
| `lg` | 768px | 1024px (DIFFERENT) |
| `xl` | 1024px | 1280px (DIFFERENT) |
| `2xl` | 1440px | 1536px (CLOSE) |

**Important:** Changing Tailwind's default breakpoints will affect EVERY responsive class in the codebase. This is a HIGH-RISK change. Before changing, audit whether the existing responsive classes were written against Tailwind defaults (640/768/1024/1280/1536) or the custom values.

Use Context7 MCP to check Tailwind v4's `@theme` screen syntax:

```
resolve-library-id: "tailwindcss"
query-docs: "customizing screens breakpoints @theme v4"
```

- [ ] **Step 2: Decision — custom screens vs. Tailwind defaults**

After research, decide:
- **Option A:** Keep Tailwind default breakpoints (safer, less migration)
- **Option B:** Override with custom breakpoints (matches design spec but requires auditing every responsive class)

Document decision in devlog. If Option A: document the canonical breakpoints in CSS.md as guidelines, not as Tailwind overrides.

- [ ] **Step 3: Commit any changes**

```bash
git add src/app.css
git commit -m "feat(slice-17a-1): configure breakpoint system"
```

---

## Task 6: Type Scale Migration — Home Page Components

**Files:**
- Modify: `src/lib/components/HeroBanner.svelte`
- Modify: `src/lib/components/HeroSqlPanel.svelte`
- Modify: `src/lib/components/HeroMetrics.svelte`
- Modify: `src/lib/components/Manifesto.svelte`
- Modify: `src/lib/components/HomeServices.svelte`
- Modify: `src/lib/components/ProofReel.svelte`
- Modify: `src/lib/components/HomeCloser.svelte`
- Modify: `src/routes/+page.svelte`

**Migration pattern:**

Before (arbitrary):
```html
<h2 class="text-[28px] font-bold">Section Title</h2>
<p class="text-[13px] font-mono">Terminal text</p>
<span class="text-[11px] uppercase tracking-wider">Label</span>
```

After (semantic):
```html
<h2 class="text-title font-bold">Section Title</h2>
<p class="text-mono font-mono">Terminal text</p>
<span class="text-caption uppercase tracking-wider">Label</span>
```

**Mapping reference:**

| Arbitrary Value | Maps To | Token |
|----------------|---------|-------|
| `text-[10px]`, `text-[11px]` | `text-caption` | 12px (minimum label size) |
| `text-[13px]` (mono context) | `text-mono` | 13px |
| `text-[13px]` (non-mono) | `text-small` | 14px |
| `text-[14px]`, `text-xs` | `text-small` | 14px |
| `text-sm` (14px default) | `text-small` | 14px |
| `text-[15px]`, `text-[16px]`, `text-base` | `text-body` | 16px |
| `text-[17px]`, `text-[18px]`, `text-lg` | `text-body-lg` or `text-subheading` | 18px |
| `text-[20px]`, `text-xl` | `text-heading` | 20-24px fluid |
| `text-[24px]`, `text-2xl` | `text-heading` | 20-24px fluid |
| `text-[28px]`, `text-3xl` | `text-title` | 28-40px fluid |
| `text-[32px]`, `text-4xl`, `text-[40px]` | `text-title` | 28-40px fluid |
| `text-[48px]`, `text-5xl`, `text-[64px]` | `text-display` | 40-64px fluid |

- [ ] **Step 1: Migrate HeroBanner.svelte**

Open `src/lib/components/HeroBanner.svelte`. Find all `text-[Npx]` occurrences (audit shows 6). Replace each with the semantic token from the mapping table. Preserve all other classes.

- [ ] **Step 2: Migrate remaining home page components**

For each of: `HeroSqlPanel`, `HeroMetrics`, `Manifesto`, `HomeServices`, `ProofReel`, `HomeCloser`, `+page.svelte` — find and replace all `text-[Npx]` with semantic tokens using the mapping table.

- [ ] **Step 3: Run tests**

```bash
bun run test && bun run check
```

Expected: All pass. These are class name changes only.

- [ ] **Step 4: Visual check**

Start dev server (`bun run dev`), check `http://localhost:5173/` — headings should be bigger/more uniform. This is an expected improvement (Decision D9).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/HeroBanner.svelte src/lib/components/HeroSqlPanel.svelte src/lib/components/HeroMetrics.svelte src/lib/components/Manifesto.svelte src/lib/components/HomeServices.svelte src/lib/components/ProofReel.svelte src/lib/components/HomeCloser.svelte src/routes/+page.svelte
git commit -m "feat(slice-17a-1): migrate home page components to semantic type scale"
```

---

## Task 7: Type Scale Migration — Blog Components

**Files:**
- Modify: `src/lib/components/BlogDetailHeader.svelte` (4 occurrences)
- Modify: `src/lib/components/BlogRow.svelte` (3)
- Modify: `src/lib/components/BlogListingPage.svelte` (1)
- Modify: `src/lib/components/BlogFilterSidebar.svelte` (7)
- Modify: `src/lib/components/BlogFilterMobile.svelte` (13)

- [ ] **Step 1: Migrate all blog components**

Use the mapping table from Task 6. BlogFilterMobile has the most occurrences (13) — be thorough.

- [ ] **Step 2: Run tests + check**

```bash
bun run test && bun run check
```

- [ ] **Step 3: Visual check**

Check `http://localhost:5173/blog` and `http://localhost:5173/blog/personal` — filter labels, row text, and headers should use the semantic scale.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/BlogDetailHeader.svelte src/lib/components/BlogRow.svelte src/lib/components/BlogListingPage.svelte src/lib/components/BlogFilterSidebar.svelte src/lib/components/BlogFilterMobile.svelte
git commit -m "feat(slice-17a-1): migrate blog components to semantic type scale"
```

---

## Task 8: Type Scale Migration — Work + Services Components

**Files:**
- Modify: `src/lib/components/WorkCard.svelte` (5)
- Modify: `src/lib/components/WorkFilterMobile.svelte` (11)
- Modify: `src/lib/components/WorkListingPage.svelte` (2)
- Modify: `src/lib/components/WorkDetailSidebar.svelte` (1)
- Modify: `src/lib/components/WorkServiceBadge.svelte` (1)
- Modify: `src/lib/components/ServiceDetailPage.svelte`
- Modify: `src/lib/components/ServiceListingPage.svelte`

- [ ] **Step 1: Migrate all work + services components**

Use the mapping table from Task 6.

- [ ] **Step 2: Run tests + check**

```bash
bun run test && bun run check
```

- [ ] **Step 3: Visual check**

Check `/work`, `/work/[any-slug]`, `/services`, `/services/[any-id]`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/WorkCard.svelte src/lib/components/WorkFilterMobile.svelte src/lib/components/WorkListingPage.svelte src/lib/components/WorkDetailSidebar.svelte src/lib/components/WorkServiceBadge.svelte src/lib/components/ServiceDetailPage.svelte src/lib/components/ServiceListingPage.svelte
git commit -m "feat(slice-17a-1): migrate work + services components to semantic type scale"
```

---

## Task 9: Type Scale Migration — About, Contact, Tech Stack, Shared

**Files:**
- Modify: `src/lib/components/AboutBento.svelte` (3)
- Modify: `src/lib/components/AboutPage.svelte` (2)
- Modify: `src/lib/components/AboutInterests.svelte` (1)
- Modify: `src/lib/components/AboutIdentity.svelte` (3)
- Modify: `src/lib/components/AboutCta.svelte` (2)
- Modify: `src/lib/components/AboutMetrics.svelte` (1)
- Modify: `src/lib/components/AboutPolaroids.svelte` (2)
- Modify: `src/lib/components/AboutMethod.svelte` (3)
- Modify: `src/lib/components/AboutLogos.svelte` (1)
- Modify: `src/lib/components/AboutWeather.svelte` (1)
- Modify: `src/lib/components/ContactPage.svelte` (18)
- Modify: `src/lib/components/CollapsibleSection.svelte` (1)
- Modify: `src/lib/components/FilterGroup.svelte` (3)
- Modify: `src/lib/components/Footer.svelte` (3)
- Modify: `src/lib/components/TableOfContents.svelte` (4)
- Modify: `src/lib/components/HeroSqlPanel.svelte` (3)
- Modify: `src/routes/preview/+page.svelte` (1)

- [ ] **Step 1: Migrate about page components**

ContactPage has the most occurrences (18) — many are terminal-style mono text that maps to `text-mono`.

- [ ] **Step 2: Migrate shared components (Footer, FilterGroup, CollapsibleSection, TableOfContents)**

- [ ] **Step 3: Run tests + check**

```bash
bun run test && bun run check
```

- [ ] **Step 4: Verify zero arbitrary text values remain**

```bash
# This should return 0 matches
rg 'text-\[\d+px\]' src/ --glob '*.svelte' -c
```

If any remain, fix them before continuing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(slice-17a-1): complete type scale migration — zero arbitrary text-[Npx] values"
```

---

## Task 10: Token Validation Tests

**Files:**
- Create: `src/lib/styles/__tests__/tokens.test.ts`

- [ ] **Step 1: Write token validation tests**

These tests verify the token system is complete and consistent. They read the CSS files and validate structure.

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const tokensCSS = readFileSync(
  resolve(process.cwd(), 'src/lib/styles/tokens.css'),
  'utf-8'
);

const appCSS = readFileSync(
  resolve(process.cwd(), 'src/app.css'),
  'utf-8'
);

describe('Design System Tokens', () => {
  describe('Type scale', () => {
    const requiredTokens = [
      '--text-display', '--text-title', '--text-heading',
      '--text-subheading', '--text-body', '--text-body-lg',
      '--text-small', '--text-caption', '--text-mono'
    ];

    it.each(requiredTokens)('defines %s in tokens.css', (token) => {
      expect(tokensCSS).toContain(token);
    });

    it.each(requiredTokens)('maps %s to @theme in app.css', (token) => {
      const themeName = token.replace('--text-', '--font-size-');
      expect(appCSS).toContain(themeName);
    });

    it('uses clamp() for fluid headings', () => {
      expect(tokensCSS).toMatch(/--text-display:\s*clamp\(/);
      expect(tokensCSS).toMatch(/--text-title:\s*clamp\(/);
      expect(tokensCSS).toMatch(/--text-heading:\s*clamp\(/);
    });
  });

  describe('Shadow scale', () => {
    const requiredShadows = [
      '--shadow-glow-sm', '--shadow-glow-md', '--shadow-glow-lg',
      '--shadow-card', '--shadow-section', '--shadow-nav', '--shadow-status'
    ];

    it.each(requiredShadows)('defines %s', (token) => {
      expect(tokensCSS).toContain(token);
    });

    it('uses color-mix() for brand-connected shadows', () => {
      expect(tokensCSS).toMatch(/--shadow-glow-sm:.*color-mix/);
    });
  });

  describe('Z-index scale', () => {
    const requiredZIndex = [
      '--z-base', '--z-content', '--z-rail',
      '--z-footer', '--z-sheet', '--z-menu', '--z-nav'
    ];

    it.each(requiredZIndex)('defines %s', (token) => {
      expect(tokensCSS).toContain(token);
    });

    it('has ascending values', () => {
      const values = requiredZIndex.map(token => {
        const match = tokensCSS.match(new RegExp(`${token}:\\s*(\\d+)`));
        return match ? parseInt(match[1]) : -1;
      });
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe('Transition tokens', () => {
    it('defines duration tokens', () => {
      expect(tokensCSS).toContain('--duration-fast');
      expect(tokensCSS).toContain('--duration-normal');
      expect(tokensCSS).toContain('--duration-slow');
    });

    it('defines easing tokens', () => {
      expect(tokensCSS).toContain('--ease-bounce');
      expect(tokensCSS).toContain('--ease-decel');
    });
  });

  describe('Semantic color completeness', () => {
    const darkOnlyTokens = [
      '--bg-terminal', '--border-subtle', '--text-dim',
      '--status-live', '--bg-manifesto', '--bg-card',
      '--bg-deep', '--border-strong', '--status-error',
      '--status-success', '--text-code'
    ];

    it.each(darkOnlyTokens)('defines %s in dark theme', (token) => {
      const darkBlock = tokensCSS.match(
        /\[data-theme="dark"\][\s\S]*?\{([\s\S]*?)\}/
      );
      expect(darkBlock?.[1]).toContain(token);
    });

    it.each(darkOnlyTokens)('defines %s in light theme', (token) => {
      const lightBlock = tokensCSS.match(
        /\[data-theme="light"\][\s\S]*?\{([\s\S]*?)\}/
      );
      expect(lightBlock?.[1]).toContain(token);
    });
  });

  describe('@theme radius naming', () => {
    it('uses unified radius names (not split-brain)', () => {
      expect(appCSS).toContain('--radius-sm');
      expect(appCSS).toContain('--radius-md');
      expect(appCSS).toContain('--radius-lg');
      expect(appCSS).toContain('--radius-pill');
      expect(appCSS).not.toContain('--radius-brand:');
    });
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
bun run test src/lib/styles/__tests__/tokens.test.ts
```

Expected: All pass. If any fail, fix the token definitions first.

- [ ] **Step 3: Commit**

```bash
git add src/lib/styles/__tests__/tokens.test.ts
git commit -m "test(slice-17a-1): add token validation tests for design system"
```

---

## Task 11: CSS.md — Design System Reference

**Files:**
- Create: `docs/reference/CSS.md`

- [ ] **Step 1: Write CSS.md**

This is the design system reference document. Structure:

1. **Architecture overview** — tokens.css → @theme → utilities → components
2. **Type scale reference** — all 9 tokens with sizes and usage
3. **Color tokens** — brand, semantic, status, with roles
4. **Shadow tokens** — all 7 with visual descriptions
5. **Z-index scale** — all 7 levels with component assignments
6. **Transition tokens** — durations and easings with usage guidelines
7. **Container widths** — content, wide, prose
8. **Breakpoints** — 5 tiers with column/padding guidelines
9. **Radius tokens** — unified scale
10. **Rules** — what goes in tokens vs @theme vs scoped style
11. **Color addition checklist** — 4-step process for adding new brand colors
12. **Anti-patterns** — no `text-[Npx]`, no hardcoded hex, no inline style for static values

- [ ] **Step 2: Commit**

```bash
git add docs/reference/CSS.md
git commit -m "docs(slice-17a-1): create CSS.md — design system reference"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
bun run test
```

Print the results table per CLAUDE.md.

- [ ] **Step 2: Run type check**

```bash
bun run check
```

- [ ] **Step 3: Run build**

```bash
bun run build
```

- [ ] **Step 4: Verify zero arbitrary type values**

```bash
rg 'text-\[\d+px\]' src/ --glob '*.svelte'
```

Expected: 0 matches.

- [ ] **Step 5: Verify all token tests pass**

```bash
bun run test src/lib/styles/__tests__/tokens.test.ts
```

- [ ] **Step 6: Update devlog**

Add entry to `docs/devlog/` documenting:
- What was built
- Token counts (9 type, 7 shadow, 7 z-index, 7 transition, 4 opacity, 3 container, 6 new colors)
- Migration stats (116 arbitrary values → 0)
- Any decisions made during implementation

- [ ] **Step 7: Update checkpoint**

Update `docs/slices/slice-17-checkpoint.md` with current status.

---

## Acceptance Criteria Checklist

From the design spec (Section 7.1):

- [ ] 9 type scale tokens in `tokens.css`, all mapped in `@theme`
- [ ] Zero `text-[Npx]` arbitrary values in any `.svelte` file
- [ ] Body text never < 16px, mono never < 13px, labels never < 12px
- [ ] Shadow tokens defined and generating Tailwind utilities
- [ ] Z-index scale defined — no magic numbers in global stacking
- [ ] Transition tokens defined — no unnamed cubic-bezier curves
- [ ] Missing semantic colors added (`--bg-card`, `--border-strong`, `--status-*`, `--text-code`)
- [ ] Radius naming unified between tokens.css and @theme
- [ ] Container width tokens defined
- [ ] 5 canonical breakpoints documented
- [ ] `CSS.md` exists with full token reference
- [ ] `bun run build` + `bun run test` + `bun run check` pass
- [ ] No layout regressions (text size improvements expected — D9)
