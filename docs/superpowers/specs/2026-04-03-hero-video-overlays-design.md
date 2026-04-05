# Design: Scroll-Linked Video Hero + Code Overlays

**Date:** 2026-04-03
**Status:** Experimental — expect multiple iterations, possible direction change
**Extends:** `docs/slices/slice-06f-video-hero.md`

## Context

The 3D Threlte/Three.js wagon in the hero card doesn't deliver the cinematic, premium feel Yesid wants. He's creating a video in Google Flow (train decomposition/assembly with dramatic lighting) as a replacement. The entire home page is already scroll-driven via GSAP ScrollTrigger with a `scrollProgress` (0-1) prop flowing into components.

**Design goals:** Cinematic & premium (Apple product page energy), flexible subject matter (video content can be anything), mix of pre-rendered (video) + code-driven (GSAP overlays).

**Experimental constraint:** This is exploratory. The 3D wagon must remain as a fallback. The new component must be trivially swappable. Overlays are optional and independently tweakable.

## Architecture

```
HeroBanner.svelte
  └── Right-side hero card (existing rounded card with art background)
        ├── Art background image           (existing, stays)
        ├── HeroVideoCard.svelte           ← NEW component
        │     ├── Layer 1: <video>         (scroll-linked currentTime)
        │     └── Layer 2: Code overlays   (GSAP-animated SQL fragments)
        └── WagonScene.svelte              (kept in codebase, not imported)
```

### Component: `src/lib/components/HeroVideoCard.svelte`

**Props:**
- `scrollProgress: number` (0-1) — same interface as WagonScene
- `showOverlays?: boolean` (default: true) — toggle code overlays for A/B testing
- `reducedMotion?: boolean` — show poster frame only, no scroll-linking

**Drop-in swap:** HeroBanner changes from:
```svelte
<!-- Before -->
{#if WagonScene}
  <WagonScene {scrollProgress} reducedMotion={false} />
{/if}

<!-- After -->
<HeroVideoCard {scrollProgress} reducedMotion={$prefersReducedMotion} />
```

One import change to swap back to 3D if needed.

### Layer 1: Scroll-Linked Video

```svelte
<video
  bind:this={videoEl}
  muted
  playsinline
  preload="auto"
  poster="/video/hero-train-poster.webp"
  class="absolute inset-0 h-full w-full rounded-2xl object-cover"
>
  <source src="/video/hero-train.webm" type="video/webm" />
  <source src="/video/hero-train.mp4" type="video/mp4" />
</video>
```

Scroll mapping:
```ts
$effect(() => {
  if (!reducedMotion && videoEl && videoEl.duration) {
    videoEl.currentTime = scrollProgress * videoEl.duration;
  }
});
```

**Video requirements (Yesid's responsibility):**
- WebM (VP9, ~2-4MB): `static/video/hero-train.webm`
- MP4 (H.264, ~3-6MB): `static/video/hero-train.mp4`
- Poster frame: `static/video/hero-train-poster.webp`
- Duration: 5-15 seconds
- No audio track

### Layer 2: Code Overlays (Optional)

GSAP-animated SQL/data fragments positioned absolutely over the video. Controlled by `scrollProgress` — fragments fade in at specific scroll thresholds.

**Initial overlay set (minimal — expand in iterations):**
- A `SELECT * FROM` fragment that types in at ~10% scroll
- A data-flow line (SVG path) that traces at ~30% scroll
- A `JOIN` keyword that fades in at ~50% scroll

Each overlay is a `<span>` or `<svg>` with:
- `font-mono` styling, brand orange (#E07800) or muted gray
- `opacity` and `transform` driven by GSAP based on scroll ranges
- Semi-transparent so the video shows through

**Toggle:** `showOverlays={false}` hides all overlays — video-only mode for testing.

### Reduced Motion

When `reducedMotion` is true:
- Video shows poster frame (no currentTime updates)
- Overlays render in final state (no animation)

## Files Changed

| File | Change |
|------|--------|
| `src/lib/components/HeroVideoCard.svelte` | **NEW** — video + overlay component |
| `src/lib/components/HeroBanner.svelte` | Replace WagonScene import with HeroVideoCard |
| `static/video/hero-train.webm` | **NEW** — Yesid provides |
| `static/video/hero-train.mp4` | **NEW** — Yesid provides |
| `static/video/hero-train-poster.webp` | **NEW** — Yesid provides |

## Files NOT Changed

| File | Why |
|------|-----|
| `src/lib/motion/three/WagonScene.svelte` | Kept as fallback + `/preview` route |
| `src/lib/motion/three/WagonInner.svelte` | Kept as fallback + `/preview` route |
| `src/routes/+page.svelte` | No changes — scrollProgress plumbing unchanged |
| `package.json` | No new dependencies (native `<video>` + existing GSAP) |

## Rollback Plan

If the video approach doesn't work after iterations:
1. Revert HeroBanner to import WagonScene
2. Delete HeroVideoCard.svelte
3. Delete video files from static/
4. Done — everything else is untouched

## Dependencies

- **Yesid:** Must export WebM + MP4 + poster before implementation starts
- **No new packages:** Uses native `<video>` element + existing GSAP installation

## Known Risks

| Risk | Mitigation |
|------|------------|
| iOS Safari scroll-linked video quirks | Test early; fallback to poster on failure |
| Video file size (2-6MB) | Keep duration short (5-15s), compress aggressively |
| Overlays clutter the visual | `showOverlays` prop for quick toggle |
| Yesid might not like video approach | Rollback plan is trivial (one import change) |

## Verify

1. `bun run test` — all tests pass
2. `bun run check` — no type errors
3. Open `http://localhost:5173/` — hero card shows video (not 3D wagon)
4. Scroll down slowly — video plays forward frame by frame
5. Scroll back up — video rewinds
6. Check mobile — video stacks below text, plays on scroll
7. Toggle `showOverlays={false}` — video-only mode works
8. Enable reduced motion — poster frame shown, no animation
9. Navigate to `/preview/train` — 3D wagon still works there

## Out of Scope

- Video creation (Yesid does this)
- Removing Three.js from package.json
- Changes to other sections (services, about, blog, CTA)
- Custom video player controls
- Audio
