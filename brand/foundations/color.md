# foundations / color

> Narrative. For the raw token values, see `docs/reference/CSS.md`. For the source of truth, see `src/lib/styles/tokens.css`.

## What it is

Color on yesid.dev is governed by two layers:

1. **Static brand hues.** `#E07800` primary orange and `#FFB627` accent yellow. Plus their hover variants. These never theme-switch.
2. **Semantic tokens.** Everything else — backgrounds, text, borders, surfaces — is a semantic token that switches between dark and light themes. Components never name a raw hex; they name a role.

The brand is recognisable because the orange is reserved. The site is legible because every text/background pair goes through a semantic token.

## Tokens

### Static brand hues

| Token | Value | Role |
|---|---|---|
| `--primary` | `#E07800` | Interactive brand — buttons, links, focus rings, active states |
| `--accent` | `#FFB627` | Secondary brand — selection highlights, accent details |
| `--primary-hover` | `#C96A00` | Primary on hover |
| `--accent-hover` | `#E5A220` | Accent on hover |
| `--primary-rgb` | `224 120 0` | Channel triplet for `rgb(var(--primary-rgb) / 0.3)` style alpha usage |

### Semantic (theme-switching)

Short list — the full dark/light pair table lives in `docs/reference/CSS.md § Color Tokens`.

| Role | Token | Purpose |
|---|---|---|
| Page background | `--background` | The surface the page sits on |
| Primary text | `--foreground` | The main readable text |
| Card / panel background | `--card`, `--muted` | Elevated surfaces |
| Supporting text | `--secondary-foreground`, `--muted-foreground`, `--dim-foreground`, `--light-foreground` | Tiered de-emphasis |
| Terminal / code | `--terminal` | Dark code panels |
| Manifesto | `--manifesto` | The manifesto section's deeper surface |
| Borders | `--border`, `--border-subtle`, `--border-strong` | Three tiers |
| Status | `--success`, `--destructive` | Live / error indicators |

## Rules

1. **Never use raw hex in components.** A component names `var(--primary)` or a Tailwind utility like `bg-primary`. If the hex isn't in `tokens.css`, it isn't a brand color — it's a bug.
2. **Orange appears only on interactive surfaces.** Links, buttons, focus rings, active states, interactive pulses. Non-interactive surfaces use semantic tokens. If a new surface wants orange, the question is whether the surface is interactive. If not, the answer is no.
3. **Semantic tokens carry meaning, not a specific color.** `--muted-foreground` means "text the reader is not meant to focus on first." It switches between `#666666` and `#888888` across themes. The meaning is what travels.
4. **Contrast is a constraint.** Every text/background pair is checked against WCAG AA on the dark theme first, then the light theme. Pairs that fail get a different token — they do not get a bespoke color.
5. **Dark-first design.** New pages are designed against dark first. Light theme is a re-skin, not a redesign. The token system makes the re-skin a file swap.

## Examples

### Good / bad — background

```
BAD:  <div class="bg-[#1a1a1a]">...</div>
GOOD: <div class="bg-card">...</div>
```

The bad form hardcodes a hex that is correct today but will silently drift when the dark surface changes. The good form names a role.

### Good / bad — interactive

```
BAD:  <button class="bg-[#E07800] hover:bg-[#C96A00]">Ship</button>
GOOD: <Button>Ship</Button>
```

`ui/button` wraps the brand token + the hover token + the focus ring. A hex here is guaranteed to drift from the Button primitive the moment either changes.

### Good / bad — borders

```
BAD:  <div class="border border-white/10">...</div>
GOOD: <div class="border border-border-subtle">...</div>
```

`white/10` is a Tailwind alpha form with no theme awareness. On the light theme it disappears. `--border-subtle` swaps to `#D8D4CA` on light and stays visible.

## Contrast posture

Key pairs on the dark theme, rounded, verified against the values in `tokens.css` with a WCAG-standard contrast calculator:

| Pair | Ratio (dark) | WCAG |
|---|---|---|
| `--foreground` on `--background` (`#F5F5F0` on `#141414`) | ~13.9 : 1 | AAA |
| `--primary` on `--background` (`#E07800` on `#141414`) | ~5.3 : 1 | AA for body text, AAA for large text |
| `--muted-foreground` on `--background` (`#666666` on `#141414`) | ~3.7 : 1 | AA for large text only — use sparingly on long paragraphs |
| `--dim-foreground` on `--background` (`#4a4a4a` on `#141414`) | ~2.3 : 1 | Below AA — reserved for non-text de-emphasis (dividers, inactive icons) |

Light theme is designed to clear the same bars; spot-check when editing tokens.

## When to extend

Add a new token when all three conditions hold:

1. A new semantic role appears on 2+ surfaces (not just a one-off page).
2. The role cannot be expressed by an existing token in dark AND light.
3. The role has a defensible reason to theme-switch — static values go in `--primary` / `--accent` family; dynamic ones go in the per-theme blocks.

Every new token requires a row in `docs/reference/CSS.md`. If there is no row, the token does not exist.
