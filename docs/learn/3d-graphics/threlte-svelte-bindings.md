---
title: "Threlte Svelte Bindings"
domain: 3d-graphics
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - 3d-graphics
  - intermediate
prerequisites:
  - "[[threejs-scene-basics]]"
  - "[[svelte-components]]"
date: 2026-04-08
---

# Threlte Svelte Bindings


## The Analogy

Threlte is like an ORM for Three.js -- write declarative components instead of imperative code. In SQL, an ORM lets you write `User.findById(1)` instead of raw `SELECT * FROM users WHERE id = 1`. Threlte does the same for 3D: instead of writing `const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000); scene.add(camera);`, you write `<T.PerspectiveCamera fov={50} />`. The component handles creation, updates, and cleanup automatically.

## What It Is

Threlte is a Svelte library that wraps Three.js objects as Svelte components. It provides two core pieces:

1. **`<Canvas>`** -- the top-level component that creates a Three.js WebGLRenderer, Scene, and animation loop. Every 3D object must be a child of `<Canvas>`. It is like the `<html>` tag of the 3D world -- nothing renders outside it.

2. **`<T>` (the universal component)** -- a generic component that creates any Three.js object. `<T.PerspectiveCamera>` creates a PerspectiveCamera. `<T.AmbientLight>` creates an AmbientLight. `<T.Group>` creates a Group (a container for other objects). Props on `<T>` map directly to the Three.js object's properties.

The key insight: **declarative vs imperative**. Imperative (raw Three.js) means you write step-by-step instructions: create object, set position, add to scene, update on change, remove on destroy. Declarative (Threlte) means you describe the desired state: "There should be a camera at position [0, 0, 5] with fov 50." Threlte handles the create/update/destroy lifecycle for you -- exactly like how Svelte handles DOM elements.

Threlte also provides hooks like `useThrelte()` (access the renderer, scene, camera from any child component) and `useTask()` (run code every animation frame).

## Why It Matters

Understanding the declarative vs imperative paradigm is fundamental to modern frontend development. Interviewers ask "Why use React/Svelte instead of vanilla JS?" The answer is the same reason you use Threlte instead of raw Three.js: managing complex state and lifecycle manually leads to bugs. For clients, Threlte means 3D features can be built, maintained, and updated by the same team that builds the rest of the Svelte UI -- no separate "3D specialist" needed for routine changes.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/three/HeroScene.svelte` | `import { Canvas, T } from '@threlte/core'` | The entry point -- Canvas wraps the entire 3D scene |
| `src/lib/motion/three/HeroScene.svelte` | `<T.PerspectiveCamera makeDefault position={...} fov={...}>` | Declarative camera setup -- props replace imperative constructor calls |
| `src/lib/motion/three/WagonInner.svelte` | `import { T, useTask } from '@threlte/core'` | Shows both declarative objects and the imperative escape hatch (useTask for animation) |
| `src/lib/motion/three/PostProcessing.svelte` | `const { scene, renderer, camera } = useThrelte()` | Accessing the shared scene context from a child component |

## The Mental Model

```
SQL ORM analogy:

Raw SQL:                              Raw Three.js:
  INSERT INTO cameras                   const cam = new PerspectiveCamera(50)
    (fov, x, y, z)                      cam.position.set(0, 0, 5)
    VALUES (50, 0, 0, 5);               scene.add(cam)
                                        // ...later: scene.remove(cam)

ORM:                                  Threlte:
  Camera.create({                       <T.PerspectiveCamera
    fov: 50,                              fov={50}
    position: [0, 0, 5]                   position={[0, 0, 5]}
  })                                    />
  // ORM handles INSERT + DELETE        // Threlte handles add + remove


Component tree maps to scene graph:

  <Canvas>                         ← Creates Renderer + Scene + loop
    ├── <T.PerspectiveCamera>      ← Added to scene automatically
    ├── <T.AmbientLight>           ← Added to scene automatically
    ├── <DataPaths />              ← Child component with more <T> objects
    ├── <StationNodes />           ← Child component with more <T> objects
    └── <PostProcessing />         ← Uses useThrelte() to access scene
```

## Worked Example

```svelte
<!-- From: src/lib/motion/three/HeroScene.svelte -->
<!-- This component creates the entire 3D hero background. -->

<script lang="ts">
  // Step 1: Import Canvas (the 3D root) and T (the universal component)
  import { Canvas, T } from '@threlte/core';
  // Step 2: Import scene configuration (positions, paths, camera settings)
  import { getSceneConfig } from './scene-config.js';
  import { services } from '$lib/data/services.js';

  // Step 3: Accept props -- scrollProgress drives the animation
  let {
    scrollProgress = 0,
    reducedMotion = false
  }: {
    scrollProgress?: number;
    reducedMotion?: boolean;
  } = $props();

  // Step 4: Build config once from data (like a pre-computed view)
  const config = getSceneConfig(services.length);
  const stationCount = services.length;

  // Step 5: Derive active station from scroll (like a computed column)
  let activeStation = $derived(Math.floor(scrollProgress * stationCount));
</script>

<!-- Step 6: Canvas creates the WebGL context and animation loop -->
<Canvas>
  <!-- Step 7: Camera -- declarative props replace imperative constructor -->
  <T.PerspectiveCamera
    makeDefault
    position={config.camera.position}
    fov={config.camera.fov}
    oncreate={(ref) => {
      ref.lookAt(0, 0, -1);
    }}
  />

  <!-- Step 8: A single ambient light for base illumination -->
  <T.AmbientLight intensity={0.1} />

  <!-- Step 9: Child components add their own <T> objects to the scene -->
  <DataPaths primaryPath={config.primaryPath} secondaryPaths={config.secondaryPaths}
    {scrollProgress} {reducedMotion} />

  <StationNodes positions={config.stationPositions}
    {activeStation} {reducedMotion} />

  <PostProcessing {reducedMotion} />
</Canvas>
```

Notice how the component reads like a description of the scene: "There is a canvas containing a camera, a light, some data paths, station nodes, and post-processing." Each child component adds its own 3D objects. When `scrollProgress` changes, Svelte reactivity updates the derived `activeStation`, which flows down to `StationNodes` -- the 3D scene updates automatically, just like a reactive SQL view.

## Common Mistakes

1. **Placing `<T>` components outside `<Canvas>`:**
   - **What happens:** Runtime error -- Threlte cannot find the scene context.
   - **Fix:** Every `<T.___>` component must be a descendant of `<Canvas>`. If you need to split into sub-components (like `DataPaths.svelte`), make sure they are rendered inside `<Canvas>`, not as siblings.
   - **Why:** `<Canvas>` provides the Three.js scene via Svelte context. Components outside it have no scene to attach to.

2. **Mixing imperative and declarative without escape hatches:**
   - **What happens:** You try to call `renderer.render()` directly -- nothing happens or double-renders occur.
   - **Fix:** Use `useThrelte()` to access the renderer, and `useTask()` to hook into the animation loop. See `PostProcessing.svelte` for the correct pattern.
   - **Why:** Threlte manages the render loop. Calling render manually conflicts with its scheduling.

3. **Forgetting `makeDefault` on the camera:**
   - **What happens:** The scene renders but from a default camera angle, ignoring your camera settings.
   - **Fix:** Add `makeDefault` prop to your `<T.PerspectiveCamera>`. This tells Threlte "use this camera for rendering."
   - **Why:** A scene can have multiple cameras. `makeDefault` designates the active one.

## Break It to Learn It

### Exercise 1: Remove the Canvas Wrapper
1. Open `src/lib/motion/three/HeroScene.svelte`
2. Remove the `<Canvas>` and `</Canvas>` tags (keep everything inside them)
3. **Predict:** The page will crash or show errors because `<T>` components have no scene context.
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/`, check the browser console for errors
5. **What you learned:** `<Canvas>` is mandatory -- it provides the WebGL context and scene that all child components need
6. **Undo your change**

### Exercise 2: Change the Camera FOV
1. Open `src/lib/motion/three/scene-config.ts`
2. Change `fov: 50` to `fov: 120`
3. **Predict:** The scene will look like a fisheye lens -- everything appears far away and distorted at the edges
4. **Verify:** Run `bun run dev`, observe the hero 3D background
5. **What you learned:** FOV (field of view) controls how much of the scene is visible -- like zooming out a camera lens
6. **Undo your change**

### Exercise 3: Comment Out the PostProcessing Component
1. Open `src/lib/motion/three/HeroScene.svelte`
2. Comment out `<PostProcessing {reducedMotion} />`
3. **Predict:** The scene will render without the glow effect, and the background color might change (PostProcessing sets `scene.background`)
4. **Verify:** Run `bun run dev`, compare the hero section -- it should look flatter without bloom
5. **What you learned:** Each child component contributes to the final scene -- removing one changes the visual output
6. **Undo your change**

## Connections

- **Depends on:** [[threejs-scene-basics|Three.js Scene Basics]] because Threlte wraps Three.js objects -- you need to know what they are before using the wrapper
- **Depends on:** [[svelte-components]] because Threlte uses Svelte's component model, props, and reactivity
- **Enables:** [[camera-and-lighting]] because cameras and lights are configured as Threlte `<T>` components
- **Enables:** [[postprocessing-bloom|Post-Processing (Bloom)]] because bloom is composed into the scene as a Threlte component
- **Related:** [[performance-budgets-3d|Performance Budgets for 3D]] because the number of `<T>` components affects GPU workload

## Knowledge Check

1. What is the difference between imperative Three.js and declarative Threlte? → See [What It Is](#what-it-is)
2. Why must all `<T>` components be children of `<Canvas>`? → See [Common Mistakes](#common-mistakes)
3. What does `makeDefault` do on a camera component? → See [Common Mistakes](#common-mistakes)
4. How does Threlte compare to an ORM in the SQL world? → See [The Analogy](#the-analogy)

## Go Deeper

- [Threlte Official Documentation](https://threlte.xyz/docs)
- [Three.js Official Documentation](https://threejs.org/docs/)
