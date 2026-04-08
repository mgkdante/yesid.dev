---
title: "Performance Budgets for 3D"
domain: 3d-graphics
difficulty: 2
difficulty_label: intermediate
reading_time: 11
tags:
  - learn
  - 3d-graphics
  - intermediate
prerequisites:
  - "[[threejs-scene-basics]]"
date: 2026-04-08
---

# Performance Budgets for 3D


## The Analogy

A 3D performance budget is like a SQL query execution plan. Before running an expensive query, you check `EXPLAIN ANALYZE` to see how many rows it scans, how much memory it uses, and whether it fits within your response-time budget. A 3D scene has the same concept: how many triangles does the GPU render, how many draw calls does it make, and does the result fit within 16.6 milliseconds (60 FPS)? If your query takes 5 seconds, users leave. If your 3D scene takes 50ms per frame, users see stuttering.

## What It Is

A performance budget is a set of constraints that keep a 3D scene fast across all devices. The key metrics:

- **Draw calls:** Each time the GPU switches from rendering one object to another, that is a draw call. Like SQL round-trips to the database -- each one has overhead. Fewer draw calls = faster rendering. Aim for under 100 for web 3D.

- **Geometry complexity (triangle count):** Every visible surface is made of triangles. A simple cube has 12 triangles. A detailed character model might have 100,000. The GPU processes every triangle every frame. For web 3D, keep total scene triangles under 100,000-200,000.

- **Texture memory:** Images applied to 3D surfaces. Large textures consume GPU memory. A 4096x4096 texture uses 64MB of VRAM. Keep textures at 1024x1024 or smaller for web.

- **Post-processing cost:** Effects like bloom add extra render passes. Each pass processes every pixel. Rendering bloom at full resolution is expensive; rendering at half or quarter resolution saves GPU budget without visible quality loss (bloom is blurry by design).

- **Dynamic import / code splitting:** 3D libraries are large (Three.js is ~600KB). Loading them blocks page rendering. Dynamic import (`import()`) loads them only when needed, and code splitting means mobile devices can skip 3D entirely.

## Why It Matters

The interview question is "How do you handle performance for 3D on the web?" The answer is not "hope it works" -- it is "I set budgets and make informed tradeoffs." For clients, a beautiful 3D scene that makes a phone freeze is worse than no 3D at all. Performance budgets force you to make design decisions early (simpler geometry, lower-resolution effects) instead of discovering problems after the client demos to their boss on a 4-year-old iPad.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/three/PostProcessing.svelte` | `height: 256, width: 256` on BloomEffect | Bloom renders at quarter resolution -- massive GPU savings with no visible quality loss |
| `src/lib/motion/three/PostProcessing.svelte` | `if (!reducedMotion)` guard on bloom | Skips the most expensive effect entirely for reduced-motion users |
| `src/lib/motion/three/scene-config.ts` | Pure math, no loaded assets | Station positions are computed from formulas, not from heavy 3D model files |
| `src/lib/motion/three/WagonInner.svelte` | `useDraco()` for GLB loading | Draco compression reduces model file size by 70-90%, faster download |
| `src/lib/motion/three/WagonInner.svelte` | `scale={[0.0005, 0.0005, 0.0005]}` | Single model with simple scaling, not multiple high-poly models |
| `src/tests/setup.ts` | `vi.mock('postprocessing', ...)` and `vi.mock('@threlte/core', ...)` | 3D dependencies are mocked in tests because WebGL is unavailable -- tests verify logic, not rendering |

## The Mental Model

```
Performance budget analogy:

SQL query plan                      3D render budget
─────────────                       ────────────────
Table scan: 1M rows → SLOW          100k triangles → SLOW on mobile
Index seek: 100 rows → FAST         5k triangles → FAST everywhere
Round-trips: 50 queries → SLOW      50 draw calls → acceptable
Round-trips: 1 query → FAST         5 draw calls → great

Budget allocation per frame (16.6ms for 60 FPS):

  ┌─────────────────────────────────────────────┐
  │ Frame budget: 16.6ms                        │
  │                                             │
  │ ├── Geometry rendering:    ~5ms             │
  │ ├── Lighting calculations: ~2ms             │
  │ ├── Post-processing bloom: ~4ms             │
  │ ├── JavaScript/Svelte:     ~3ms             │
  │ └── Headroom (safety):     ~2ms             │
  │                                             │
  │ If total > 16.6ms → frame drops → stuttering│
  └─────────────────────────────────────────────┘

Mobile skip strategy:

  Desktop (GPU capable):
    Load Three.js → render full 3D scene + bloom

  Mobile (limited GPU):
    Skip 3D import entirely → show CSS fallback
    Dynamic import: import('./HeroScene.svelte') only on desktop
    Savings: ~600KB JS + all GPU cost
```

## Worked Example

```svelte
<!-- From: src/lib/motion/three/PostProcessing.svelte -->
<!-- Performance-conscious bloom configuration -->

<script lang="ts">
  // BUDGET DECISION 1: Skip bloom entirely for reduced motion
  // Cost savings: eliminates the most expensive render pass
  if (!reducedMotion) {
    composer.addPass(
      new EffectPass(
        cam,
        new BloomEffect({
          intensity: 1.2,
          luminanceThreshold: 0,
          luminanceSmoothing: 0.08,
          mipmapBlur: true,              // BUDGET DECISION 2: mipmap blur
                                         // is cheaper than standard Gaussian
          kernelSize: KernelSize.MEDIUM,  // BUDGET DECISION 3: MEDIUM not LARGE
                                         // Smaller kernel = fewer texture samples
          height: 256,                   // BUDGET DECISION 4: Quarter resolution
          width: 256                     // Full res would be ~1920x1080 = 2M pixels
                                         // 256x256 = 65K pixels (97% fewer!)
        })
      )
    );
  }
</script>
```

```typescript
// From: src/lib/motion/three/WagonInner.svelte
// Performance-conscious model loading

// BUDGET DECISION 5: Draco compression
// The raw GLB might be 10MB. Draco-compressed, it could be 1-2MB.
// The decoder runs on a Web Worker (fetched from Google CDN), so
// decompression does not block the main thread.
const dracoLoader = useDraco();
const gltf = useGltf('/models/metro-wagon.glb', { dracoLoader });
```

Each decision documents a specific tradeoff: "I trade X quality for Y performance gain." This is the engineering mindset that separates a junior developer (who adds features until it breaks) from a senior one (who allocates budget before building).

## Common Mistakes

1. **Adding 3D without measuring performance:**
   - **What happens:** The scene looks great on your fast laptop. The client tests on a Chromebook and it freezes.
   - **Fix:** Test on real devices (or Chrome DevTools device emulation with CPU throttling). Measure frame time in the Performance tab. Set a budget (16ms per frame for 60 FPS) and stay under it.
   - **Why:** Development machines have powerful GPUs. Production users often do not.

2. **Full-resolution post-processing:**
   - **What happens:** Bloom renders at 1920x1080 = 2 million pixels per pass. Multiple blur passes multiply this cost.
   - **Fix:** Render bloom at half or quarter resolution (`height: 256, width: 256`). Bloom is a blurred effect -- low resolution is invisible in the final result.
   - **Why:** The GPU cost of a blur pass scales linearly with pixel count. Quarter resolution is 16x cheaper.

3. **Loading the entire 3D library on mobile:**
   - **What happens:** Users on phones wait 3+ seconds for Three.js, Threlte, and postprocessing to download before seeing any content.
   - **Fix:** Use dynamic `import()` to load 3D components only when needed. On mobile, skip the 3D entirely and show a CSS alternative (gradient, static image).
   - **Why:** Three.js alone is ~600KB minified. Adding Threlte and postprocessing can exceed 1MB. On a 3G connection, that is 10+ seconds of loading.

## Break It to Learn It

### Exercise 1: Full-Resolution Bloom
1. Open `src/lib/motion/three/PostProcessing.svelte`
2. Change `height: 256, width: 256` to `height: 1080, width: 1920`
3. **Predict:** The bloom might look marginally sharper but frame rate will drop noticeably, especially on lower-end hardware
4. **Verify:** Run `bun run dev`, open Chrome DevTools Performance tab, record a few seconds, check frame times
5. **What you learned:** Bloom resolution has massive performance impact -- but since bloom is blurry by nature, lower resolution is visually indistinguishable
6. **Undo your change**

### Exercise 2: Check the Draco Compression Savings
1. Open Chrome DevTools Network tab
2. Load the page and filter by "glb" to find the wagon model download
3. **Predict:** The Draco-compressed GLB will be significantly smaller than an uncompressed version
4. **Verify:** Note the file size (Transfer Size column). Compare mentally to what a 35k-unit model would be uncompressed (typically 5-20x larger)
5. **What you learned:** Draco compression is a free performance win -- smaller download, same visual quality

### Exercise 3: CPU Throttle Test
1. Open Chrome DevTools, go to Performance tab
2. Click the gear icon and set "CPU: 6x slowdown"
3. Record a few seconds while scrolling the hero section
4. **Predict:** Frame times will increase, and you might see janky animation on the simulated slow device
5. **Verify:** Check the frame time chart -- each frame should ideally stay under 16.6ms for 60 FPS
6. **What you learned:** Performance testing on throttled hardware reveals bottlenecks that fast development machines hide

## Connections

- **Depends on:** [[threejs-scene-basics|Three.js Scene Basics]] because performance budgets constrain scene complexity decisions
- **Related:** [[postprocessing-bloom|Post-Processing (Bloom)]] because bloom is the most performance-sensitive effect in this project
- **Related:** [[camera-and-lighting]] because each light adds GPU computation per frame
- **Related:** [[threlte-svelte-bindings]] because dynamic import of Threlte components enables mobile skip

## Knowledge Check

1. What are draw calls and why should you minimize them? → See [What It Is](#what-it-is)
2. Why does this project render bloom at 256x256 instead of full resolution? → See [Worked Example](#worked-example)
3. What is Draco compression and why does the wagon model use it? → See [Worked Example](#worked-example)
4. How much time does a 60 FPS frame budget give you? → See [The Mental Model](#the-mental-model)
5. Why should 3D libraries be loaded with dynamic import on mobile? → See [Common Mistakes](#common-mistakes)

## Go Deeper

- [Three.js Performance Tips](https://threejs.org/manual/#en/optimize-lots-of-objects)
- [Chrome DevTools Performance Analysis](https://developer.chrome.com/docs/devtools/performance/)
