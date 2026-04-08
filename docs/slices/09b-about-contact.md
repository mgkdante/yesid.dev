# Slice 09b — About + Contact Pages

**Status:** ready
**Priority:** 2
**Estimated effort:** 3-4 sessions
**Depends on:** Slice 09 (services page patterns, StationDivider, metro styling)

## Objective

Build `/about` and `/contact` as two separate routes. About is a full-viewport bento dashboard showcasing professional credibility and personality. Contact is a minimal form page. Both follow the metro/station brand language.

## Context

The home page has an `AboutBento` teaser (4 widgets) that links to `/about` — but `/about` doesn't exist yet. The About page is the trust + personality hub: it converts visitors who want to know "should I hire this person?" The Contact page is the low-friction endpoint for that conversion. Research shows: lead with the visitor's problem (not self-description), use specific outcome testimonials (34% conversion lift), client logos (highest-trust B2B visual), and a named methodology (signals systematic thinking to CTOs).

**Brand note:** The yesid. brand is **Digital Infrastructure** — not just data/SQL. Current focus is data engineering and SQL, but the brand umbrella covers databases, dashboards, pipelines, internal tools, and web systems. All copy should reflect this broader positioning while showcasing current specializations.

## Architecture

### Design Principles

- **Full viewport width** — edge-to-edge like `/services`, no `max-w-5xl` container. Dashboard feel.
- **Data-driven** — all content in `about-page.ts` using `LocalizedString`. Zero hardcoded strings in templates. Cloud-ready: swap placeholder data for real content later with zero component changes.
- **Metro-branded** — station header, hazard stripes, orange metro line in methodology, `JetBrains Mono` for labels/numbers, `#E07800`/`#FFB627` accents.
- **Compact** — About fits in ~1 viewport on desktop (minimal scroll). Contact is a single focused form.

### Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/about` | `AboutPage.svelte` | Full-viewport bento dashboard |
| `/contact` | `ContactPage.svelte` | Name + email + message form + CTA |

## Tech Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger for reveal, tilt action), Vitest + @testing-library/svelte, OpenWeatherMap API (free tier)

## File Structure

### New Files

```
src/lib/data/about-page.ts              — CREATE: AboutContent data (all placeholders, LocalizedString)
src/lib/data/about-page.test.ts          — CREATE: data layer tests
src/lib/components/AboutPage.svelte      — CREATE: full-viewport bento layout
src/lib/components/AboutPage.test.ts     — CREATE: component tests
src/lib/components/AboutIdentity.svelte  — CREATE: headshot + name + value prop widget
src/lib/components/AboutPolaroids.svelte — CREATE: tilted/stacked polaroid gallery widget
src/lib/components/AboutMetrics.svelte   — CREATE: stat counter row widget
src/lib/components/AboutMethod.svelte    — CREATE: methodology metro-line widget
src/lib/components/AboutTestimonials.svelte — CREATE: rotating testimonial carousel widget
src/lib/components/AboutWeather.svelte   — CREATE: live Montreal weather widget
src/lib/components/AboutLogos.svelte     — CREATE: client logo trust strip widget
src/lib/components/ContactPage.svelte    — CREATE: contact form page
src/lib/components/ContactPage.test.ts   — CREATE: contact form tests
src/routes/about/+page.svelte           — CREATE: route shell
src/routes/about/+page.server.ts        — CREATE: server load (weather API fetch)
src/routes/contact/+page.svelte         — CREATE: route shell
```

### Modified Files

```
src/lib/data/types.ts                   — MODIFY: add About + Contact types
src/lib/data/index.ts                   — MODIFY: re-export about-page data
src/lib/data/content.ts                 — MODIFY: add aboutPage CTA content
src/lib/components/Nav.svelte           — MODIFY: add /about and /contact nav links
```

### Reused (no changes needed)

```
src/lib/motion/actions/reveal.ts        — use:reveal for stagger entrance
src/lib/motion/actions/tilt.ts          — use:tilt on bento cards
src/lib/motion/utils/stagger.ts         — stagger delay helper
src/lib/components/StationDivider.svelte — hazard stripe top/bottom
src/lib/components/Footer.svelte        — page footer
src/lib/components/SectionHeader.svelte  — section headings
src/lib/styles/tokens.css               — CSS custom properties
```

---

## Task 1: Data Layer — About Types + Content

**Files:**
- Modify: `src/lib/data/types.ts`
- Create: `src/lib/data/about-page.ts`
- Modify: `src/lib/data/index.ts`
- Create: `src/lib/data/about-page.test.ts`

- [ ] **Step 1: Add types to `types.ts`**

  Add the following types (append after existing types, do not modify existing):

  ```typescript
  // --- About page types ---

  export interface AboutPolaroid {
    src: string;
    alt: LocalizedString;
    caption: LocalizedString;
    rotate: number; // degrees of tilt, -5 to 5
  }

  export interface AboutIdentity {
    name: LocalizedString;
    title: LocalizedString;
    valueProp: LocalizedString;
    headshot: string;
    polaroids: AboutPolaroid[];
  }

  export interface AboutMetric {
    value: string; // "12+" — string for flexible formatting
    label: LocalizedString;
    icon?: string;
  }

  export interface AboutMethodStep {
    id: string;
    label: LocalizedString;
    description: LocalizedString;
    station: number;
  }

  export interface AboutTestimonial {
    quote: LocalizedString;
    author: string;
    role: LocalizedString;
    company: string;
    logo?: string;
  }

  export interface AboutInterest {
    emoji: string;
    label: LocalizedString;
  }

  export interface AboutClientLogo {
    name: string;
    src: string;
    url?: string;
  }

  export interface AboutWeatherConfig {
    city: LocalizedString;
    enabled: boolean;
  }

  export interface AboutCta {
    heading: LocalizedString;
    subtitle: LocalizedString;
    buttonLabel: LocalizedString;
    buttonHref: string;
    availability: LocalizedString;
  }

  export interface AboutContent {
    identity: AboutIdentity;
    metrics: readonly AboutMetric[];
    methodology: readonly AboutMethodStep[];
    testimonials: readonly AboutTestimonial[];
    techStack: readonly string[];
    interests: readonly AboutInterest[];
    weather: AboutWeatherConfig;
    clientLogos: readonly AboutClientLogo[];
    cta: AboutCta;
  }
  ```

- [ ] **Step 2: Create `about-page.ts` with placeholder content**

  All strings wrapped in `LocalizedString`. Placeholder values clearly marked with `[PLACEHOLDER]` prefix so Yesid knows what to replace. Data is `readonly` and `as const` where appropriate.

  ```typescript
  import type { AboutContent } from './types.js';
  import type { LocalizedString } from './types.js';

  export const aboutPageContent: AboutContent = {
    identity: {
      name: { en: 'Yesid O.' },
      title: { en: '[PLACEHOLDER] Freelance Digital Infrastructure Engineer' },
      valueProp: {
        en: '[PLACEHOLDER] I help teams ship reliable digital infrastructure — from databases to dashboards to the pipelines between them.'
      },
      headshot: '/images/about/headshot.webp',
      polaroids: [
        {
          src: '/images/about/polaroid-1.webp',
          alt: { en: '[PLACEHOLDER] Working at my desk' },
          caption: { en: '[PLACEHOLDER] The usual habitat' },
          rotate: -3,
        },
        {
          src: '/images/about/polaroid-2.webp',
          alt: { en: '[PLACEHOLDER] Montreal skyline' },
          caption: { en: '[PLACEHOLDER] Home base' },
          rotate: 4,
        },
      ],
    },
    metrics: [
      { value: 'XX+', label: { en: '[PLACEHOLDER] databases shipped' } },
      { value: 'XX+', label: { en: '[PLACEHOLDER] queries optimized' } },
      { value: 'Xx', label: { en: '[PLACEHOLDER] faster dashboards' } },
      { value: 'XX%', label: { en: '[PLACEHOLDER] uptime maintained' } },
    ],
    methodology: [
      { id: 'audit', station: 1, label: { en: 'AUDIT' }, description: { en: '[PLACEHOLDER] Understand your current data landscape, bottlenecks, and goals.' } },
      { id: 'optimize', station: 2, label: { en: 'OPTIMIZE' }, description: { en: '[PLACEHOLDER] Redesign queries, schemas, and pipelines for speed and reliability.' } },
      { id: 'document', station: 3, label: { en: 'DOCUMENT' }, description: { en: '[PLACEHOLDER] Leave behind runbooks your team can actually follow.' } },
      { id: 'handoff', station: 4, label: { en: 'HANDOFF' }, description: { en: '[PLACEHOLDER] Transfer ownership cleanly. No vendor lock-in.' } },
    ],
    testimonials: [
      {
        quote: { en: '[PLACEHOLDER] "Cut our dashboard load time from 45s to 2s. Yesid rebuilt our entire pipeline in 3 weeks."' },
        author: '[PLACEHOLDER] Jane Doe',
        role: { en: '[PLACEHOLDER] CTO' },
        company: '[PLACEHOLDER] Acme Corp',
      },
      {
        quote: { en: '[PLACEHOLDER] "Finally, a data engineer who documents everything. Our team was self-sufficient within a week of handoff."' },
        author: '[PLACEHOLDER] John Smith',
        role: { en: '[PLACEHOLDER] VP Engineering' },
        company: '[PLACEHOLDER] TechCo',
      },
      {
        quote: { en: '[PLACEHOLDER] "Yesid turned our messy spreadsheet workflows into a real data pipeline. Game changer."' },
        author: '[PLACEHOLDER] Maria Garcia',
        role: { en: '[PLACEHOLDER] Head of Analytics' },
        company: '[PLACEHOLDER] DataStart',
      },
    ],
    techStack: ['PostgreSQL', 'SQL Server', 'Python', 'Power BI', 'Retool', 'SvelteKit', 'Docker'],
    interests: [
      { emoji: '🎌', label: { en: 'Anime' } },
      { emoji: '📊', label: { en: 'Data viz' } },
      { emoji: '🔓', label: { en: 'Open source' } },
      { emoji: '🍁', label: { en: 'Montreal food scene' } },
    ],
    weather: {
      city: { en: 'Montreal' },
      enabled: true,
    },
    clientLogos: [
      { name: '[PLACEHOLDER] Client 1', src: '/images/about/logo-1.svg' },
      { name: '[PLACEHOLDER] Client 2', src: '/images/about/logo-2.svg' },
      { name: '[PLACEHOLDER] Client 3', src: '/images/about/logo-3.svg' },
      { name: '[PLACEHOLDER] Client 4', src: '/images/about/logo-4.svg' },
    ],
    cta: {
      heading: { en: "Let's build something" },
      subtitle: { en: 'Have a data problem? Available for freelance projects and consulting.' },
      buttonLabel: { en: 'Get in touch →' },
      buttonHref: '/contact',
      availability: { en: '[PLACEHOLDER] Currently booking for Q3 2026' },
    },
  };
  ```

- [ ] **Step 3: Re-export from `index.ts`**

  Add: `export { aboutPageContent } from './about-page.js';`

- [ ] **Step 4: Write tests for `about-page.test.ts`**

  Test that:
  - `aboutPageContent` has all required fields
  - All `LocalizedString` fields have an `en` key
  - `metrics` has at least 3 items
  - `methodology` stations are sequential (1, 2, 3, 4)
  - `testimonials` has at least 2 items
  - `techStack` is non-empty
  - `interests` is non-empty
  - `polaroids` each have `rotate` between -5 and 5

- [ ] **Step 5: Run tests**
  Run: `bun run test -- --run src/lib/data/about-page.test.ts`
  Expected: All PASS

**STOP. Ask Yesid to verify before moving to Task 2.**

---

## Task 2: About Identity + Polaroids Widgets

**Files:**
- Create: `src/lib/components/AboutIdentity.svelte`
- Create: `src/lib/components/AboutPolaroids.svelte`

- [ ] **Step 1: Build `AboutIdentity.svelte`**

  Props: `identity: AboutIdentity` (from data layer)

  Layout:
  - Full-width card, `bg-[var(--bg-surface)]`, `border-[var(--border)]`
  - Left: headshot image, rounded, orange border glow (`box-shadow: 0 0 20px rgba(224,120,0,0.3)`), `border-2 border-[var(--brand-primary)]`
  - Right: name in `font-heading text-2xl font-bold`, title in `text-[var(--brand-primary)]`, value prop in `text-[var(--text-secondary)]`
  - `use:reveal` for entrance animation
  - `use:tilt={{ maxDeg: 1, perspective: 800 }}` on the card

- [ ] **Step 2: Build `AboutPolaroids.svelte`**

  Props: `polaroids: AboutPolaroid[]`

  Layout:
  - Container with `position: relative`
  - Each polaroid: white border (8px), slight shadow, `transform: rotate(Xdeg)` from data
  - Stacked with `z-index` offset — overlapping slightly
  - Caption below photo in handwritten-style font (fallback to Inter italic if no custom font)
  - Subtle tape/pin SVG overlay at top of each polaroid
  - `use:reveal` with stagger per polaroid
  - On hover: polaroid lifts slightly (`translateY(-4px)`) and increases `z-index`
  - Mobile: horizontal scroll instead of stacked

- [ ] **Step 3: Run `bun run check`**
  Expected: No type errors

**STOP. Ask Yesid to verify on localhost before moving to Task 3.**

---

## Task 3: Metrics + Methodology Widgets

**Files:**
- Create: `src/lib/components/AboutMetrics.svelte`
- Create: `src/lib/components/AboutMethod.svelte`

- [ ] **Step 1: Build `AboutMetrics.svelte`**

  Props: `metrics: readonly AboutMetric[]`

  Layout:
  - 4-column row, equal width cells, full viewport width
  - Each cell: `bg-[var(--bg-surface)]`, `border-[var(--border)]`
  - Value: `font-mono text-3xl font-bold text-[var(--brand-accent)]` (JetBrains Mono, #FFB627)
  - Label: `font-body text-sm text-[var(--text-secondary)]` (Inter)
  - `use:reveal` with stagger — numbers animate in left to right
  - Optional: GSAP counter animation (0 → target value) on scroll into view
  - Mobile: 2x2 grid

- [ ] **Step 2: Build `AboutMethod.svelte`**

  Props: `steps: readonly AboutMethodStep[]`

  Layout:
  - Vertical metro line on the left: `2px solid var(--brand-primary)` (#E07800)
  - Station dots: `12px` circles, `bg-[var(--brand-primary)]`, positioned on the line
  - Each step: station dot → label in `font-mono text-xs tracking-widest text-[var(--text-muted)]` → description in `text-sm text-[var(--text-secondary)]`
  - Steps connected by the metro line, same visual language as services page
  - `use:reveal` with stagger — each step reveals as the line "builds"
  - Card wrapper: `bg-[var(--bg-surface)]`, `border-[var(--border)]`

- [ ] **Step 3: Run `bun run check`**
  Expected: No type errors

**STOP. Ask Yesid to verify on localhost before moving to Task 4.**

---

## Task 4: Testimonials Carousel + Weather Widget

**Files:**
- Create: `src/lib/components/AboutTestimonials.svelte`
- Create: `src/lib/components/AboutWeather.svelte`
- Create: `src/routes/about/+page.server.ts`

- [ ] **Step 1: Build `AboutTestimonials.svelte`**

  Props: `testimonials: readonly AboutTestimonial[]`

  Layout:
  - Card: `bg-[var(--bg-surface)]`, `border-[var(--border)]`
  - Quote in `text-lg italic text-[var(--text-primary)]` with a large `"` decorative mark in `text-[var(--brand-primary)]`
  - Author line: name bold, role + company in `text-[var(--text-secondary)]`
  - Dot indicators at bottom: active dot = `bg-[var(--brand-primary)]`, inactive = `bg-[var(--bg-elevated)]`
  - Auto-rotate every 6 seconds, pause on hover
  - Crossfade transition between testimonials (GSAP or Svelte transition)
  - `use:tilt={{ maxDeg: 1, perspective: 800 }}`

- [ ] **Step 2: Build `AboutWeather.svelte`**

  Props: `config: AboutWeatherConfig`, `weather?: { temp: number; condition: string; icon: string }` (from server load)

  Layout:
  - Card: `bg-[var(--bg-surface)]`, `border-[var(--border)]`
  - Label: `font-mono text-[10px] tracking-widest text-[var(--text-muted)]` → "WEATHER"
  - City name: `text-base font-semibold text-[var(--text-primary)]`
  - Temperature: `font-mono text-2xl text-[var(--brand-accent)]` (#FFB627)
  - Condition text: `text-sm text-[var(--text-secondary)]`
  - Weather icon: OpenWeatherMap icon URL or custom SVG mapping
  - Fallback: if `weather` prop is undefined, show city + "—" instead of temp

- [ ] **Step 3: Create `+page.server.ts` for weather fetch**

  ```typescript
  // src/routes/about/+page.server.ts
  import { env } from '$env/dynamic/private';
  import { aboutPageContent } from '$lib/data';

  export async function load() {
    let weather = null;

    if (aboutPageContent.weather.enabled && env.OPENWEATHER_API_KEY) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Montreal,CA&units=metric&appid=${env.OPENWEATHER_API_KEY}`
        );
        if (res.ok) {
          const data = await res.json();
          weather = {
            temp: Math.round(data.main.temp),
            condition: data.weather[0]?.description ?? '',
            icon: data.weather[0]?.icon ?? '01d',
          };
        }
      } catch {
        // Silently fall back — widget shows city without temperature
      }
    }

    return { weather };
  }
  ```

  **Env var:** Add `OPENWEATHER_API_KEY` to `.env` (gitignored). On Vercel, set via dashboard.

  **Caching:** SvelteKit's default `load()` runs per request. For production, wrap with a simple TTL cache (e.g., 30-minute in-memory cache) or use Vercel ISR `maxage` header.

- [ ] **Step 4: Run `bun run check`**
  Expected: No type errors

**STOP. Ask Yesid to verify on localhost before moving to Task 5.**

---

## Task 5: Tech Stack + Interests + Logos + CTA Widgets

**Files:**
- Create: `src/lib/components/AboutLogos.svelte`
- Reuse: existing `AboutBento.svelte` patterns for stack/interests styling

- [ ] **Step 1: Tech Stack section (inline in `AboutPage.svelte`)**

  Uses same pill badge pattern as existing `AboutBento.svelte`:
  - Label: `font-mono text-[10px] tracking-widest text-[var(--text-muted)]` → "STACK"
  - Pills: `rounded bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-secondary)]`
  - Card: `bg-[var(--bg-surface)]`, `border-[var(--border)]`

- [ ] **Step 2: Interests section (inline in `AboutPage.svelte`)**

  - Label: `font-mono text-[10px] tracking-widest text-[var(--text-muted)]` → "INTERESTS"
  - Each interest: emoji + label, spaced in a column list
  - Card: `bg-[var(--bg-surface)]`, `border-[var(--border)]`, spans 2 columns

- [ ] **Step 3: Build `AboutLogos.svelte`**

  Props: `logos: readonly AboutClientLogo[]`

  Layout:
  - Card spanning 2 columns
  - Label: "TRUSTED BY" in `font-mono text-[10px] tracking-widest text-[var(--text-muted)]`
  - Logo row: grayscale by default, full color on hover, `opacity-50 hover:opacity-100` transition
  - Placeholder logos: generic company silhouette SVGs
  - `use:reveal`

- [ ] **Step 4: CTA section (inline in `AboutPage.svelte`)**

  - Card spanning 2 columns
  - Heading: `font-heading text-xl font-bold text-[var(--text-primary)]`
  - Subtitle: `text-sm text-[var(--text-secondary)]`
  - Button: `bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]` → links to `/contact`
  - Availability tag: `font-mono text-xs text-[var(--brand-accent)]`

- [ ] **Step 5: Run `bun run check`**
  Expected: No type errors

**STOP. Ask Yesid to verify on localhost before moving to Task 6.**

---

## Task 6: AboutPage Assembly — Full-Viewport Bento Layout

**Files:**
- Create: `src/lib/components/AboutPage.svelte`
- Create: `src/lib/components/AboutPage.test.ts`
- Create: `src/routes/about/+page.svelte`

- [ ] **Step 1: Build `AboutPage.svelte`**

  Props: `weather?: { temp: number; condition: string; icon: string }`

  Full-viewport bento grid:
  ```
  Container: w-full min-h-screen bg-[var(--bg-primary)] px-4 md:px-8

  Metro station header: "ABOUT — STOP 00"
  StationDivider (top)

  Grid: grid-cols-4 gap-3 (desktop), grid-cols-1 (mobile)

  Row 1 (Identity):
    - AboutIdentity (col-span-3)
    - AboutPolaroids (col-span-1, row-span-2)

  Row 2 (Metrics):
    - AboutMetrics (col-span-3) — internal 4-cell row

  Row 3 (Proof):
    - AboutMethod (col-span-2)
    - AboutTestimonials (col-span-2)

  Row 4 (Personality):
    - Tech Stack card (col-span-1)
    - AboutWeather (col-span-1)
    - Interests card (col-span-2)

  Row 5 (Action):
    - AboutLogos (col-span-2)
    - CTA card (col-span-2)

  StationDivider (bottom)
  Footer
  ```

  Responsive breakpoints:
  - `md+` (768px+): 4-column bento grid as above
  - `sm` (< 768px): single column stack (order defined in mobile stack order)

- [ ] **Step 2: Create route shell `+page.svelte`**

  ```svelte
  <script lang="ts">
    import AboutPage from '$lib/components/AboutPage.svelte';
    let { data } = $props();
  </script>

  <svelte:head>
    <title>About — yesid.</title>
    <meta name="description" content="Freelance data engineer based in Montreal. PostgreSQL, SQL Server, Python, Power BI — building data infrastructure for teams that ship." />
  </svelte:head>

  <AboutPage weather={data.weather} />
  ```

- [ ] **Step 3: Write component tests**

  Test that:
  - AboutPage renders with `data-testid="page-about"`
  - All bento sections present: identity, polaroids, metrics, method, testimonials, tech-stack, weather, interests, logos, cta
  - Nav link to `/about` exists
  - CTA links to `/contact`
  - Weather widget shows fallback when no weather data

- [ ] **Step 4: Run tests and check**
  Run: `bun run test -- --run src/lib/components/AboutPage.test.ts` and `bun run check`
  Expected: All PASS

**STOP. Ask Yesid to verify full layout on localhost before moving to Task 7.**

---

## Task 7: Contact Page

**Files:**
- Create: `src/lib/components/ContactPage.svelte`
- Create: `src/lib/components/ContactPage.test.ts`
- Create: `src/routes/contact/+page.svelte`

- [ ] **Step 1: Build `ContactPage.svelte`**

  Full-viewport, same metro branding as About:

  Layout:
  - Metro station header: "CONTACT — NEXT STOP: YOU"
  - StationDivider (top)
  - Two-column (desktop), single-column (mobile):
    - Left: heading + subtitle + availability indicator + social links (GitHub, LinkedIn, email)
    - Right: form with 3 fields:
      - Name: `<input>` with `mock-input` styling
      - Email: `<input type="email">`
      - Message: `<textarea>` (4 rows)
      - Submit button: `bg-[var(--brand-primary)]`, "Send message →"
  - StationDivider (bottom)
  - Footer

  Form behavior:
  - Client-side validation only for now (required fields, email format)
  - On submit: placeholder action (console log or success toast). Real backend comes with cloud infra slice.
  - Data-driven: all labels from `content.ts` as `LocalizedString`

- [ ] **Step 2: Add contact content to `content.ts`**

  ```typescript
  export const contactContent = {
    stationLabel: { en: 'CONTACT — NEXT STOP: YOU' } satisfies LocalizedString,
    heading: { en: "Let's build something" } satisfies LocalizedString,
    subtitle: { en: 'Have a data problem? Available for freelance projects and consulting.' } satisfies LocalizedString,
    availability: { en: '[PLACEHOLDER] Currently booking for Q3 2026' } satisfies LocalizedString,
    form: {
      nameLabel: { en: 'Name' } satisfies LocalizedString,
      namePlaceholder: { en: 'Your name' } satisfies LocalizedString,
      emailLabel: { en: 'Email' } satisfies LocalizedString,
      emailPlaceholder: { en: 'you@company.com' } satisfies LocalizedString,
      messageLabel: { en: 'Message' } satisfies LocalizedString,
      messagePlaceholder: { en: 'Tell me about your project...' } satisfies LocalizedString,
      submitLabel: { en: 'Send message →' } satisfies LocalizedString,
    },
    successMessage: { en: 'Message sent! I\'ll get back to you within 24 hours.' } satisfies LocalizedString,
  } as const;
  ```

- [ ] **Step 3: Create route shell `+page.svelte`**

  ```svelte
  <script lang="ts">
    import ContactPage from '$lib/components/ContactPage.svelte';
  </script>

  <svelte:head>
    <title>Contact — yesid.</title>
    <meta name="description" content="Get in touch for freelance data engineering, SQL development, and infrastructure consulting." />
  </svelte:head>

  <ContactPage />
  ```

- [ ] **Step 4: Write tests**

  Test that:
  - ContactPage renders with `data-testid="page-contact"`
  - Form fields present: name, email, message, submit button
  - Required validation prevents empty submit
  - Email validation rejects invalid format
  - Success state shown after submit

- [ ] **Step 5: Run tests and check**
  Run: `bun run test -- --run src/lib/components/ContactPage.test.ts` and `bun run check`
  Expected: All PASS

**STOP. Ask Yesid to verify contact page on localhost before moving to Task 8.**

---

## Task 8: Nav Update + Integration Polish

**Files:**
- Verify: `src/lib/components/Nav.svelte` (links already exist — About + Contact)
- Verify: `src/lib/components/AboutBento.svelte` ("→ More about me" link)

- [ ] **Step 1: Verify nav links work**

  Nav.svelte already has About (`/about`) and Contact (`/contact`) links in the `links` array. Verify both routes resolve now. No code change needed.

- [ ] **Step 2: Verify AboutBento "more" link**

  The home page `AboutBento.svelte` has a "→ More about me" link pointing to `/about`. Verify it navigates correctly now that the route exists.

- [ ] **Step 3: Full integration test**

  Run: `bun run test` and `bun run check`
  Expected: All PASS, no regressions

**STOP. Ask Yesid for final review of both pages on localhost.**

---

## Execution Order

```
Task 1 (data layer) → no dependencies, pure data
Task 2 (identity + polaroids) → depends on Task 1
Task 3 (metrics + methodology) → depends on Task 1
Task 4 (testimonials + weather) → depends on Task 1
Task 5 (stack + interests + logos + CTA) → depends on Task 1
Task 6 (AboutPage assembly) → depends on Tasks 2-5
Task 7 (Contact page) → depends on Task 1 only (can parallel with 2-5)
Task 8 (nav + polish) → depends on Tasks 6 + 7
```

Tasks 2, 3, 4, 5 can be built in any order after Task 1.

## Out of Scope

- Real form submission backend (comes with cloud infra slice)
- Calendly/Cal.com embed (future enhancement)
- Light/dark theme toggle (global, not this slice)
- Updating existing AboutBento content (home page teaser stays as-is)
- i18n beyond English (structure supports it, content added later)
- Real client logos, testimonials, metrics (placeholders now, replaced when ready)
- Photo assets — Yesid provides placeholder headshot + polaroid images in `static/images/about/`
- Standalone tech stack page (covered by About widget + service detail pages + blog posts)
- Home page rework (Slice 10 — separate slice after this one)

## Acceptance Criteria

- [ ] `/about` renders full-viewport bento dashboard with all 10 widget slots
- [ ] All content sourced from `about-page.ts` via `LocalizedString` — zero hardcoded strings
- [ ] Weather widget fetches live data from OpenWeatherMap (with graceful fallback)
- [ ] Testimonial carousel auto-rotates with dot navigation
- [ ] Polaroids have tilted/stacked look with hover lift effect
- [ ] Methodology uses vertical metro line with station dots
- [ ] Metrics use JetBrains Mono for numbers, brand accent color
- [ ] Metro station headers + StationDivider at top/bottom
- [ ] All brand tokens used (no raw hex in templates)
- [ ] `/contact` renders form with client-side validation
- [ ] Contact form shows success state (placeholder, no real backend)
- [ ] Nav links to `/about` and `/contact` resolve (already in Nav.svelte)
- [ ] Mobile responsive: single-column stack with correct order
- [ ] `bun run test` passes with 80%+ coverage on new files
- [ ] `bun run check` passes with zero type errors
- [ ] `OPENWEATHER_API_KEY` in `.env` (gitignored), never in source code
- [ ] `docs/TESTS.md` updated with new test entries under correct categories
- [ ] `docs/ARCHITECTURE.md` updated with new routes and components

## Learn

### Bento Grid Layout
**What it is:** A dashboard-style grid where cells span different column/row counts, creating visual hierarchy through size variation rather than just position.
**Why it matters:** Unlike uniform grids, bento grids let important content (identity, methodology) take up more space while supporting info (weather, interests) stays compact — all in one viewport.
**Try this:** In `AboutPage.svelte`, change `grid-cols-4` to `grid-cols-3` and see how the layout reflows. Notice how `col-span-*` classes control widget sizing.
**Go deeper:** https://css-tricks.com/introduction-to-css-grid-layout/

### Server-Side Data Fetching in SvelteKit
**What it is:** `+page.server.ts` runs on the server only. It can access private env vars (API keys) and fetch external data before the page renders.
**Why it matters:** The weather widget needs an API key that must never reach the browser. Server load functions keep secrets on the server while passing only the result to the component.
**Try this:** In `+page.server.ts`, add `console.log('Loading weather...')` and notice it only appears in the terminal, never in the browser console.
**Go deeper:** https://kit.svelte.dev/docs/load#page-data

### Social Proof Psychology
**What it is:** People trust decisions others have already validated. Testimonials, client logos, and metrics are all forms of social proof.
**Why it matters:** For a freelance consultant, the About page IS the sales page. Every widget should reduce the visitor's perceived risk of hiring you.
**Try this:** Remove the testimonials section temporarily and notice how the page feels less convincing — that's the social proof gap.
**Go deeper:** https://cxl.com/blog/cialdinis-principles-persuasion/

## Verify

1. Open `http://localhost:5173/about` — full-viewport bento grid visible, all widgets populated
2. Open `http://localhost:5173/contact` — form renders, validation works, success state shows
3. Resize browser to mobile width — layout stacks to single column correctly
4. Check weather widget — shows temperature if API key set, shows fallback if not
5. Watch testimonial carousel — auto-rotates, pauses on hover
6. Hover polaroids — lift + z-index change
7. Click "Get in touch →" on About page — navigates to `/contact`
8. Navigate via nav bar — About and Contact links work
9. Run `bun run test` — all pass, 80%+ coverage
10. Run `bun run check` — zero errors
