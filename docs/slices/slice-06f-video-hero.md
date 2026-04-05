# Slice 06f — Scroll-Linked Video Hero

**Status:** ready
**Priority:** 1
**Estimated effort:** 1 session
**Depends on:** 06d (complete)

## Objective

Replace the 3D ThreeJS wagon scene in the hero card with a scroll-linked video that plays forward as the user scrolls down and rewinds when they scroll back up. The video (created in Google Flow) shows a Montreal metro train in a decomposition/assembly animation.

## Context

The 3D GLB model from Sketchfab doesn't look great in the small hero card — the geometry is too detailed for the viewport size and the camera angle doesn't capture the train's character. Yesid has created a much better-looking video using Google Flow (`Train_to_decomposition_202604032015.mp4`) that shows the train with dramatic lighting and a decomposition effect.

Scroll-linked video playback is a well-known pattern (Apple product pages, etc.): the video's `currentTime` is mapped to scroll progress, so the video plays as a visual timeline of the scroll.

## Acceptance Criteria

- [ ] Video file placed in `static/video/` (WebM + MP4 for browser compat)
- [ ] HeroBanner replaces `<WagonScene>` with a `<video>` element inside the hero card
- [ ] Video `currentTime` is driven by `scrollProgress` prop (0 → duration)
- [ ] Scrolling down plays the video forward; scrolling up rewinds
- [ ] Video is `muted`, `playsinline`, no controls, no autoplay
- [ ] `prefers-reduced-motion`: show a static poster frame instead of scroll-linked playback
- [ ] Mobile: video still visible (stacked below text, same as current 3D card)
- [ ] Art background remains behind the video inside the rounded card
- [ ] Three.js/Threlte imports removed from HeroBanner (dynamic import gone)
- [ ] WagonScene.svelte and WagonInner.svelte kept for `/preview` routes
- [ ] No new dependencies needed (native `<video>` element + requestAnimationFrame)
- [ ] All tests pass (`bun run test`)
- [ ] Type check passes (`bun run check`)
- [ ] `tree.txt` updated
- [ ] Dev log written
- [ ] Handoff report written (after Yesid approval)

## Technical Spec

### Phase 0: Manual Prerequisites (Yesid)

1. Export the Google Flow video in two formats:
   - **WebM** (VP9 codec, ~2-4MB): `static/video/hero-train.webm`
   - **MP4** (H.264 codec, ~3-6MB): `static/video/hero-train.mp4`
2. Extract a poster frame (first or best frame): `static/video/hero-train-poster.webp`
3. Keep video short (5-15 seconds) — longer videos = more data to download

### Phase 1: Video Component

**`src/lib/components/HeroBanner.svelte`** — Replace 3D scene:

1. Remove the `WagonScene` dynamic import and `onMount` async loader
2. Add a `<video>` element inside the hero card:

```svelte
<video
  bind:this={videoEl}
  muted
  playsinline
  preload="auto"
  poster="/video/hero-train-poster.webp"
  class="absolute inset-0 h-full w-full object-cover"
>
  <source src="/video/hero-train.webm" type="video/webm" />
  <source src="/video/hero-train.mp4" type="video/mp4" />
</video>
```

3. Map `scrollProgress` to `videoEl.currentTime`:

```ts
$effect(() => {
  if (videoEl && videoEl.duration) {
    videoEl.currentTime = scrollProgress * videoEl.duration;
  }
});
```

4. For `prefers-reduced-motion`: don't update `currentTime`, just show the poster.

### Phase 2: Cleanup

- Remove the `WagonScene` and `WagonInner` imports from HeroBanner
- Keep WagonScene.svelte and WagonInner.svelte in the codebase (used by `/preview`)
- Update `<svelte:head>` preload hint: change from image to video preload
- Remove `type Component` import if no longer needed

### Phase 3: Tests

- Update `home.test.ts` if it checks for canvas element
- Verify video element renders with correct attributes
- Run `bun run test` + `bun run check`

## Out of Scope

- Video editing/creation (Yesid does this in Google Flow)
- Removing Three.js packages from `package.json` (still used by `/preview` and potentially future pages)
- Sound/audio (video is always muted)
- Custom video player UI

## Learn

### Scroll-Linked Video Playback
**What it is:** Setting a `<video>` element's `currentTime` property based on scroll position instead of letting it play at normal speed.
**Why it matters:** Same concept as scroll-linked Lottie (which you already have) — instead of frame numbers, you're seeking to a time position. The browser handles decoding and rendering.
**Try this:** Open the hero on localhost, scroll slowly — the video should advance frame by frame.
**Go deeper:** https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime

## Verify

1. Run `bun run test` — all tests pass
2. Run `bun run check` — no type errors
3. Open `http://localhost:5173/` — hero card shows video
4. Scroll down slowly — video plays forward
5. Scroll back up — video rewinds
6. Check mobile — video stacks below text, plays on scroll
7. Enable reduced motion — video shows poster frame only
8. Network tab — video preloads (no play delay)
