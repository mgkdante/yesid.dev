---
title: "Post-Processing (Bloom)"
domain: 3d-graphics
difficulty: 3
difficulty_label: advanced
reading_time: 14
tags:
  - learn
  - 3d-graphics
  - advanced
prerequisites:
  - "[[threejs-scene-basics]]"
date: 2026-04-08
---

# Post-Processing (Bloom)


## The Analogy

Post-processing is like applying a SQL view on top of a base query. The base query (Renderer) produces raw rows (pixels). The view (EffectComposer) takes those rows and applies transformations -- filtering, highlighting, enriching -- before the final result reaches the user. Bloom specifically is like adding a `CASE WHEN brightness > threshold THEN glow(value) END` to every pixel -- bright areas get amplified into a soft halo, making lights look like they are radiating energy.

## What It Is

Post-processing is a technique where, instead of rendering the scene directly to the screen, you render it to an off-screen buffer (texture), then apply image effects to that texture before displaying the final result. The `postprocessing` library provides this pipeline.

The core components:

1. **EffectComposer** -- manages the pipeline of passes. It takes the renderer and orchestrates the sequence: "first render the scene, then apply bloom, then output to screen." Think of it as a stored procedure that chains multiple transformations.

2. **RenderPass** -- the first pass in the pipeline. It renders the scene and camera to a texture (framebuffer). This is the "base query" that produces the raw 3D image.

3. **BloomEffect** -- the visual effect that creates "glow." It works by:
   - Extracting pixels brighter than a threshold (`luminanceThreshold`)
   - Blurring those bright pixels with a Gaussian blur (`kernelSize`)
   - Compositing the blurred bright pixels back onto the original image at a given `intensity`
   - The result: bright objects appear to emit light into surrounding dark areas

4. **EffectPass** -- wraps one or more effects (like BloomEffect) into a render pass that the composer can execute.

The pipeline runs every frame, replacing the default render loop.

## Why It Matters

Post-processing is what separates "looks like a game from 2005" from "looks like a modern cinematic experience." Understanding it answers interview questions about GPU rendering pipelines and image-space effects. For clients, bloom and other post-processing effects make 3D elements feel premium and intentional -- the difference between a science fair demo and a polished product.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/three/PostProcessing.svelte` | The entire file (75 lines) | Self-contained post-processing setup for the hero scene |
| `src/lib/motion/three/PostProcessing.svelte` | `autoRender.set(false)` | Disables Threlte's default rendering so the composer takes over |
| `src/lib/motion/three/PostProcessing.svelte` | `BloomEffect` configuration | Shows the specific bloom parameters tuned for this project |
| `src/lib/motion/three/HeroScene.svelte` | `<PostProcessing {reducedMotion} />` | Bloom is composed into the scene as a child component |
| `src/tests/setup.ts` | `vi.mock('postprocessing', ...)` | Shows how the post-processing library is mocked for unit tests (WebGL unavailable in jsdom) |

## The Mental Model

```
Default rendering (without post-processing):

  Scene + Camera → Renderer → Screen
  (one step, direct output)

With post-processing:

  Scene + Camera → RenderPass → [texture in memory]
                                      ↓
                               BloomEffect
                               (extract bright pixels,
                                blur them, composite)
                                      ↓
                               EffectPass → Screen

SQL analogy:

  Base query:   SELECT * FROM scene_pixels;
  With bloom:   SELECT *, glow(brightness) FROM scene_pixels
                WHERE brightness > threshold;
  Final:        MERGE base_pixels WITH bloom_pixels;


Bloom pipeline in detail:

  1. Render scene to texture A
  2. Extract pixels where luminance > threshold → texture B
  3. Blur texture B (Gaussian, at reduced resolution for speed)
  4. Add texture B back onto texture A (bright areas now "glow")
  5. Output to screen

  ┌──────────────────────────────────────────┐
  │ Original render (texture A)              │
  │   ★ bright node                          │
  │   • dim area                             │
  │                                          │
  │ After bloom:                             │
  │   ✦ bright node + soft glow halo         │
  │   • dim area (unchanged)                 │
  └──────────────────────────────────────────┘
```

## Worked Example

```typescript
// From: src/lib/motion/three/PostProcessing.svelte
// This component replaces Threlte's default render loop with a
// custom EffectComposer pipeline that adds bloom.

import { useThrelte, useTask } from '@threlte/core';
import { EffectComposer, EffectPass, RenderPass, BloomEffect, KernelSize } from 'postprocessing';

// Step 1: Access the shared scene context from Threlte
const { scene, renderer, camera, size, renderStage, autoRender } = useThrelte();

// Step 2: Set the scene background (dark gray matching the site theme)
scene.background = new Color('#141414');

// Step 3: Create the EffectComposer — it manages the render pipeline
const composer = new EffectComposer(renderer);

function setupPasses(cam: Camera) {
  composer.removeAllPasses();

  // Step 4: RenderPass — the "base query" that renders the scene normally
  composer.addPass(new RenderPass(scene, cam));

  // Step 5: Skip bloom for users who prefer reduced motion
  if (!reducedMotion) {
    composer.addPass(
      new EffectPass(
        cam,
        new BloomEffect({
          intensity: 1.2,             // How strong the glow is (1.0 = natural)
          luminanceThreshold: 0,       // Apply to ALL pixels (0 = everything)
          luminanceSmoothing: 0.08,    // Smooth transition at threshold edge
          mipmapBlur: true,            // Use mipmap-based blur (faster)
          kernelSize: KernelSize.MEDIUM, // Blur radius (SMALL/MEDIUM/LARGE/HUGE)
          height: 256,                 // Half-resolution for performance
          width: 256                   // (MOTION.md S6 constraint)
        })
      )
    );
  }
}

// Step 6: Disable Threlte's automatic rendering — we render manually
onMount(() => {
  const prev = autoRender.current;
  autoRender.set(false);
  return () => autoRender.set(prev); // Restore on destroy
});

// Step 7: Render via the composer every frame instead of the default renderer
useTask(
  (delta) => { composer.render(delta); },
  { stage: renderStage, autoInvalidate: false }
);
```

Key decisions in this setup:
- `luminanceThreshold: 0` means all pixels get bloom, not just bright ones. This creates a soft, dreamy atmosphere rather than targeted glare.
- `height: 256, width: 256` renders the bloom at quarter resolution for GPU performance. Bloom is a blurred effect anyway, so low resolution is invisible.
- `reducedMotion` skips bloom entirely -- accessibility comes before aesthetics.

## Common Mistakes

1. **Double rendering (scene renders twice):**
   - **What happens:** Performance drops and the scene may flicker. GPU usage doubles.
   - **Fix:** Call `autoRender.set(false)` before starting the composer. Restore the original value on component destroy.
   - **Why:** If Threlte's default renderer AND your EffectComposer both render, the scene is drawn twice per frame. Only one should control the render loop.

2. **Bloom applied but invisible:**
   - **What happens:** You added BloomEffect but nothing glows.
   - **Fix:** Check `luminanceThreshold`. If it is set to `0.9` and your brightest pixel is `0.7`, nothing passes the threshold. Start with `0` to confirm bloom works, then raise the threshold.
   - **Why:** Bloom only amplifies pixels above the threshold. If your lights are dim or your materials are dark, nothing qualifies.

3. **Massive GPU cost from bloom:**
   - **What happens:** Frame rate drops to 15-20 FPS, especially on mobile.
   - **Fix:** Reduce bloom resolution (`height`/`width`) to 128 or 256. Use `KernelSize.SMALL`. Consider skipping bloom entirely on mobile via dynamic import.
   - **Why:** Bloom involves multiple Gaussian blur passes. Each pass reads/writes pixels. Higher resolution means exponentially more pixels to process.

## Break It to Learn It

### Exercise 1: Crank Up the Bloom
1. Open `src/lib/motion/three/PostProcessing.svelte`
2. Change `intensity: 1.2` to `intensity: 5.0`
3. **Predict:** The entire scene will be overwhelmed with glow -- bright areas will bleed dramatically into dark areas
4. **Verify:** Run `bun run dev`, observe the hero section -- it should look overexposed, like looking at a bright light
5. **What you learned:** Bloom intensity controls how much the blurred bright pixels are amplified -- subtle values (0.5-1.5) look natural, high values create deliberate stylization
6. **Undo your change**

### Exercise 2: Disable Bloom (Keep RenderPass)
1. Open `src/lib/motion/three/PostProcessing.svelte`
2. In `setupPasses`, comment out the entire `if (!reducedMotion)` block that adds the EffectPass with BloomEffect
3. **Predict:** The scene will render normally through the composer but without any glow effect
4. **Verify:** Run `bun run dev`, compare -- station nodes and paths should look sharper/flatter without the soft glow
5. **What you learned:** RenderPass alone produces the same output as the default renderer -- bloom is an additive layer on top
6. **Undo your change**

### Exercise 3: Check the Reduced Motion Path
1. Open `src/lib/motion/three/PostProcessing.svelte`
2. Temporarily change the `reducedMotion` prop default from `false` to `true` (or pass `reducedMotion={true}` from HeroScene)
3. **Predict:** The scene will render without bloom, matching what users with `prefers-reduced-motion` see
4. **Verify:** Run `bun run dev`, observe -- the scene should still render but without the glow halo
5. **What you learned:** Accessibility features need testing -- reduced motion users get a functional but simplified visual experience
6. **Undo your change**

## Connections

- **Depends on:** [[threejs-scene-basics|Three.js Scene Basics]] because the EffectComposer operates on the scene and camera from the Three.js pipeline
- **Related:** [[threlte-svelte-bindings]] because `useThrelte()` provides the context needed by the composer
- **Related:** [[camera-and-lighting]] because bright lights are what bloom amplifies -- without bright sources, bloom has nothing to work with
- **Related:** [[performance-budgets-3d|Performance Budgets for 3D]] because bloom is one of the most GPU-expensive effects and must be budgeted carefully

## Knowledge Check

1. What are the four components of the post-processing pipeline (Composer, RenderPass, BloomEffect, EffectPass)? → See [What It Is](#what-it-is)
2. Why does the PostProcessing component call `autoRender.set(false)`? → See [Common Mistakes](#common-mistakes)
3. What does `luminanceThreshold: 0` mean for bloom behavior? → See [Worked Example](#worked-example)
4. How does this project handle bloom for users who prefer reduced motion? → See [Worked Example](#worked-example)
5. Why is bloom rendered at 256x256 resolution? → See [Worked Example](#worked-example)

## Go Deeper

- [postprocessing library documentation](https://github.com/pmndrs/postprocessing)
- [Three.js Post-Processing Guide](https://threejs.org/manual/#en/post-processing)
