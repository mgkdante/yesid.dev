# Contact Page Design — Dual Terminal Layout

**Date:** 2026-04-07
**Slice:** 09b (About + Contact)
**Route:** `/contact`
**Status:** Approved

## Overview

The contact page extends the terminal aesthetic from the About page's CTA widget into a full-page experience. Two side-by-side terminal windows — one for info/socials, one for the contact form — create a cohesive, immersive feel while keeping the form fully usable.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Dual terminal windows (info + form) | Extends CTA terminal aesthetic to full page |
| Terminal scope | Full terminal — form fields ARE CLI prompts | Maximum brand cohesion |
| Info links | Clickable (mailto, new tab) | Functional, not just decorative |
| Mobile order | Info first, form second | Context before action |
| Success state | Typed output sequence + reset + nav links | "Build passing" feeling |
| Validation | Inline errors under each field | Best UX — user sees exactly what to fix |

## Page Structure

```
Station header: "CONTACT — NEXT STOP: YOU"
Hazard stripe (top)
┌─────────────────────┐  ┌─────────────────────────┐
│  INFO TERMINAL       │  │  FORM TERMINAL           │
│  ~/info              │  │  ~/contact               │
│                      │  │                          │
│  STATUS              │  │  $ yesid --contact       │
│  ● Available         │  │  → Opening contact form… │
│    Booking Q3 2026   │  │                          │
│                      │  │  name:                   │
│  LOCATION            │  │  [___________________]   │
│    Montreal, QC      │  │                          │
│    ~24h response     │  │  email:                  │
│                      │  │  [___________________]   │
│  CONNECT             │  │                          │
│  → hello@yesid.dev   │  │  message:                │
│  → github.com/…      │  │  [___________________]   │
│  → linkedin.com/…    │  │  [___________________]   │
│                      │  │                          │
│  ~ █                 │  │  ~ $ send --message →    │
└─────────────────────┘  └─────────────────────────┘
Hazard stripe (bottom)
Footer
```

## Info Terminal (Left)

### Chrome
- Title bar: traffic-light dots (red/yellow/green) + `yesid@mtl ~ /info`
- Background: `#141414`
- Border: `1px solid var(--border)` (`#2a2a2a`)

### Content
- Command: `~ $ yesid --info`
- **STATUS** section: green dot `● Available for projects`, accent `Booking Q3 2026`
- **LOCATION** section: `Montreal, QC, Canada`, `~24h response time`
- **CONNECT** section: social links (email, GitHub, LinkedIn)
- Blinking orange cursor at bottom

### Hover Interaction
CONNECT links use terminal cursor selection on hover:
- **Default:** `color: var(--text-secondary)` (`#999`)
- **Hovered:** `background: rgba(224,120,0,0.15)`, `color: var(--text-primary)` (`#F5F5F0`)
- **Active (clicked):** `background: rgba(224,120,0,0.25)`, `color: var(--brand-primary)`, underline

### Links
- Email: `mailto:hello@yesid.dev`
- GitHub: `https://github.com/yesidOT` (new tab)
- LinkedIn: LinkedIn profile URL (new tab)
- All sourced from `siteMeta.links`

## Form Terminal (Right)

### Chrome
- Title bar: traffic-light dots + `yesid@mtl ~ /contact`
- Same background/border as info terminal

### Content
- Command: `~ $ yesid --contact`
- Output: `→ Opening contact form...`
- Fields as CLI prompts:
  - `name:` — text input
  - `email:` — email input
  - `message:` — textarea (4 rows)
- Submit: `~ $ send --message →` (orange button)

### Input Styling
- Background: `#0D0D0D`
- Border: `1px solid #333`
- Font: `monospace` (JetBrains Mono)
- Focus: border transitions to `var(--brand-primary)` (`#E07800`)
- Placeholder: `color: #555`

### Validation (Inline)
On submit with invalid fields:
- Invalid field: border turns `#ff5f57` (red)
- Error message below: `✗ required — name cannot be empty` in red
- Valid field: border turns `#28c840` (green)
- Summary at bottom: `✗ N errors — fix and retry` in red
- Form stays visible — user fixes in place

### Success State
On valid submit, form fields fade out and typed sequence appears (GSAP, ~150ms per line):

```
~ $ send --message
→ Validating fields...
✓ name: OK
✓ email: OK
✓ message: OK
→ Sending message...
✓ Message sent successfully!
→ I'll get back to you within 24h
→ Meanwhile, check out my work or blog
~ $ reset --form
```

- `✓` lines in green (`#28c840`)
- `→` lines in orange/accent
- "work" links to `/services`, "blog" links to `/blog`
- `$ reset --form` button (ghost style) restores the form
- **No real backend** — placeholder action. Cloud infra slice adds real submission.

## Mobile Layout

- Single column — terminals stack vertically
- **Info terminal first** (context), form terminal second (action)
- Both terminals full width
- Same interactions — hover becomes tap on links
- Breakpoint: `md` (768px)

## Animations

| Element | Type | Details |
|---------|------|---------|
| Page entrance | `use:reveal` | Stagger left terminal → right terminal |
| Info hover | CSS transition | `background` + `color` on CONNECT lines (~200ms) |
| Form focus | CSS transition | `border-color` glow to orange (~200ms) |
| Submit success | GSAP timeline | Typed sequence, ~150ms stagger per line |
| Blinking cursor | CSS `animate-pulse` | On both terminals |

## Data Layer

All content lives in a `contactContent` object in `src/lib/data/contact-page.ts`:

```typescript
interface ContactContent {
  stationLabel: LocalizedString;        // "CONTACT — NEXT STOP: YOU"
  infoTerminal: {
    title: string;                       // "yesid@mtl ~ /info"
    command: string;                     // "$ yesid --info"
    status: LocalizedString;             // "Available for projects"
    availability: LocalizedString;       // "Booking Q3 2026"
    location: LocalizedString;           // "Montreal, QC, Canada"
    responseTime: LocalizedString;       // "~24h response time"
  };
  formTerminal: {
    title: string;                       // "yesid@mtl ~ /contact"
    command: string;                     // "$ yesid --contact"
    commandOutput: LocalizedString;      // "Opening contact form..."
    fields: {
      name: { label: string; placeholder: LocalizedString };
      email: { label: string; placeholder: LocalizedString };
      message: { label: string; placeholder: LocalizedString };
    };
    submitLabel: LocalizedString;        // "send --message →"
  };
  validation: {
    required: LocalizedString;           // "required — {field} cannot be empty"
    invalidEmail: LocalizedString;       // "invalid — enter a valid email address"
    errorSummary: LocalizedString;       // "{count} errors — fix and retry"
  };
  success: {
    validating: LocalizedString;         // "Validating fields..."
    sending: LocalizedString;            // "Sending message..."
    sent: LocalizedString;               // "Message sent successfully!"
    responseTime: LocalizedString;       // "I'll get back to you within 24h"
    meanwhile: LocalizedString;          // "Meanwhile, check out my {work} or {blog}"
    resetLabel: LocalizedString;         // "reset --form"
  };
  socials: readonly { label: string; href: string; icon: string }[];
}
```

- Social links sourced from `siteMeta.links` (already exists in `meta.ts`)
- Availability text can reference `aboutPageContent.cta.availability` or be its own field
- Zero hardcoded strings in component templates

## File Structure

### New Files
```
src/lib/data/contact-page.ts           — ContactContent data
src/lib/data/contact-page.test.ts      — Data layer tests
src/lib/components/ContactPage.svelte   — Full contact page component
src/lib/components/ContactPage.test.ts  — Component tests
src/routes/contact/+page.svelte         — Route shell
```

### Modified Files
```
src/lib/data/types.ts                   — Add ContactContent types
src/lib/data/index.ts                   — Re-export contact-page data
```

## Testing

- Data layer: all `LocalizedString` fields have `en` key, required fields present
- Component: renders `data-testid="page-contact"`, both terminals present, form fields present
- Validation: required fields reject empty, email rejects invalid format
- Success state: shows after submit, displays expected text
- Links: social links are `<a>` with correct `href`

## Out of Scope

- Real form submission backend (cloud infra slice)
- Calendly/Cal.com embed
- reCAPTCHA / spam protection (cloud infra slice)
- Light/dark theme toggle
- i18n beyond English structure

## Visual Reference

Brainstorm mockups: `.superpowers/brainstorm/756-1775604671/content/`
- `02-dual-terminal.html` — Approved layout
- `03-success-state.html` — Success options (chose A + additions)
- `04-validation-errors.html` — Validation options (chose A)
- `05-full-design.html` — Complete design summary
