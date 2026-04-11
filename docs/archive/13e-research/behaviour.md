# Slice 13e — Hero Resize Behaviour Report

> Systematically observed via Chrome DevTools MCP on 2026-04-10.  
> All measurements taken against `http://localhost:5173` with the dev server running.

---

## 1. Baselines (fresh page load, no resize)

### Desktop — 1440x902

| Phase | scrollY | svgScale | svgOp | htScale | htY | htOp | stOpaque | Notes |
|-------|---------|----------|-------|---------|-----|------|----------|-------|
| Start | 0 | 1 | 1 | 225 | 0 | 0 | 0/9 | Berri dot + "SCROLL DOWN" visible |
| Phase 2 (lines) | 1200 | 1 | 1 | 225 | 0 | 0 | 0/9 | Lines drawing |
| Phase 5 (zoom) | 3500 | 6.43 | 1 | 225 | 0 | 0 | 0/9 | SVG mid-zoom |
| Phase 6 (xfade) | 4800 | 103 | 1 | 225 | 0 | 0 | 0/9 | SVG almost fully zoomed |
| Phase 7 (zoomout) | 5800 | 103 | 0 | 58.3 | 0 | 1 | 2/9 | Hero zooming out |
| Phase 8 (text) | 6500 | 103 | 0 | 2.80 | 0 | 1 | 6/9 | Stagger text revealing |
| Phase 9 (hold) | 7000 | 103 | 0 | 1 | 0 | 1 | 9/9 | Hero fully visible |
| End | 7216 | 103 | 0 | 1 | 0 | 1 | 9/9 | Unpinned |

**Baked-in values:** `sectionMinHeight=900svh`, `ScrollTrigger end=+=800%`, `heroOverflow=0`, `pinSpacer padding=7216px`

### Mobile — 500x814

| Phase | scrollY | svgScale | svgOp | htScale | htY | htOp | stOpaque | Notes |
|-------|---------|----------|-------|---------|-----|------|----------|-------|
| Start | 0 | 1 | 1 | 204 | 0 | 0 | 0/9 | — |
| Phase 9 | ~6300 | 180 | 0 | 1 | 0 | 1 | 9/9 | Hero visible, before Phase 10 |
| Phase 10 mid | 7500 | 180 | 0 | 1 | -297 | 1 | 9/9 | Content scrolling up |
| Phase 10 mid | 8500 | 180 | 0 | 1 | -690 | 1 | 9/9 | SQL panel mostly visible |
| Phase 10 end | 8900 | 180 | 0 | 1 | -813 | 1 | 9/9 | Fully scrolled |

**Baked-in values:** `sectionMinHeight=1200svh`, `ScrollTrigger end=+=1100%`, `heroOverflow=813`, `pinSpacer padding=8954px`

---

## 2. Issues Observed

### ISSUE 1: Timeline freezes in end-state after ANY resize (CRITICAL)

**Reproduction:** Load at desktop 1440x902. Scroll to Phase 9 (scrollY=7000). Resize to 1200x900 (even same height!). Scroll back to 0.

**Expected at scrollY=0:** SVG visible (opacity=1, scale=1), heroText hidden (opacity=0, scale=225)  
**Actual at scrollY=0:** SVG invisible (opacity=0, scale=103), heroText VISIBLE (opacity=1, scale=215), all 9 stagger elements opaque

**Root cause:** `onResize()` calls `gsap.set(heroTextContainer, { scale: newHeroScale })` which overwrites the timeline's rendered value. Then `zoomTween.invalidate()` and `heroZoomTween.invalidate()` mark tweens for re-init. But on the next render, `invalidate()` reads the CURRENT inline style as the new "from" value — which is the tween's own previously rendered output. This creates a feedback loop. The timeline never recovers its ability to interpolate correctly.

**Scroll to any position after resize** shows the animation stuck in its completed state. The entire scroll-driven animation is dead.

**Severity:** This is the #1 issue. Every single resize, no matter how small, permanently breaks the animation for the rest of the session.

---

### ISSUE 2: `sectionMinHeight` never switches between mobile/desktop (HIGH)

**Where set:** `sectionMinHeight` is a Svelte `$state` variable initialized to `'900svh'`. It's changed to `'1200svh'` inside the `if (heroOverflow > 0)` block at mount time (line 467).

**Problem:** This value is set ONCE at mount. It never updates on resize.

| Scenario | Expected | Actual |
|----------|----------|--------|
| Load on desktop, resize to mobile | `1200svh` | `900svh` (stale) |
| Load on mobile, resize to desktop | `900svh` | `1200svh` (stale) |

**Impact:** On desktop→mobile, the scroll range is too short to reach Phase 10. On mobile→desktop, the scroll range is too long with wasted empty scroll.

---

### ISSUE 3: `ScrollTrigger.end` is baked at mount and never changes (HIGH)

**Where set:** `ScrollTrigger.create({ end: heroOverflow > 0 ? '+=1100%' : '+=800%' })` at line 488.

**Problem:** The `end` value is computed once from the mount-time `heroOverflow` value. `onResize()` calls `ScrollTrigger.refresh()` which recalculates pin positions, but does NOT change the `end` distance — that's baked into `st.vars.end`.

| Scenario | Expected end | Actual end |
|----------|-------------|------------|
| Desktop→mobile | `+=1100%` | `+=800%` (stale) |
| Mobile→desktop | `+=800%` | `+=1100%` (stale) |

**Impact:** Combined with Issue 2, the scroll range is wrong. Progress-to-animation mapping breaks.

---

### ISSUE 4: Phase 10 tween doesn't exist/can't be removed dynamically (HIGH)

**Where set:** The Phase 10 tween (line 458) is only created inside `if (heroOverflow > 0)`. On desktop mount, `heroOverflow=0`, so no Phase 10 tween exists.

**Problem:** 
- **Desktop→mobile:** heroOverflow jumps from 0 to 813, but no Phase 10 tween exists in the timeline. The SQL section is unreachable.
- **Mobile→desktop:** Phase 10 tween exists with `y: -813`, but desktop has no overflow. The tween pushes content off-screen, creating a blank viewport.

**Visual proof:** After mobile→desktop resize at Phase 10, the viewport shows a completely blank page with content pushed up by 749px (screenshot: `mobile-to-desktop-phase10.png`).

---

### ISSUE 5: `heroOverflow` is baked at mount (MEDIUM-HIGH)

**Where set:** `const heroOverflow = contentInner ? Math.max(0, contentInner.scrollHeight - window.innerHeight) : 0` at line 283. This is a `const` — never recalculated.

**Values observed:**
- Desktop mount: `heroOverflow = 0` (647px content fits in 902px viewport)
- Mobile mount: `heroOverflow = 813` (1627px content exceeds 814px viewport)

**Impact:** The Phase 10 `y: -heroOverflow` target value is stale after resize. Even if the tween existed, it would scroll the wrong distance.

---

### ISSUE 6: `transformOrigin` drifts across resize cycles (MEDIUM)

The `updateHeroTextOrigin()` function uses `getDotGlyphCenter()` which reads `heroDot.getBoundingClientRect()` relative to `heroTextContainer.getBoundingClientRect()`. After resize, these rects may not be stable.

| State | transformOrigin |
|-------|----------------|
| Desktop fresh load | `628.845px 490.73px` |
| After desktop→mobile→desktop round-trip | `1004.43px 572.315px` |
| After desktop→1200px small resize | `457.608px 391.837px` |

**Impact:** The zoom-out animation pivots around the wrong point — the dot "." in "DON'T BREAK." no longer aligns with the Berri-UQAM station from the SVG zoom. The visual continuity of the metro→hero transition breaks.

**Root cause hypothesis:** When `heroTextContainer` is at `scale != 1`, `getBoundingClientRect()` returns the SCALED rect, not the base rect. The transform-origin calculation divides by the container rect which is scaled, producing wrong percentages.

---

### ISSUE 7: SVG zoom tween "from" value corrupted by invalidate (MEDIUM)

After resize at Phase 5 (SVG mid-zoom):
- **Before resize:** svgWrapper scale = 6.43 (interpolated between 1 and 103 at 48% progress)
- **After resize:** svgWrapper scale = 61.17 (jump!)
- **Scrolling back to 0:** svgWrapper scale = 8.05 (should be 1)

**Root cause:** `zoomTween.invalidate()` clears the cached "from" value. On next render, it reads the CURRENT svgWrapper inline style (which was set by the tween to scale=6.43 mid-animation) as the new "from" value. The tween now interpolates from 6.43→newScale instead of 1→newScale.

**Visual:** At scroll 0 after resize, the SVG shows giant orange station dots (scale 8x) with no metro lines visible and no "SCROLL DOWN" text (screenshot: `mobile-at-top-after-resize.png`).

---

### ISSUE 8: Scroll position discontinuity on resize (MEDIUM)

When viewport height changes, the ScrollTrigger `end` distance changes (e.g., 800% × 902 = 7216px vs 800% × 814 = 6512px). The user's absolute scrollY doesn't change, but it now represents a different progress through the animation.

| Scenario | scrollY | Old range | Old progress | New range | New progress | Visual jump |
|----------|---------|-----------|-------------|-----------|-------------|-------------|
| Desktop→tablet at Phase 9 | 7000 | 7216px | 97% | 8192px | 85% | Zoom-out reverses (scale 1→10.84) |
| Desktop→mobile at Phase 9 | 7000 | 7216px | 97% | 6512px | 107% (past end!) | Unpins entirely |

**Impact:** The user sees the animation jump forward or backward visually on resize. At extreme cases (desktop→mobile), they can end up past the animation entirely, seeing below-fold content.

---

### ISSUE 9: `normalizeScroll` interaction with resize (LOW)

`ScrollTrigger.normalizeScroll(true)` is enabled after the typewriter completes. On resize, `ScrollTrigger.refresh()` is called but normalizeScroll is not toggled. This may cause scroll position drift on mobile where browser chrome appears/disappears during resize.

---

## 3. What Currently Works on Resize

These calculations in `onResize()` DO update correctly:

1. `updateZoomOrigin()` — recalculates SVG zoom transform-origin (Berri-UQAM position)
2. `calcZoomScale()` — recalculates the target zoom scale
3. `calcHeroTextScale()` — recalculates the hero text zoom scale
4. `updateHeroTextOrigin()` — attempts to recalculate dot-based transform-origin (but drifts, see Issue 6)
5. `ScrollTrigger.refresh()` — recalculates pin start/end positions

BUT: None of these fix the core problem because `invalidate()` corrupts the timeline's ability to interpolate (Issue 1).

---

## 4. What Current `onResize()` Does vs What It Should Do

```
Current onResize():
1. updateZoomOrigin()                    -- OK
2. zoomTween.vars.scale = calcZoomScale() -- sets new end value
3. zoomTween.invalidate()                -- BREAKS: re-reads mid-animation inline style as "from"
4. updateHeroTextOrigin()                -- DRIFTS: reads getBoundingClientRect at wrong scale
5. gsap.set(heroTextContainer, {scale})  -- BREAKS: overrides timeline's rendered value
6. heroZoomTween.vars.scale = 1          -- OK in isolation
7. heroZoomTween.invalidate()            -- BREAKS: same issue as step 3
8. ScrollTrigger.refresh()               -- recalculates pin, but can't fix timeline

Missing entirely:
- sectionMinHeight update
- ScrollTrigger end update
- heroOverflow recalculation
- Phase 10 tween creation/removal
- Scroll position normalization (scrollY → same visual progress)
- SVG wrapper "from" value reset
- Stagger element opacity reset
- Proper timeline rebuild
```

---

## 5. Summary of Root Causes

| # | Root Cause | Issues Affected |
|---|-----------|----------------|
| A | **Timeline tween values can't be surgically updated with invalidate()** | 1, 7 |
| B | **State variables (sectionMinHeight, heroOverflow) set once at mount** | 2, 4, 5 |
| C | **ScrollTrigger.create() config (end) is immutable after creation** | 3 |
| D | **No Phase 10 tween creation/destruction on layout change** | 4 |
| E | **transformOrigin calculation unstable at non-1 scale** | 6 |
| F | **Scroll position maps to different progress after height change** | 8 |

**The fundamental problem:** The animation was designed as a run-once sequence. The timeline structure (which tweens exist, their from/to values, their durations, the ScrollTrigger range) is determined at mount and assumed immutable. Resize requires either:
1. **Full timeline teardown + rebuild** on every resize, OR
2. **GSAP matchMedia()** to maintain separate timelines for mobile vs desktop, OR
3. A hybrid approach that surgically updates what can be updated and rebuilds what can't

---

## 6. Screenshots Captured

| File | Scenario |
|------|----------|
| `desktop-to-mobile-phase9.png` | After desktop→mobile resize at Phase 9: hero unpinned, below-fold content visible |
| `mobile-at-top-after-resize.png` | After desktop→mobile resize, scrolled to top: SVG stuck at scale 8, giant orange dots |
| `mobile-to-desktop-phase10.png` | After mobile→desktop resize at Phase 10: completely blank viewport, content pushed off-screen |
| `tablet-after-desktop-resize.png` | After desktop→tablet resize at Phase 9: giant zoomed text fragments visible |
