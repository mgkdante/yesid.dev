# Slice 13g — Services Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HomeServices component (Section 4 of the home page) — a benefit-led, Carnegie-informed 3×2 services grid with MR-73 blueprint background and SVG morph hover interactions.

**Architecture:** New `HomeServices.svelte` component driven entirely by `getVisibleServices()` from the data layer. Two new fields (`benefitHeadline`, `impactMetric`) added to the `Service` type. Blueprint background is CSS layers + inline SVG. Entrance animation via GSAP ScrollTrigger. SVG icons morph on hover/tap via MorphSVGPlugin.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, GSAP (ScrollTrigger, MorphSVGPlugin), Tailwind v4, Vitest + @testing-library/svelte, Bun

**Design spec:** `docs/specs/2026-04-10-services-grid-design.md`
**Approved mockup:** `docs/archive/mockups/slice-13g-services-grid.html`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/data/types.ts` | Modify | Add `benefitHeadline` and `impactMetric` to `Service` interface |
| `src/lib/data/services.ts` | Modify | Populate new fields for all 6 services |
| `src/lib/data/content.test.ts` | Modify | Add data integrity tests for new fields |
| `src/lib/components/HomeServices.svelte` | Create | Services grid component |
| `src/lib/components/HomeServices.test.ts` | Create | Component tests |
| `src/routes/+page.svelte` | Modify | Import + render HomeServices after ProofReel |
| `src/routes/home.test.ts` | Modify | Add HomeServices integration tests |
| `docs/reference/TESTS.md` | Modify | Add HomeServices test entries |

---

### Task 1: Extend Service Type with New Fields

**Files:**
- Modify: `src/lib/data/types.ts:78-117` (Service interface)

- [ ] **Step 1: Add `benefitHeadline` and `impactMetric` to the Service interface**

In `src/lib/data/types.ts`, add the two new fields at the end of the Service interface, before the closing brace. Both are optional for backward compatibility with any code that constructs partial Service objects:

```typescript
// After the existing `sections?: ServiceSection[];` field (around line 116):

// --- Home page Services Grid fields (Slice 13g) ---
// Visitor-facing outcome displayed above the service title on the home grid.
// Carnegie principle: lead with what the visitor gets, not what you do.
benefitHeadline?: LocalizedString;
// One proof point per service for the home grid.
// value: display string ("3x faster"), label: context ("avg query improvement").
impactMetric?: { value: LocalizedString; label: LocalizedString };
```

- [ ] **Step 2: Run type check to verify no breakage**

Run: `bun run check`
Expected: PASS — fields are optional, no existing code breaks.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/types.ts
git commit -m "feat(slice-13g): add benefitHeadline and impactMetric to Service type"
```

---

### Task 2: Populate Benefit Headlines and Metrics for All 6 Services

**Files:**
- Modify: `src/lib/data/services.ts`

- [ ] **Step 1: Add `benefitHeadline` and `impactMetric` to each service**

Add these two fields to each service object in the `services` array. Place them after `visible` and before `relatedProjects` for consistent ordering.

**sql-development:**
```typescript
benefitHeadline: { en: 'Queries that run in seconds, not minutes' },
impactMetric: {
  value: { en: '3x faster' },
  label: { en: 'avg query improvement' },
},
```

**data-pipeline:**
```typescript
benefitHeadline: { en: 'Your data arrives clean, on time, every morning' },
impactMetric: {
  value: { en: '99.9%' },
  label: { en: 'pipeline uptime' },
},
```

**analytics-reporting:**
```typescript
benefitHeadline: { en: 'Decisions in 15 minutes, not 2 days' },
impactMetric: {
  value: { en: '2d → 15m' },
  label: { en: 'reporting turnaround' },
},
```

**database-engineering:**
```typescript
benefitHeadline: { en: 'Zero-downtime migrations while you sleep' },
impactMetric: {
  value: { en: '500GB+' },
  label: { en: 'migrated safely' },
},
```

**internal-tooling:**
```typescript
benefitHeadline: { en: 'Your team stops copying between spreadsheets' },
impactMetric: {
  value: { en: '80%' },
  label: { en: 'less manual data entry' },
},
```

**web-development:**
```typescript
benefitHeadline: { en: 'A frontend that matches your backend quality' },
impactMetric: {
  value: { en: '100' },
  label: { en: 'Lighthouse performance' },
},
```

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/services.ts
git commit -m "feat(slice-13g): add benefit headlines and impact metrics to all 6 services"
```

---

### Task 3: Data Integrity Tests for New Fields

**Files:**
- Modify: `src/lib/data/content.test.ts`

- [ ] **Step 1: Write failing tests for benefitHeadline and impactMetric**

Add a new `describe` block at the end of `content.test.ts`:

```typescript
import { services, getVisibleServices } from './services.js';

describe('services — home grid fields (Slice 13g)', () => {
  it('every visible service has a benefitHeadline', () => {
    for (const service of getVisibleServices()) {
      expect(service.benefitHeadline, `${service.id} missing benefitHeadline`).toBeDefined();
      expect(service.benefitHeadline!.en.length, `${service.id} benefitHeadline is empty`).toBeGreaterThan(0);
    }
  });

  it('every visible service has an impactMetric with value and label', () => {
    for (const service of getVisibleServices()) {
      expect(service.impactMetric, `${service.id} missing impactMetric`).toBeDefined();
      expect(service.impactMetric!.value.en.length, `${service.id} metric value is empty`).toBeGreaterThan(0);
      expect(service.impactMetric!.label.en.length, `${service.id} metric label is empty`).toBeGreaterThan(0);
    }
  });

  it('every visible service has an svg filename', () => {
    for (const service of getVisibleServices()) {
      expect(service.svg, `${service.id} missing svg`).toBeDefined();
      expect(service.svg!.length, `${service.id} svg is empty`).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they pass (data was added in Task 2)**

Run: `bun run test -- src/lib/data/content.test.ts`
Expected: All new tests PASS (data already populated).

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/content.test.ts
git commit -m "test(slice-13g): add data integrity tests for service benefit headlines and metrics"
```

---

### Task 4: Create HomeServices Component — Structure + Cards

**Files:**
- Create: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1: Create the component with section structure, blueprint background, and card grid**

Create `src/lib/components/HomeServices.svelte`:

```svelte
<!--
  HomeServices — Section 4: Benefit-led services grid.
  3×2 grid on desktop, 2×3 tablet, 1×6 mobile.
  Blueprint background with MR-73 train technical drawing.
  Carnegie-informed: benefit text leads, service title is the visual star.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { getVisibleServices, resolveLocale } from '$lib/data/index.js';
  import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
  import { prefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

  const services = getVisibleServices();

  let sectionEl: HTMLElement | undefined = $state(undefined);

  // Mobile tap toggle: track which card SVG is morphed (-1 = none)
  let activeMorphIndex = $state(-1);

  function handleCardTap(index: number) {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      activeMorphIndex = activeMorphIndex === index ? -1 : index;
    }
  }

  onMount(() => {
    if (!browser || !sectionEl) return;
    if ($prefersReducedMotion) return;

    registerGsapPlugins();

    const label = sectionEl.querySelector('[data-services-label]');
    const cards = sectionEl.querySelectorAll('[data-services-card]');
    const viewall = sectionEl.querySelector('[data-services-viewall]');

    gsap.set(label, { opacity: 0 });
    gsap.set(cards, { opacity: 0, y: 30 });
    gsap.set(viewall, { opacity: 0 });

    ScrollTrigger.create({
      trigger: sectionEl,
      start: 'top bottom-=50',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        tl.to(label, { opacity: 1, duration: 0.3 });
        tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, '-=0.1');
        tl.to(viewall, { opacity: 1, duration: 0.3 }, '-=0.2');
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === sectionEl) st.kill();
      });
      gsap.set([label, ...cards, viewall], { clearProps: 'all' });
    };
  });
</script>

<section
  bind:this={sectionEl}
  data-testid="services-section"
  class="services-section relative overflow-hidden"
>
  <!-- Blueprint background layers -->
  <div class="blueprint-bg absolute inset-0 z-0" aria-hidden="true">
    <div class="blueprint-major absolute inset-0"></div>
    <div class="blueprint-minor absolute inset-0"></div>
    <div class="blueprint-dots absolute inset-0"></div>
    <div class="blueprint-glow absolute inset-0"></div>
    <!-- MR-73 train technical drawing — see Task 5 -->
    <!-- Edge detail panels — see Task 5 -->
    <!-- Corner crosshairs -->
    <div class="crosshair" style="top:24px;left:24px;"></div>
    <div class="crosshair" style="top:24px;right:24px;"></div>
    <div class="crosshair" style="bottom:24px;left:24px;"></div>
    <div class="crosshair" style="bottom:24px;right:24px;"></div>
    <!-- Reference labels -->
    <span class="ref-label" style="top:16px;right:56px;">SEC-04 / SERVICES</span>
    <span class="ref-label" style="bottom:16px;left:56px;">DWG: MR73-SIDE-ELEV</span>
    <span class="ref-label" style="bottom:16px;right:56px;">SCALE 1:48 | REV.B</span>
    <span class="ref-label" style="top:16px;left:56px;">STM / BOMBARDIER</span>
  </div>

  <!-- Content -->
  <div class="relative z-10">
    <!-- Section label -->
    <div
      data-testid="services-label"
      data-services-label
      class="mb-10 font-mono text-xs tracking-[3px] uppercase md:mb-12"
      style="color: var(--text-muted, #666666);"
    >
      Services
    </div>

    <!-- 3×2 grid -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each services as service, i}
        {@const benefit = service.benefitHeadline ? resolveLocale(service.benefitHeadline, 'en') : ''}
        {@const title = resolveLocale(service.title, 'en')}
        {@const metricValue = service.impactMetric ? resolveLocale(service.impactMetric.value, 'en') : ''}
        {@const metricLabel = service.impactMetric ? resolveLocale(service.impactMetric.label, 'en') : ''}
        <a
          href="/services/{service.id}"
          data-testid="services-card"
          data-services-card
          class="services-card group flex rounded-xl transition-all duration-300"
          onclick={() => handleCardTap(i)}
        >
          <div class="card-inner flex gap-5 w-full">
            <!-- SVG panel -->
            <div
              data-testid="services-svg-panel"
              class="svg-panel flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300"
            >
              <img
                src="/svg/services/{service.svg}"
                alt=""
                width="40"
                height="40"
                class="pointer-events-none"
              />
            </div>

            <!-- Card text -->
            <div class="flex flex-col gap-1.5 min-w-0 flex-1">
              {#if benefit}
                <div
                  data-testid="services-benefit"
                  class="text-[17px] font-medium leading-snug"
                  style="color: var(--text-primary, #F5F5F0);"
                >{benefit}</div>
              {/if}
              <div
                data-testid="services-title"
                class="services-title font-extrabold leading-none tracking-tight"
                style="color: var(--brand-accent, #FFB627);"
              >{title}</div>
              {#if metricValue}
                <div class="mt-2 flex items-baseline gap-2" data-testid="services-metric">
                  <span
                    class="font-mono text-2xl font-bold"
                    style="color: var(--brand-primary, #E07800);"
                  >{metricValue}</span>
                  <span
                    class="text-[13px]"
                    style="color: var(--text-secondary, #999999);"
                  >{metricLabel}</span>
                </div>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>

    <!-- View all link -->
    <div
      data-testid="services-viewall"
      data-services-viewall
      class="mt-12 text-center"
    >
      <a
        href="/services"
        class="view-all-link font-medium text-[15px] tracking-wide transition-colors duration-200 border-b pb-0.5"
        style="color: var(--text-secondary, #999999); border-color: var(--border, #3A3A3A);"
      >View all services →</a>
    </div>
  </div>
</section>

<style>
  .services-section {
    padding: 80px 16px;
    background: var(--bg-primary, #141414);
  }

  @media (min-width: 768px) {
    .services-section {
      padding: 100px 24px;
    }
  }

  @media (min-width: 1024px) {
    .services-section {
      padding: 140px 32px;
    }
  }

  /* Card */
  .services-card {
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(224, 120, 0, 0.15);
    padding: 24px;
    text-decoration: none;
    backdrop-filter: blur(6px);
  }

  .services-card:hover {
    border-color: rgba(224, 120, 0, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(224, 120, 0, 0.08);
  }

  /* Service title — responsive via clamp */
  .services-title {
    font-size: clamp(1.75rem, 3vw, 2.5rem); /* 28px → 40px */
    letter-spacing: -0.025em;
  }

  /* SVG panel */
  .svg-panel {
    width: 70px;
    min-width: 70px;
    align-self: stretch;
    background: var(--bg-surface, #1E1E1E);
    border: 1px solid var(--border, #3A3A3A);
  }

  @media (min-width: 1024px) {
    .svg-panel {
      width: 80px;
      min-width: 80px;
    }
  }

  .services-card:hover .svg-panel {
    background: var(--bg-elevated, #2A2A2A);
    border-color: rgba(224, 120, 0, 0.3);
  }

  /* View all link hover */
  .view-all-link:hover {
    color: var(--brand-primary, #E07800) !important;
    border-color: var(--brand-primary, #E07800) !important;
  }

  /* ── Blueprint background ── */
  .blueprint-major {
    background-image:
      repeating-linear-gradient(90deg, rgba(224,120,0,0.08) 0px, rgba(224,120,0,0.08) 1px, transparent 1px, transparent 160px),
      repeating-linear-gradient(0deg, rgba(224,120,0,0.08) 0px, rgba(224,120,0,0.08) 1px, transparent 1px, transparent 160px);
  }

  .blueprint-minor {
    background-image:
      repeating-linear-gradient(90deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 40px),
      repeating-linear-gradient(0deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 40px);
  }

  .blueprint-dots {
    background-image:
      radial-gradient(circle 3px at 160px 160px, rgba(224,120,0,0.16) 0%, transparent 4px),
      radial-gradient(circle 2.5px at 320px 160px, rgba(224,120,0,0.12) 0%, transparent 4px),
      radial-gradient(circle 2.5px at 160px 320px, rgba(224,120,0,0.12) 0%, transparent 4px),
      radial-gradient(circle 3px at 320px 320px, rgba(224,120,0,0.14) 0%, transparent 4px);
    background-size: 640px 480px;
  }

  .blueprint-glow {
    background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(224,120,0,0.04) 0%, transparent 70%);
  }

  .crosshair {
    position: absolute;
    width: 32px;
    height: 32px;
  }
  .crosshair::before {
    content: '';
    position: absolute;
    width: 32px;
    height: 1px;
    background: rgba(224, 120, 0, 0.15);
    top: 50%;
  }
  .crosshair::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 32px;
    background: rgba(224, 120, 0, 0.15);
    left: 50%;
  }

  .ref-label {
    position: absolute;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 10px;
    color: rgba(224, 120, 0, 0.2);
    letter-spacing: 1.5px;
    z-index: 0;
  }

  /* Hide blueprint details on smaller screens */
  @media (max-width: 1023px) {
    .ref-label,
    .crosshair {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/HomeServices.svelte
git commit -m "feat(slice-13g): create HomeServices component — card grid + blueprint background"
```

---

### Task 5: Add MR-73 Train Blueprint SVG + Edge Detail Panels

**Files:**
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1: Add the MR-73 side elevation SVG and edge detail SVGs to the blueprint-bg div**

This is a large SVG insertion into the blueprint background. Copy the train SVG and edge detail SVGs from the approved mockup at `docs/archive/mockups/slice-13g-services-grid.html` — specifically the contents of the `.train-blueprint-full` div and the `.edge-details` div. Insert them inside the `blueprint-bg` div in `HomeServices.svelte`, after the existing grid layers and before the crosshairs.

Add these wrapper elements and CSS:

In the template, inside `<div class="blueprint-bg ...">`, after the glow div:

```svelte
<!-- MR-73 side elevation — full-page train blueprint -->
<div class="train-svg absolute inset-x-[2%] top-[30px] bottom-[30px] z-0 opacity-[0.07]" aria-hidden="true">
  <!-- Paste the full <svg viewBox="0 0 1800 700"> from the mockup here -->
</div>

<!-- Edge detail panels -->
<div class="edge-details absolute inset-0 z-0 opacity-[0.08] overflow-hidden" aria-hidden="true">
  <!-- Paste all 6 edge SVGs from the mockup here -->
</div>
```

Add to the `<style>` block:

```css
.train-svg svg {
  width: 100%;
  height: 100%;
}

.edge-details svg {
  position: absolute;
}

/* Hide train and edge details on smaller screens */
@media (max-width: 767px) {
  .train-svg {
    display: none;
  }
}

@media (max-width: 1023px) {
  .edge-details {
    display: none;
  }
}
```

- [ ] **Step 2: Verify visually in browser**

Run: `bun run dev`
Navigate to `http://localhost:5173/` and scroll to the services section. The MR-73 blueprint should be visible behind the cards. Edge details should appear at each corner/edge on desktop.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/HomeServices.svelte
git commit -m "feat(slice-13g): add MR-73 train blueprint SVG + edge detail panels to background"
```

---

### Task 6: Component Tests for HomeServices

**Files:**
- Create: `src/lib/components/HomeServices.test.ts`

- [ ] **Step 1: Write component tests**

Create `src/lib/components/HomeServices.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HomeServices from './HomeServices.svelte';

describe('HomeServices', () => {
  it('renders the section with correct testid', () => {
    render(HomeServices);
    expect(screen.getByTestId('services-section')).toBeInTheDocument();
  });

  it('renders the section label', () => {
    render(HomeServices);
    expect(screen.getByTestId('services-label')).toBeInTheDocument();
    expect(screen.getByTestId('services-label').textContent).toContain('Services');
  });

  it('renders 6 service cards', () => {
    render(HomeServices);
    const cards = screen.getAllByTestId('services-card');
    expect(cards).toHaveLength(6);
  });

  it('renders benefit headlines for all cards', () => {
    render(HomeServices);
    const benefits = screen.getAllByTestId('services-benefit');
    expect(benefits).toHaveLength(6);
    expect(benefits[0].textContent).toContain('Queries that run in seconds');
  });

  it('renders service titles', () => {
    render(HomeServices);
    const titles = screen.getAllByTestId('services-title');
    expect(titles).toHaveLength(6);
    expect(titles[0].textContent).toContain('SQL Development');
  });

  it('renders impact metrics', () => {
    render(HomeServices);
    const metrics = screen.getAllByTestId('services-metric');
    expect(metrics).toHaveLength(6);
    expect(metrics[0].textContent).toContain('3x faster');
  });

  it('renders SVG panels for each card', () => {
    render(HomeServices);
    const panels = screen.getAllByTestId('services-svg-panel');
    expect(panels).toHaveLength(6);
  });

  it('cards link to /services/[id]', () => {
    render(HomeServices);
    const cards = screen.getAllByTestId('services-card');
    expect(cards[0].getAttribute('href')).toBe('/services/sql-development');
    expect(cards[1].getAttribute('href')).toBe('/services/data-pipeline');
    expect(cards[2].getAttribute('href')).toBe('/services/analytics-reporting');
    expect(cards[3].getAttribute('href')).toBe('/services/database-engineering');
    expect(cards[4].getAttribute('href')).toBe('/services/internal-tooling');
    expect(cards[5].getAttribute('href')).toBe('/services/web-development');
  });

  it('renders view-all link to /services', () => {
    render(HomeServices);
    const link = screen.getByTestId('services-viewall');
    expect(link).toBeInTheDocument();
    const anchor = link.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/services');
    expect(anchor?.textContent).toContain('View all services');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `bun run test -- src/lib/components/HomeServices.test.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/HomeServices.test.ts
git commit -m "test(slice-13g): add HomeServices component tests"
```

---

### Task 7: Integrate HomeServices into the Home Page

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Import HomeServices and render it after ProofReel with hard cuts**

In `src/routes/+page.svelte`, add the import:

```typescript
import HomeServices from '$lib/components/HomeServices.svelte';
```

After the `<ProofReel />` component, add:

```svelte
<!-- Hard cut: yellow/black dashed line -->
<div
  class="h-1 w-full"
  style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
></div>

<!-- Section 4: Services Grid (benefit-led, blueprint background) -->
<HomeServices />

<!-- Hard cut: yellow/black dashed line -->
<div
  class="h-1 w-full"
  style="background: repeating-linear-gradient(90deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);"
></div>

<!-- Sections 5-7 added in sub-slices 13h-13i -->
```

Remove the old comment `<!-- Sections 4-7 added in sub-slices 13g-13i -->`.

- [ ] **Step 2: Run type check + tests**

Run: `bun run check && bun run test`
Expected: Both PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat(slice-13g): integrate HomeServices into home page after ProofReel"
```

---

### Task 8: Update Home Page Integration Tests

**Files:**
- Modify: `src/routes/home.test.ts`

- [ ] **Step 1: Add HomeServices tests to home.test.ts**

Add these tests at the end of the existing `describe('Home page', ...)` block:

```typescript
it('renders the services section', () => {
  render(Page);
  expect(screen.getByTestId('services-section')).toBeInTheDocument();
});

it('renders 6 service cards', () => {
  render(Page);
  const cards = screen.getAllByTestId('services-card');
  expect(cards).toHaveLength(6);
});

it('renders service benefit headlines', () => {
  render(Page);
  const benefits = screen.getAllByTestId('services-benefit');
  expect(benefits).toHaveLength(6);
});
```

- [ ] **Step 2: Run tests**

Run: `bun run test -- src/routes/home.test.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/home.test.ts
git commit -m "test(slice-13g): add services section to home page integration tests"
```

---

### Task 9: SVG Morph Hover/Tap Interaction

**Files:**
- Modify: `src/lib/components/HomeServices.svelte`

- [ ] **Step 1: Add MorphSVGPlugin-based hover/tap interaction for SVG icons**

This task adds the SVG morph effect on card hover (desktop) and tap toggle (mobile). The implementation depends on the path structure inside each service SVG file. During implementation:

1. Inspect each SVG in `static/svg/services/` to identify the primary `<path>` elements
2. Define morph target shapes (organic/natural versions of each geometric icon)
3. Inline the SVGs (instead of `<img>`) so GSAP can access the DOM paths
4. On hover/mouseenter: `gsap.to(path, { morphSVG: targetShape, duration: 0.4, ease: 'power2.inOut' })`
5. On mouseleave: reverse to original path
6. On mobile tap: toggle between original and morphed state using the `activeMorphIndex` state

The `<img>` tags for service SVGs need to be replaced with inline `<svg>` elements that are fetched or imported at build time. Use `{@html svgContent}` with the SVG contents loaded from the existing `fetchServiceSvgContents()` utility in `src/lib/data/serviceSvg.ts`.

- [ ] **Step 2: Test morph visually**

Run: `bun run dev`
Hover over each card on desktop — SVG should morph smoothly.
On mobile viewport: tap card → morph, tap again → reverse.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/HomeServices.svelte
git commit -m "feat(slice-13g): add SVG morph hover/tap interaction with MorphSVGPlugin"
```

---

### Task 10: Update docs/reference/TESTS.md

**Files:**
- Modify: `docs/reference/TESTS.md`

- [ ] **Step 1: Add HomeServices test entries**

Add under the **Components** section:

```markdown
### HomeServices (Slice 13g)
| Test | File | What it verifies |
|------|------|-----------------|
| renders section | `HomeServices.test.ts` | Section element with testid |
| renders label | `HomeServices.test.ts` | "Services" section label |
| renders 6 cards | `HomeServices.test.ts` | Dynamic card count matches visible services |
| renders benefits | `HomeServices.test.ts` | Benefit headlines present on all cards |
| renders titles | `HomeServices.test.ts` | Service titles rendered |
| renders metrics | `HomeServices.test.ts` | Impact metrics with value + label |
| renders SVG panels | `HomeServices.test.ts` | SVG panel containers present |
| cards link correctly | `HomeServices.test.ts` | Each card links to /services/[id] |
| view-all link | `HomeServices.test.ts` | "View all services" links to /services |
```

Add under the **Data Layer** section:

```markdown
### Services Home Grid Fields (Slice 13g)
| Test | File | What it verifies |
|------|------|-----------------|
| benefitHeadline present | `content.test.ts` | All visible services have non-empty benefitHeadline |
| impactMetric present | `content.test.ts` | All visible services have impactMetric with value + label |
| svg present | `content.test.ts` | All visible services have svg filename |
```

- [ ] **Step 2: Commit**

```bash
git add docs/reference/TESTS.md
git commit -m "docs(slice-13g): add HomeServices tests to TESTS.md"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests PASS

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 3: Visual verification at all breakpoints**

Run: `bun run dev`
Check at:
- 1440px desktop: 3×2 grid, blueprint visible, train SVG visible, edge details visible
- 768px tablet: 2×3 grid, train SVG visible, edge details hidden
- 375px mobile: 1×6 stacked, train SVG hidden, blueprint grid lines visible

- [ ] **Step 4: Print test table**

```
| Test File | Test Name | Status | Failure Reason |
|-----------|-----------|--------|----------------|
```
