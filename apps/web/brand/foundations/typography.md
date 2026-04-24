# foundations / typography

> Narrative. The 12-step scale tokens live in `src/app.css @theme`. See `docs/project/CSS.md § Type Scale` for the canonical table.

## What it is

Two self-hosted variable fonts, one type scale, twelve steps. Headings get fluid `clamp()` sizes; body and below are fixed. Every piece of text on yesid.dev is sized from this scale — arbitrary Tailwind font sizes (`text-[14px]`, `text-[Npx]`) are banned.

## Families

| Family | Usage | Where it comes from |
|---|---|---|
| **Inter** (Variable) | Headings, body, UI text | `@fontsource-variable/inter` (self-hosted) |
| **JetBrains Mono** (Variable) | Code, terminal panels, mono labels, station labels, metrics | `@fontsource-variable/jetbrains-mono` (self-hosted) |

Both variable fonts ship on every route. Google Fonts is not used — self-hosting eliminates font-swap layout shift and a third-party network dep.

## Scale

Twelve tokens. Headings use `clamp()` so they scale fluidly between breakpoints; body-and-below are fixed for predictable reading.

| Token | Size | Usage |
|---|---|---|
| `text-hero` | `clamp(64px, min(9vw, 11svh), 130px)` | Hero wordmark (HeroBanner only) |
| `text-hero-mobile` | `clamp(48px, min(13vw, 8svh), 64px)` | Hero headline on narrow screens (PIPELINES / DON'T BREAK). Viewport-width-led for proportional scaling. |
| `text-display` | `clamp(40px, 5vw, 64px)` | Hero headlines, page titles |
| `text-title` | `clamp(28px, 4vw, 40px)` | Section headings (H2) |
| `text-heading` | `clamp(20px, 3vw, 24px)` | Card titles, H3 |
| `text-subheading` | `18px` | Subtitles, H4 |
| `text-body-lg` | `18px` | Lead paragraphs, hero subtitles |
| `text-body` | `16px` | Paragraphs, descriptions |
| `text-small` | `14px` | Metadata, labels |
| `text-mono` | `13px` | Terminal text, code, SQL |
| `text-caption` | `12px` | Timestamps, footnotes, tags |
| `text-micro` | `10px` | Chrome annotations, stop labels (STOP 00, SERVICE 01 / 06) |

## Rules

1. **Body ≥ 16px.** No paragraph falls below `text-body`. Long-form reading — blog, project detail — uses `text-body-lg` (18px).
2. **Mono ≥ 13px.** Smaller monospace is unreadable. `text-mono` is the floor.
3. **Labels ≥ 12px.** `text-caption` is the floor for any inline label, metadata, or tag.
4. **Micro for chrome only.** `text-micro` (10px) is reserved for annotations that frame the interface — `// section-label` patterns, stop codes, edge ticks. Never used for primary content.
5. **No arbitrary sizes.** `text-[11px]`, `text-[Npx]`, `style="font-size: Npx"` are banned. If a new size is needed, the type scale gets a new token first.
6. **One H1 per page.** Heading levels are semantic, not visual. A section with no visible heading still uses `<h2 class="sr-only">` — screen readers need the structure.

## Examples

### Hero

```svelte
<h1 class="block text-hero-mobile md:text-hero">yesid.</h1>
```

The mobile/desktop split uses the two hero tokens — `text-hero-mobile` below `md:` (768px), `text-hero` at `md:` and above.

### Section heading

```svelte
<SectionHeading heading="Projects" labelText="// 03" />
```

`SectionHeading` consumes `text-title` for the heading and `text-micro` / `text-caption` for the label — no size decisions at the page level.

### Body

```svelte
<p class="text-body md:text-body-lg text-secondary-foreground">
  Migrations that ship on Friday.
</p>
```

Base body is 16px; 18px at `md:` and above for long-form reading. Color comes from `--secondary-foreground` (muted, theme-switching).

### Metric + label

```svelte
<MetricDisplay value="3x" label="avg query improvement" size="lg" />
```

`MetricDisplay` pairs a `text-heading` / `text-title` / `text-display` value (sized by `size` prop) with a `text-caption` uppercase label. The value is the number; the label is the context.

## Pairings

| Heading | Body | Use case |
|---|---|---|
| `text-display` | `text-body-lg` | Page hero |
| `text-title` | `text-body` | Section heading + intro paragraph |
| `text-heading` | `text-body` | Card title + description |
| `text-subheading` | `text-body` | Subsection / modal body |
| `text-mono` (uppercase) | `text-caption` | Terminal block + caption |

## Exception

The hero wordmark uses a mix of viewport-width and small-viewport-height units (`9vw`, `11svh`) to keep proportions stable across desktop and phone-landscape. This is still in the type scale — but it is the only token that blends both unit families. All other tokens use fixed `px` or `clamp(px, vw, px)`.

## When to extend

Add a new scale token only when:

1. A new size appears on 2+ components and isn't expressible as a combination of existing tokens.
2. The new size sits at a real hierarchy level (larger than `text-display`, or between `text-body-lg` and `text-heading`, etc.) — not a 1px adjustment.
3. The addition is recorded in `docs/project/CSS.md § Type Scale` and CONSTITUTION.md § 4.

Every new token requires consumer migration — if only one component needs the size, it's a bespoke case, not a token candidate.
