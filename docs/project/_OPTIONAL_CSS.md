# CSS

> **OPTIONAL template.** Create when project has significant styling discipline — design system, tokens, scoped style rules. Typical projects: web apps, design systems, component libraries, marketing sites.
>
> **To activate:** rename `_OPTIONAL_CSS.md` → `CSS.md`. Update README.md (in this directory).

## When to create

- Project has a design token system (colors, spacing, typography defined as variables)
- Project enforces "no hardcoded values" rules
- Project has multi-layer CSS architecture (tokens → utilities → components)
- Project has theme switching (dark/light/custom)
- Multiple components share visual primitives (cards, buttons, dividers)

## Architecture

| Layer | Location | Role |
|-------|----------|------|
| Tokens | <!-- e.g., `src/styles/tokens.css` --> | <!-- semantic CSS custom properties (--background, --foreground) — theme-switching --> |
| Utility / theme bridge | <!-- e.g., `src/app.css @theme` block --> | <!-- maps tokens to utility classes (Tailwind / similar); static brand values --> |
| Component scope | <!-- e.g., `<style>` in components --> | <!-- layout / structure specific to one component; never colors / fonts / spacing --> |

## Rules

> Numbered for code-review reference.

### 1. <!-- FILL IN: rule title -->

<!-- FILL IN: e.g., "Zero hardcoded colors. Every visual color value references a token (`var(--brand-primary)`) or a utility class (`text-brand-primary`). Hardcoded hex in scoped style is a code-review blocker." -->

### 2. <!-- FILL IN -->

<!-- FILL IN: e.g., "No `!important` in scoped styles. Specificity issues = symptoms of token-layer problems." -->

### 3. <!-- FILL IN -->

<!-- FILL IN: e.g., "No inline `style=` attributes except for dynamic JS values (scroll position, transforms)." -->

### 4. <!-- FILL IN -->

<!-- FILL IN: e.g., "Mobile-first responsive: default styles are mobile, then `@media (min-width: ...)` adds desktop." -->

### 5. <!-- FILL IN -->

<!-- FILL IN: e.g., "Use logical properties (`margin-block`, `padding-inline`) over physical (`margin-top`, `padding-left`) for i18n RTL support." -->

### 6. <!-- FILL IN -->

<!-- FILL IN: e.g., "No `vh` unit. Use `dvh` / `svh` / `lvh` for mobile viewport correctness." -->

### 7. <!-- FILL IN -->

<!-- FILL IN: e.g., "No arbitrary utility values (`text-[11px]`). Add a token instead." -->

## Token catalog

> Document every token + purpose + which components consume it. Add rows as tokens are added.

### Color tokens

| Token | Light value | Dark value | Used by |
|-------|-------------|------------|---------|
| <!-- FILL IN: `--background` --> | <!-- e.g., #FFFFFF --> | <!-- e.g., #0A0A0A --> | <!-- "every layout container" --> |
| <!-- FILL IN: `--foreground` --> | <!-- --> | <!-- --> | <!-- "every text element" --> |

### Spacing tokens

| Token | Value | Used by |
|-------|-------|---------|
| <!-- FILL IN: `--space-page-x` --> | <!-- e.g., clamp(1rem, 4vw, 4rem) --> | <!-- "page-edge horizontal padding on every full-bleed section" --> |

### Typography tokens

| Token | Value | Used by |
|-------|-------|---------|
| <!-- FILL IN: `--text-display` --> | <!-- e.g., clamp(2.5rem, 5vw, 4rem) --> | <!-- "hero / page titles" --> |

## Adding a new token

> The closing-checklist trigger: every token add gets logged here.

1. Add `--<name>` to <!-- FILL IN: token file path -->.
2. Add corresponding entry in the utility / theme bridge file if the project uses one.
3. Add a row to the appropriate token catalog table above.
4. Document the addition in the slice's `handoff.md § Files modified` per Iteration Protocol step 4.

## Banned patterns

> Patterns the team has specifically decided NOT to use. Each comes with a "what to do instead" + rationale.

| Banned | Use instead | Why |
|--------|-------------|-----|
| <!-- e.g., raw hex `#E07800` in JSX --> | <!-- `var(--brand-primary)` or `text-brand-primary` --> | <!-- token discipline; theme-switching ready --> |
| <!-- --> | <!-- --> | <!-- --> |

## Notes / decisions

<!-- FILL IN: CSS decisions worth documenting (e.g., "chose Tailwind v4 over CSS Modules because [tradeoffs]") -->
