---
title: "Three.js Scene Basics"
domain: 3d-graphics
difficulty: 2
difficulty_label: intermediate
reading_time: 12
tags:
  - learn
  - 3d-graphics
  - intermediate
prerequisites:
  - "[[svelte-components]]"
date: 2026-04-08
---

# Three.js Scene Basics


## The Analogy

A 3D scene is like a database with three axes -- every object has an (x, y, z) address instead of a row number. Where SQL tables have rows and columns, a Three.js scene has a coordinate system where objects live at specific 3D positions. The Scene is the database itself, the Camera is the SELECT clause (what you choose to look at), and the Renderer is the query executor that turns data into a visible result on screen.

## What It Is

Three.js is a JavaScript library that draws 3D graphics in a web browser using WebGL (the browser's low-level GPU interface). You do not write WebGL directly -- Three.js abstracts it into a pipeline with three core objects:

1. **Scene** -- the container that holds every 3D object. Think of it as the root table. You add meshes (shapes), lights, and cameras to the scene. Anything not added to the scene is invisible.

2. **Camera** -- defines what part of the scene the viewer sees. A `PerspectiveCamera` simulates human vision with perspective (faraway objects look smaller). Its four parameters are: FOV (field of view angle), aspect ratio, near clipping plane, and far clipping plane.

3. **Renderer** -- takes the scene and camera, runs them through the GPU, and outputs a 2D image onto an HTML `<canvas>` element. This happens 60 times per second (or more) to create smooth motion.

Three.js also provides math utilities. **Vector3** represents a point or direction in 3D space with `(x, y, z)` coordinates. **CatmullRomCurve3** creates a smooth curve that passes through a series of Vector3 points -- like drawing a smooth line through a set of waypoints on a map.

## Why It Matters

3D on the web is increasingly expected in portfolio sites, product pages, and data visualizations. Understanding the Scene-Camera-Renderer pipeline answers the interview question "How does WebGL rendering work at a high level?" For clients, 3D elements create memorable, differentiated experiences that static pages cannot match. If you do not understand this pipeline, debugging a blank canvas or a mispositioned object becomes guesswork.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/three/scene-config.ts` | The `getSceneConfig()` function | Builds all 3D positions mathematically from a station count -- no hardcoded coordinates |
| `src/lib/motion/three/scene-config.ts` | `CatmullRomCurve3` and `Vector3` imports | Shows the actual Three.js math utilities creating smooth paths |
| `src/lib/motion/three/HeroScene.svelte` | The `<Canvas>` and `<T.PerspectiveCamera>` | The scene and camera configured declaratively via Threlte |
| `src/lib/motion/three/PostProcessing.svelte` | `scene.background = new Color('#141414')` | Shows how scene properties are set in code |

## The Mental Model

```
SQL analogy:

DATABASE (holds all tables)     ←→  Scene (holds all 3D objects)
SELECT columns FROM table       ←→  Camera (chooses what to look at)
Query executor → result set     ←→  Renderer → pixels on canvas

The render loop (runs 60x/second):

  1. Scene has objects at (x,y,z) positions
       ↓
  2. Camera defines viewpoint + field of view
       ↓
  3. Renderer projects 3D → 2D image
       ↓
  4. Image drawn to <canvas> element
       ↓
  5. Repeat next frame (requestAnimationFrame)

Coordinate system:

       Y (up)
       |
       |
       +------- X (right)
      /
     /
    Z (toward viewer)

  A Vector3(0, 0, 5) means:
    x=0 (centered),  y=0 (ground level),  z=5 (close to viewer)
```

## Worked Example

```typescript
// From: src/lib/motion/three/scene-config.ts
// This function builds 3D geometry from a station count.

import { Vector3, CatmullRomCurve3 } from 'three';

export function getSceneConfig(stationCount: number): SceneConfig {
  const nodeCount = stationCount + 2; // departure + stations + destination

  // --- Build points along a sine-arc path ---
  const primaryPoints: Vector3[] = [];

  for (let i = 0; i < nodeCount; i++) {
    // t goes from 0 to 1 across all nodes (like normalizing row numbers)
    const t = i / (nodeCount - 1);

    // X: spread evenly from left (-4.5) to right (4.5)
    const x = -4.5 + t * 9;

    // Y: sine wave creates a gentle arc -- peaks at center
    const y = Math.sin(t * Math.PI) * 1.2;

    // Z: slight variation for depth interest
    const z = -1 + Math.sin(t * Math.PI * 2) * 0.3;

    primaryPoints.push(new Vector3(x, y, z));
  }

  // CatmullRomCurve3: like fitting a smooth spline through data points
  // SQL analogy: like a moving average -- each point influences its neighbors
  const primaryPath = new CatmullRomCurve3(primaryPoints, false, 'catmullrom', 0.5);

  return {
    camera: {
      position: [0, 0, 5],  // Centered, at eye level, 5 units back
      fov: 50               // 50-degree field of view (moderate zoom)
    },
    primaryPath,
    // ...stationPositions and secondaryPaths
  };
}
```

The function takes a count (like `SELECT COUNT(*) FROM services`) and generates 3D coordinates mathematically. Each station gets a position along a sine-arc curve. The camera sits at `[0, 0, 5]` -- centered on X, centered on Y, 5 units toward the viewer on Z -- looking into the scene.

## Common Mistakes

1. **Nothing appears on screen:**
   - **What happens:** The canvas is blank -- no errors in console.
   - **Fix:** Check that objects are added to the Scene, the Camera is pointing at them (use `camera.lookAt(0, 0, 0)`), and the Renderer size matches the container.
   - **Why:** The camera might be looking away from the objects, or the objects exist outside the camera's near/far clipping range.

2. **Objects are tiny or invisible:**
   - **What happens:** You added a mesh but cannot see it.
   - **Fix:** Check the scale. In this project, the metro wagon model uses `scale={[0.0005, 0.0005, 0.0005]}` because the original model is enormous (35k unit bounding box).
   - **Why:** 3D models from different tools use different unit systems. A model built in millimeters looks galaxy-sized in a scene measured in meters.

3. **Confusing coordinate axes:**
   - **What happens:** An object appears to the left when you expected it above.
   - **Fix:** Remember Three.js convention: X = right, Y = up, Z = toward viewer. This is different from some 3D tools where Z is up.
   - **Why:** There is no universal standard. Three.js follows the OpenGL right-hand convention.

## Break It to Learn It

### Exercise 1: Move the Camera
1. Open `src/lib/motion/three/scene-config.ts`
2. Change `position: [0, 0, 5]` to `position: [0, 0, 50]`
3. **Predict:** What will happen to the 3D scene on the home page?
4. **Verify:** Run `bun run dev`, open `http://localhost:5173/`, observe the hero section
5. **What you learned:** The camera's Z position controls how far back you are from the scene -- like zooming out on a map
6. **Undo your change**

### Exercise 2: Flatten the Arc
1. Open `src/lib/motion/three/scene-config.ts`
2. Change `const y = Math.sin(t * Math.PI) * 1.2;` to `const y = 0;`
3. **Predict:** What will happen to the curved path of station nodes?
4. **Verify:** Run `bun run dev`, observe -- all nodes should be on a flat line instead of an arc
5. **What you learned:** The Y coordinate controls vertical position -- a sine wave creates the arc shape
6. **Undo your change**

### Exercise 3: Double the Depth Spread
1. Open `src/lib/motion/three/scene-config.ts`
2. Find `const z = -1 + Math.sin(t * Math.PI * 2) * 0.3;` and change `0.3` to `2.0`
3. **Predict:** The nodes will spread much further apart in depth (Z), making some appear closer and others further away
4. **Verify:** Run `bun run dev`, observe the scene -- nodes should look more dramatically layered in depth
5. **What you learned:** The Z axis creates depth perception -- small Z differences create subtle layering, large ones create dramatic parallax
6. **Undo your change**

## Connections

- **Depends on:** [[svelte-components]] because the scene is rendered inside Svelte components
- **Enables:** [[threlte-svelte-bindings]] because Threlte wraps these Three.js primitives in Svelte components
- **Enables:** [[camera-and-lighting]] because camera and lights are configured using these scene fundamentals
- **Enables:** [[postprocessing-bloom|Post-Processing (Bloom)]] because bloom operates on the rendered scene output
- **Related:** [[performance-budgets-3d|Performance Budgets for 3D]] because scene complexity directly impacts GPU performance

## Knowledge Check

1. What are the three core objects in the Three.js render pipeline? → See [What It Is](#what-it-is)
2. What does a Vector3 represent, and how is it different from a SQL row's primary key? → See [The Analogy](#the-analogy)
3. Why might a 3D model appear invisible even though it was added to the scene? → See [Common Mistakes](#common-mistakes)
4. What does CatmullRomCurve3 do, and what SQL concept is it analogous to? → See [Worked Example](#worked-example)
5. In Three.js coordinates, which axis points "up"? → See [The Mental Model](#the-mental-model)

## Go Deeper

- [Three.js Official Documentation -- Creating a Scene](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene)
- [Three.js Fundamentals (threejs.org)](https://threejs.org/manual/#en/fundamentals)
