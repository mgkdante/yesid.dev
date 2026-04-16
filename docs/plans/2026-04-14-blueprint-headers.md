# Blueprint Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace blog/projects listing headers with Da Vincian layered blueprint SVG walls, and swap the vertical hazard stripe for a thin accent line.

**Architecture:** Individual SVG Svelte components (`currentColor`, `fill="none"`) composed into `BlogBlueprint` and `ProjectsBlueprint` containers following the proven `ServicesBlueprint` pattern. Blog layout already has the thin accent line. Projects layout created fresh with the same grid pattern.

**Tech Stack:** SvelteKit, Svelte 5, Tailwind v4, inline SVG paths via Svelte components

**Spec:** `docs/specs/2026-04-14-blueprint-headers-design.md`

---

## File Map

### New SVG Components (`src/lib/components/svg/`)

| File | Responsibility |
|------|---------------|
| `BlueprintBridge.svelte` | Arch bridge elevation — cross-bracing, dimension lines, rail lines |
| `BlueprintTrackPlan.svelte` | Track turnout — double track, switch, platform, sleepers |
| `BlueprintCatenary.svelte` | 25kV overhead wire — poles, contact wire, messenger, droppers |
| `BlueprintSignal.svelte` | Two-aspect signal — R/V lights, pole, reference label |
| `BlueprintStationSection.svelte` | Tunnel arch cross-section — dual platforms, invert, dimension |

### New Composition Components

| File | Responsibility |
|------|---------------|
| `src/lib/components/blog/BlogBlueprint.svelte` | Positions 6 transit SVGs with absolute placement, vignette, crosshairs, ref labels |
| `src/lib/components/projects/ProjectsBlueprint.svelte` | Positions 6 tunneling SVGs with absolute placement, vignette, crosshairs, ref labels |

### New SVG Components — Projects (`src/lib/components/svg/`)

| File | Responsibility |
|------|---------------|
| `BlueprintTBM.svelte` | TBM side elevation — cutterhead, shield, thrust cylinders, screw conveyor, voussoirs |
| `BlueprintTunnelSection.svelte` | Tunnel cross-section — lining segments K-A-B-C-D-E, diameter |
| `BlueprintErector.svelte` | Segment erector arm — pivot, grab, arc guide |
| `BlueprintGeology.svelte` | Geological strata bands — argile, calcaire, roche mère |
| `BlueprintVentShaft.svelte` | Ventilation shaft — fan housing, lining marks |
| `BlueprintGroutInjection.svelte` | Grout injection — nozzle, spray, pressure gauge |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/components/blog/BlogListingPage.svelte` | Replace header SectionWrapper content (heading + SVG icon → BlogBlueprint) |
| `src/lib/components/projects/ProjectListingPage.svelte` | Replace header section with ProjectsBlueprint + add SectionWrapper wiring |
| `src/routes/projects/+layout.svelte` | **Create** — EdgeRail "Projects." + accent line grid (matches blog layout) |
| `src/routes/projects/+page.svelte` | No changes needed |
| `src/routes/blog/+layout.svelte` | Already updated (thin accent line) — update comment only |

---

## Task 1: Blog Blueprint SVGs — Bridge + Track Plan

**Files:**
- Create: `src/lib/components/svg/BlueprintBridge.svelte`
- Create: `src/lib/components/svg/BlueprintTrackPlan.svelte`

- [ ] **Step 1: Create BlueprintBridge.svelte**

Follow the exact pattern from `BlueprintDetailBogie.svelte` — script with `class` + spread props, SVG with `currentColor`, `fill="none"`.

```svelte
<script lang="ts">
	let { class: className = '', ...rest }: { class?: string; style?: string; [key: string]: unknown } = $props();
</script>

<svg class={className} {...rest} viewBox="0 0 1000 250" fill="none" xmlns="http://www.w3.org/2000/svg">
	<!-- Title block -->
	<text x="15" y="18" font-family="JetBrains Mono" font-size="7" fill="currentColor">ÉLÉVATION — PONT-RAIL TYPE PR-4</text>

	<!-- Deck -->
	<line x1="30" y1="210" x2="970" y2="210" stroke="currentColor" stroke-width="1.5"/>
	<line x1="30" y1="215" x2="970" y2="215" stroke="currentColor" stroke-width="0.5"/>

	<!-- Arch span 1 -->
	<path d="M 40 210 Q 250 15 500 210" stroke="currentColor" stroke-width="1"/>
	<!-- Arch span 2 -->
	<path d="M 500 210 Q 750 15 960 210" stroke="currentColor" stroke-width="1"/>

	<!-- Vertical supports -->
	<line x1="150" y1="210" x2="150" y2="85" stroke="currentColor" stroke-width="0.6"/>
	<line x1="250" y1="210" x2="250" y2="35" stroke="currentColor" stroke-width="0.6"/>
	<line x1="350" y1="210" x2="350" y2="20" stroke="currentColor" stroke-width="0.6"/>
	<line x1="500" y1="210" x2="500" y2="22" stroke="currentColor" stroke-width="0.6"/>
	<line x1="650" y1="210" x2="650" y2="20" stroke="currentColor" stroke-width="0.6"/>
	<line x1="750" y1="210" x2="750" y2="35" stroke="currentColor" stroke-width="0.6"/>
	<line x1="850" y1="210" x2="850" y2="85" stroke="currentColor" stroke-width="0.6"/>

	<!-- Cross-bracing -->
	<line x1="150" y1="210" x2="250" y2="35" stroke="currentColor" stroke-width="0.3"/>
	<line x1="250" y1="210" x2="350" y2="20" stroke="currentColor" stroke-width="0.3"/>
	<line x1="350" y1="210" x2="250" y2="35" stroke="currentColor" stroke-width="0.3"/>
	<line x1="500" y1="210" x2="650" y2="20" stroke="currentColor" stroke-width="0.3"/>
	<line x1="650" y1="210" x2="750" y2="35" stroke="currentColor" stroke-width="0.3"/>
	<line x1="750" y1="210" x2="850" y2="85" stroke="currentColor" stroke-width="0.3"/>

	<!-- Rail lines on deck -->
	<line x1="30" y1="206" x2="970" y2="206" stroke="currentColor" stroke-width="0.4" stroke-dasharray="4 4"/>
	<line x1="30" y1="203" x2="970" y2="203" stroke="currentColor" stroke-width="0.4" stroke-dasharray="4 4"/>

	<!-- Reference marks -->
	<circle cx="250" cy="35" r="3" stroke="currentColor" stroke-width="0.5"/>
	<circle cx="750" cy="35" r="3" stroke="currentColor" stroke-width="0.5"/>
	<text x="260" y="30" font-family="JetBrains Mono" font-size="5" fill="currentColor">SPT-A1</text>
	<text x="760" y="30" font-family="JetBrains Mono" font-size="5" fill="currentColor">SPT-A2</text>

	<!-- Dimension lines -->
	<line x1="40" y1="235" x2="500" y2="235" stroke="currentColor" stroke-width="0.3" stroke-dasharray="2 3"/>
	<line x1="500" y1="235" x2="960" y2="235" stroke="currentColor" stroke-width="0.3" stroke-dasharray="2 3"/>
	<text x="260" y="244" font-family="JetBrains Mono" font-size="5" fill="currentColor" text-anchor="middle">460.0m</text>
	<text x="730" y="244" font-family="JetBrains Mono" font-size="5" fill="currentColor" text-anchor="middle">460.0m</text>
</svg>
```

- [ ] **Step 2: Create BlueprintTrackPlan.svelte**

```svelte
<script lang="ts">
	let { class: className = '', ...rest }: { class?: string; style?: string; [key: string]: unknown } = $props();
</script>

<svg class={className} {...rest} viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
	<text x="10" y="16" font-family="JetBrains Mono" font-size="7" fill="currentColor">PLAN DE VOIE — AIGUILLAGE SW-14</text>

	<!-- Double track -->
	<line x1="0" y1="80" x2="250" y2="80" stroke="currentColor" stroke-width="0.8"/>
	<line x1="0" y1="86" x2="250" y2="86" stroke="currentColor" stroke-width="0.8"/>

	<!-- Turnout: diverging routes -->
	<line x1="250" y1="80" x2="580" y2="50" stroke="currentColor" stroke-width="0.8"/>
	<line x1="250" y1="86" x2="580" y2="56" stroke="currentColor" stroke-width="0.8"/>
	<line x1="250" y1="80" x2="580" y2="120" stroke="currentColor" stroke-width="0.8"/>
	<line x1="250" y1="86" x2="580" y2="126" stroke="currentColor" stroke-width="0.8"/>

	<!-- Switch mechanism -->
	<circle cx="265" cy="83" r="5" stroke="currentColor" stroke-width="0.6"/>
	<line x1="258" y1="83" x2="272" y2="83" stroke="currentColor" stroke-width="0.4"/>

	<!-- Sleepers -->
	<line x1="30" y1="75" x2="30" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="50" y1="75" x2="50" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="70" y1="75" x2="70" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="90" y1="75" x2="90" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="110" y1="75" x2="110" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="130" y1="75" x2="130" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="150" y1="75" x2="150" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="170" y1="75" x2="170" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="190" y1="75" x2="190" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="210" y1="75" x2="210" y2="91" stroke="currentColor" stroke-width="0.3"/>
	<line x1="230" y1="75" x2="230" y2="91" stroke="currentColor" stroke-width="0.3"/>

	<!-- Route labels -->
	<text x="260" y="72" font-family="JetBrains Mono" font-size="5" fill="currentColor">SW-14</text>
	<text x="420" y="42" font-family="JetBrains Mono" font-size="5" fill="currentColor">VOIE A</text>
	<text x="420" y="132" font-family="JetBrains Mono" font-size="5" fill="currentColor">VOIE B</text>

	<!-- Platform outline -->
	<rect x="320" y="145" width="140" height="28" rx="2" stroke="currentColor" stroke-width="0.4" stroke-dasharray="3 2"/>
	<text x="355" y="163" font-family="JetBrains Mono" font-size="5" fill="currentColor">QUAI / PLATFORM</text>
</svg>
```

- [ ] **Step 3: Verify both render**

```bash
# Quick check — import in a scratch file or check that bun run check passes
bun run check
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/svg/BlueprintBridge.svelte src/lib/components/svg/BlueprintTrackPlan.svelte
git commit -m "feat(slice-17d-4): add BlueprintBridge + BlueprintTrackPlan SVGs"
```

---

## Task 2: Blog Blueprint SVGs — Catenary + Signal + Station

**Files:**
- Create: `src/lib/components/svg/BlueprintCatenary.svelte`
- Create: `src/lib/components/svg/BlueprintSignal.svelte`
- Create: `src/lib/components/svg/BlueprintStationSection.svelte`

- [ ] **Step 1: Create BlueprintCatenary.svelte**

Overhead wire system with poles, contact wire catenary curve, messenger wire, droppers, 25kV label. ViewBox `0 0 500 130`.

- [ ] **Step 2: Create BlueprintSignal.svelte**

Two-aspect signal (R/V), mounting pole, reference label SIG-07A. ViewBox `0 0 120 200`.

- [ ] **Step 3: Create BlueprintStationSection.svelte**

Tunnel arch cross-section, dual platforms (QUAI A / QUAI B), tracks, ceiling, dimensions. ViewBox `0 0 300 170`.

- [ ] **Step 4: Verify**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/svg/BlueprintCatenary.svelte src/lib/components/svg/BlueprintSignal.svelte src/lib/components/svg/BlueprintStationSection.svelte
git commit -m "feat(slice-17d-4): add BlueprintCatenary + BlueprintSignal + BlueprintStationSection SVGs"
```

---

## Task 3: BlogBlueprint Composition Component

**Files:**
- Create: `src/lib/components/blog/BlogBlueprint.svelte`

- [ ] **Step 1: Create BlogBlueprint.svelte**

Follow `ServicesBlueprint.svelte` pattern exactly: absolute container, 6 SVGs at different positions/opacities/rotations, vignette overlay, crosshairs, ref labels.

```svelte
<script lang="ts">
	import BlueprintBridge from '$lib/components/svg/BlueprintBridge.svelte';
	import BlueprintTrackPlan from '$lib/components/svg/BlueprintTrackPlan.svelte';
	import BlueprintCatenary from '$lib/components/svg/BlueprintCatenary.svelte';
	import BlueprintSignal from '$lib/components/svg/BlueprintSignal.svelte';
	import BlueprintStationSection from '$lib/components/svg/BlueprintStationSection.svelte';
	import BlueprintDetailBogie from '$lib/components/svg/BlueprintDetailBogie.svelte';
</script>

<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)]" aria-hidden="true">
	<!-- Layer 1: Bridge — full width, faintest (background) -->
	<div class="absolute inset-x-[-2%] top-[5%] bottom-[5%] z-0 opacity-[0.05]">
		<BlueprintBridge class="h-full w-full" />
	</div>

	<!-- Layer 2-6: Detail drawings at different positions -->
	<div class="absolute inset-0 z-0 overflow-hidden opacity-[0.10]">
		<BlueprintTrackPlan class="edge-detail" style="top:15%;left:5%;width:50%;height:60%;transform:rotate(-2deg);" />
		<BlueprintCatenary class="edge-detail" style="top:0;right:2%;width:42%;height:48%;transform:rotate(1deg);" />
		<BlueprintSignal class="edge-detail" style="left:55%;bottom:5%;width:7%;height:55%;transform:rotate(3deg);" />
		<BlueprintStationSection class="edge-detail" style="right:8%;bottom:0;width:28%;height:55%;transform:rotate(-1deg);" />
		<BlueprintDetailBogie class="edge-detail" style="left:2%;bottom:2%;width:16%;height:32%;transform:rotate(2deg);" />
	</div>

	<!-- Crosshairs -->
	<div class="crosshair" style="top:12px;left:12px;"></div>
	<div class="crosshair" style="top:12px;right:12px;"></div>
	<div class="crosshair" style="bottom:12px;left:12px;"></div>
	<div class="crosshair" style="bottom:12px;right:12px;"></div>

	<!-- Ref labels -->
	<span class="ref-label" style="top:8px;right:40px;">SEC-BLOG / DISPATCHES</span>
	<span class="ref-label" style="bottom:8px;left:40px;">DWG: TRANSIT-OPS-ELEV</span>
	<span class="ref-label" style="bottom:8px;right:40px;">SCALE NTS | REV.A</span>

	<!-- Vignette -->
	<div class="absolute inset-0 z-10" style="background: radial-gradient(ellipse at 55% 50%, transparent 15%, rgba(var(--bg-primary-rgb, 10,10,10), 0.65) 85%);"></div>
</div>

<style>
	:global(.edge-detail) { position: absolute; }

	.crosshair {
		position: absolute;
		width: 24px;
		height: 24px;
	}
	.crosshair::before {
		content: '';
		position: absolute;
		width: 24px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 24px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		left: 50%;
	}

	.ref-label {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 9px;
		color: color-mix(in srgb, var(--primary) 20%, transparent);
		letter-spacing: 1.5px;
		z-index: 20;
	}

	@media (max-width: 1023px) {
		.ref-label, .crosshair { display: none; }
	}
</style>
```

- [ ] **Step 2: Verify check passes**

```bash
bun run check
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/blog/BlogBlueprint.svelte
git commit -m "feat(slice-17d-4): add BlogBlueprint composition component"
```

---

## Task 4: Wire BlogBlueprint into BlogListingPage

**Files:**
- Modify: `src/lib/components/blog/BlogListingPage.svelte`

- [ ] **Step 1: Replace header SectionWrapper content**

Remove: the `.blog-header` div (heading, subtitle, SVG icon, "Blog." prefix).
Add: BlogBlueprint in a `position: relative; height: 240px; overflow: hidden` container.
Keep: the horizontal hazard Separator between header and listing.
Add: mobile "Blog." title overlaid on blueprint (hidden on lg+ when EdgeRail visible).

Key changes in the template:
- Import `BlogBlueprint` from `'./BlogBlueprint.svelte'`
- Remove `SvgIcon` from header imports (no longer used in header — still used in BlogRow)
- Remove `heroSvg` derived (no longer needed)
- Replace SectionWrapper 1 content with:

```svelte
<SectionWrapper layout="bleed" container="none">
	<div class="blog-blueprint-header" data-batch="blog-item">
		<BlogBlueprint />
		<!-- Mobile title: shown when EdgeRail hidden -->
		<div class="blog-mobile-title">
			<div class="blog-mobile-heading">Blog<span class="text-[var(--primary)]">.</span></div>
			<div class="blog-mobile-subtitle">dispatches from the field</div>
		</div>
	</div>
</SectionWrapper>
```

- [ ] **Step 2: Add CSS for blueprint header + mobile title**

```css
.blog-blueprint-header {
	position: relative;
	height: 240px;
	overflow: hidden;
}

.blog-mobile-title {
	position: absolute;
	z-index: 20;
	bottom: 1.5rem;
	left: var(--space-page-x);
}

.blog-mobile-heading {
	font-family: var(--font-heading);
	font-size: clamp(2rem, 5vw, 3rem);
	font-weight: 900;
	color: var(--foreground);
	letter-spacing: -1px;
	line-height: 1;
}

.blog-mobile-subtitle {
	font-family: var(--font-mono);
	font-size: 0.65rem;
	color: var(--muted-foreground);
	letter-spacing: 2px;
	text-transform: uppercase;
	margin-top: 0.35rem;
}

/* Hide mobile title on desktop (EdgeRail carries identity) */
@media (min-width: 1024px) {
	.blog-mobile-title { display: none; }
}

/* Reduce blueprint height on mobile */
@media (max-width: 767px) {
	.blog-blueprint-header { height: 140px; }
}
```

- [ ] **Step 3: Remove old header CSS**

Remove: `.blog-header`, `.blog-header-title`, `.blog-header-icon`, `.blog-heading`, `.blog-heading-prefix`, `.blog-subtitle` styles.

- [ ] **Step 4: Remove heroSvg derived and unused SvgIcon header import**

Remove the `heroSvg` derived block. Keep `SvgIcon` import only if still used elsewhere in the file (BlogRow uses its own import).

- [ ] **Step 5: Verify**

```bash
bun run check && bun run test
```

- [ ] **Step 6: Visual check on localhost:5173/blog**

Desktop 1440px: EdgeRail "Blog." + accent line + blueprint wall (240px) + hazard stripe + posts.
Mobile 375px: No EdgeRail, blueprint header (140px) with "Blog." title overlaid + posts.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/blog/BlogListingPage.svelte
git commit -m "feat(slice-17d-4): wire BlogBlueprint into listing header"
```

---

## Task 5: Projects Blueprint SVGs — TBM + Tunnel Section + Erector

**Files:**
- Create: `src/lib/components/svg/BlueprintTBM.svelte`
- Create: `src/lib/components/svg/BlueprintTunnelSection.svelte`
- Create: `src/lib/components/svg/BlueprintErector.svelte`

- [ ] **Step 1: Create BlueprintTBM.svelte**

Full TBM side elevation — cutterhead with disc cutters and spokes, shield body with section lines, thrust cylinders, screw conveyor, tail skin, installed voussoir rings. ViewBox `0 0 1200 200`. French labels: ROUE DE COUPE, BOUCLIER, VÉRINS, VOUSSOIRS, VIS SANS FIN.

Same script pattern as Task 1 (`class` + spread props, `currentColor`, `fill="none"`).

- [ ] **Step 2: Create BlueprintTunnelSection.svelte**

Tunnel cross-section — outer rock circle (dashed), lining ring, inner lining, segment dividers with labels K-A-B-C-D-E, invert curve, diameter dimension (Ø 9.4m). ViewBox `0 0 250 260`.

- [ ] **Step 3: Create BlueprintErector.svelte**

Segment erector arm — pivot point, arm, grab mechanism, arc guide, rotation arrows, ÉRECTEUR label. ViewBox `0 0 200 200`.

- [ ] **Step 4: Verify**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/svg/BlueprintTBM.svelte src/lib/components/svg/BlueprintTunnelSection.svelte src/lib/components/svg/BlueprintErector.svelte
git commit -m "feat(slice-17d-4): add BlueprintTBM + BlueprintTunnelSection + BlueprintErector SVGs"
```

---

## Task 6: Projects Blueprint SVGs — Geology + Ventilation + Grout

**Files:**
- Create: `src/lib/components/svg/BlueprintGeology.svelte`
- Create: `src/lib/components/svg/BlueprintVentShaft.svelte`
- Create: `src/lib/components/svg/BlueprintGroutInjection.svelte`

- [ ] **Step 1: Create BlueprintGeology.svelte**

Geological strata — wavy horizontal bands, cross-hatching per stratum, labels: ARGILE, CALCAIRE, ROCHE MÈRE. ViewBox `0 0 1000 200`.

- [ ] **Step 2: Create BlueprintVentShaft.svelte**

Ventilation shaft — vertical rectangular shaft, fan housing at base, shaft lining marks, PUITS label. ViewBox `0 0 100 260`.

- [ ] **Step 3: Create BlueprintGroutInjection.svelte**

Grout injection — pipe, nozzle, spray pattern (dashed lines), pressure gauge circle, INJECTION label. ViewBox `0 0 160 110`.

- [ ] **Step 4: Verify**

```bash
bun run check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/svg/BlueprintGeology.svelte src/lib/components/svg/BlueprintVentShaft.svelte src/lib/components/svg/BlueprintGroutInjection.svelte
git commit -m "feat(slice-17d-4): add BlueprintGeology + BlueprintVentShaft + BlueprintGroutInjection SVGs"
```

---

## Task 7: ProjectsBlueprint Composition + Projects Layout

**Files:**
- Create: `src/lib/components/projects/ProjectsBlueprint.svelte`
- Create: `src/routes/projects/+layout.svelte`

- [ ] **Step 1: Create ProjectsBlueprint.svelte**

Same pattern as `BlogBlueprint.svelte` (Task 3) but imports the 6 tunneling SVGs:

```svelte
<script lang="ts">
	import BlueprintTBM from '$lib/components/svg/BlueprintTBM.svelte';
	import BlueprintTunnelSection from '$lib/components/svg/BlueprintTunnelSection.svelte';
	import BlueprintErector from '$lib/components/svg/BlueprintErector.svelte';
	import BlueprintGeology from '$lib/components/svg/BlueprintGeology.svelte';
	import BlueprintVentShaft from '$lib/components/svg/BlueprintVentShaft.svelte';
	import BlueprintGroutInjection from '$lib/components/svg/BlueprintGroutInjection.svelte';
</script>
```

Layer positioning:
- TBM: full-width background (5% opacity) — the hero drawing
- Geology: full-width background bands (3% opacity) — texture layer
- TunnelSection: right side, overlapping (8% opacity, +2deg)
- Erector: left-center detail (7% opacity, -3deg)
- VentShaft: center-right vertical (6% opacity, +1deg)
- GroutInjection: center-bottom small detail (7% opacity, -2deg)

Ref labels: `SEC-PROJ / TUNNELING`, `DWG: TBM-EPB-SECTION`, `SCALE NTS | REV.B`

- [ ] **Step 2: Create projects +layout.svelte**

Exact same pattern as `src/routes/blog/+layout.svelte`:

```svelte
<script lang="ts">
	import { EdgeRail } from '$lib/components/shells';

	let { children } = $props();
</script>

<div class="projects-layout">
	<EdgeRail position="left" label="Projects" variant="title" />
	<div class="projects-accent-rail"></div>
	<div class="projects-content">
		{@render children()}
	</div>
</div>

<style>
	.projects-layout {
		display: block;
		width: 100%;
	}

	.projects-content {
		min-width: 0;
	}

	.projects-accent-rail {
		display: none;
	}

	@media (min-width: 1024px) {
		.projects-layout {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			margin-top: -5rem;
		}

		.projects-content {
			padding-top: 5rem;
		}

		.projects-accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}
	}
</style>
```

- [ ] **Step 3: Verify**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/projects/ProjectsBlueprint.svelte src/routes/projects/+layout.svelte
git commit -m "feat(slice-17d-4): add ProjectsBlueprint + projects layout with EdgeRail"
```

---

## Task 8: Wire ProjectsBlueprint into ProjectListingPage

**Files:**
- Modify: `src/lib/components/projects/ProjectListingPage.svelte`

- [ ] **Step 1: Replace header section**

Remove: the current header div with `SectionHeading` (lines 198-200).
Add: blueprint header + mobile title, same pattern as BlogListingPage (Task 4).

Import `ProjectsBlueprint` from `'./ProjectsBlueprint.svelte'`.
Remove `SectionHeading` import (no longer used).

Replace the header section with:

```svelte
<!-- Blueprint header -->
<div class="projects-blueprint-header" data-batch="project-item">
	<ProjectsBlueprint />
	<div class="projects-mobile-title">
		<div class="projects-mobile-heading">Projects<span class="text-[var(--primary)]">.</span></div>
		<div class="projects-mobile-subtitle">pipelines, systems, and infrastructure</div>
	</div>
</div>
```

- [ ] **Step 2: Remove the outer container constraint**

The current file wraps everything in `mx-auto px-[var(--space-page-x)]` with `max-width: var(--container-content)`. The blueprint header needs to be full-bleed (outside this container), so split the layout:
- Blueprint header: outside the container, full-bleed
- Hazard separator: full-bleed
- Filter + cards section: inside the existing container

- [ ] **Step 3: Add CSS**

Same styles as blog (Task 4 Step 2) but with `projects-` prefix:

```css
.projects-blueprint-header {
	position: relative;
	height: 240px;
	overflow: hidden;
}

.projects-mobile-title {
	position: absolute;
	z-index: 20;
	bottom: 1.5rem;
	left: var(--space-page-x);
}

.projects-mobile-heading {
	font-family: var(--font-heading);
	font-size: clamp(2rem, 5vw, 3rem);
	font-weight: 900;
	color: var(--foreground);
	letter-spacing: -1px;
	line-height: 1;
}

.projects-mobile-subtitle {
	font-family: var(--font-mono);
	font-size: 0.65rem;
	color: var(--muted-foreground);
	letter-spacing: 2px;
	text-transform: uppercase;
	margin-top: 0.35rem;
}

@media (min-width: 1024px) {
	.projects-mobile-title { display: none; }
}

@media (max-width: 767px) {
	.projects-blueprint-header { height: 140px; }
}
```

- [ ] **Step 4: Verify**

```bash
bun run check && bun run test
```

- [ ] **Step 5: Visual check on localhost:5173/projects**

Desktop 1440px: EdgeRail "Projects." + accent line + TBM blueprint wall + hazard stripe + filter sidebar + project cards.
Mobile 375px: No EdgeRail, blueprint header with "Projects." title + cards.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/projects/ProjectListingPage.svelte
git commit -m "feat(slice-17d-4): wire ProjectsBlueprint into listing header"
```

---

## Task 9: Update blog layout comment + final verification

**Files:**
- Modify: `src/routes/blog/+layout.svelte` (comment update only)

- [ ] **Step 1: Update layout comment**

Change the file comment from mentioning "hazard stripe" to "accent line":

```svelte
<!--
  Blog section layout — shared across /blog, /blog/personal, /blog/[slug].
  CSS Grid: EdgeRail column + thin accent line + content column.
  EdgeRail is a layout participant — sections cannot overlap it.
-->
```

- [ ] **Step 2: Full verification**

```bash
bun run check && bun run test
```

- [ ] **Step 3: Cross-page visual check**

Verify all 4 routes render correctly:
- `/blog` — blog blueprints + EdgeRail
- `/blog/personal` — same transit blueprints + EdgeRail
- `/projects` — tunneling blueprints + EdgeRail
- `/blog/[any-slug]` — no blueprint header (detail page unchanged), EdgeRail + accent line still visible

- [ ] **Step 4: Commit**

```bash
git add src/routes/blog/+layout.svelte
git commit -m "docs(slice-17d-4): update blog layout comment — accent line"
```
