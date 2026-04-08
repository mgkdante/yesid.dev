---
title: "Camera and Lighting"
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
date: 2026-04-08
---

# Camera and Lighting


## The Analogy

The camera is the `SELECT` clause of your 3D query -- it determines what subset of the scene data you actually see. Lighting is the equivalent of formatting in a SQL report: the data (geometry) is the same, but how you illuminate it changes whether the result is readable or a useless blob. A query with no formatting is raw rows; a scene with no lighting is a black screen.

## What It Is

**Camera** defines the viewer's position, orientation, and how the 3D world projects onto a 2D screen. The most common type is `PerspectiveCamera`, which simulates how human eyes see: nearby objects appear larger, distant objects appear smaller.

A PerspectiveCamera has four key parameters:
- **FOV (field of view):** The vertical angle the camera sees, in degrees. Low FOV (20-35) = telephoto zoom, high FOV (90+) = wide-angle/fisheye. This project uses `35` for the wagon scene and `50` for the hero scene.
- **Position:** A Vector3 `[x, y, z]` defining where the camera sits in the scene.
- **lookAt:** A point the camera aims toward. `camera.lookAt(0, 0, 0)` means "point at the world origin."
- **Near/far clipping planes:** Objects closer than `near` or farther than `far` are invisible. Default is usually `0.1` to `1000`.

**Lighting** determines how surfaces are illuminated. Without light, everything is black. Three.js provides several light types:

- **AmbientLight:** Illuminates all objects equally from all directions. Like overhead office fluorescents -- no shadows, no drama, just base visibility. Use low intensity (0.1-0.4) as a fill.
- **DirectionalLight:** Parallel rays from one direction, like sunlight. Creates shadows and defines form. It has a `position` (which sets the direction the light comes from) and `intensity`.
- **PointLight:** Emits from a single point in all directions, like a light bulb. Falls off with distance.

## Why It Matters

Camera and lighting are the two controls that most affect how a 3D scene "feels" to a user. In interviews, questions like "How would you make this 3D product viewer feel premium?" come down to camera angle and lighting setup. For clients, the difference between a professional-looking 3D element and an amateur one is almost always lighting -- good lighting makes simple geometry look polished, while bad lighting makes detailed geometry look flat.

## How We Use It in This Project

| File | What to look at | Why it matters |
|------|----------------|----------------|
| `src/lib/motion/three/scene-config.ts` | `camera: { position: [0, 0, 5], fov: 50 }` | Hero scene camera -- centered, moderate zoom, positioned for overview |
| `src/lib/motion/three/HeroScene.svelte` | `<T.PerspectiveCamera makeDefault ...>` and `<T.AmbientLight intensity={0.1} />` | Declarative camera + minimal ambient light (bloom does the heavy lifting) |
| `src/lib/motion/three/WagonInner.svelte` | `<T.PerspectiveCamera ... position={[4, 3, 12]} fov={35}>` | Wagon camera -- offset for 3/4 angle, tight zoom |
| `src/lib/motion/three/WagonInner.svelte` | Three light declarations: two DirectionalLight + one AmbientLight | Three-light setup using brand colors for artistic illumination |

## The Mental Model

```
Camera parameters:

  FOV = 35 (tight)              FOV = 90 (wide)
  +--------+                    +------------------+
  |  sees  |                    |    sees a lot     |
  | a small|                    |   but distorted   |
  |  area  |                    |    at edges       |
  +--------+                    +------------------+

Camera position and lookAt:

        Camera at [4, 3, 12]
              *
             /
            /  ← camera looks toward origin
           /
          /
    [0,0,0] ← lookAt target (wagon sits here)


Three-light setup (from WagonInner.svelte):

  DirectionalLight #1          DirectionalLight #2
  position: [10, 15, 10]       position: [-5, 8, -5]
  color: #E07800 (orange)      color: #FFB627 (yellow)
  intensity: 2.5               intensity: 1.0
        ↘                         ↙
          ↘                     ↙
            ★ Wagon Model ★
                  ↑
           AmbientLight
           color: white
           intensity: 0.4
           (fills shadows so nothing is pure black)

SQL analogy:
  DirectionalLight = a WHERE clause highlighting specific rows
  AmbientLight     = a SELECT * that shows everything at base level
  Together         = a well-formatted report with emphasis and readability
```

## Worked Example

```svelte
<!-- From: src/lib/motion/three/WagonInner.svelte -->
<!-- Camera and lighting setup for the metro wagon model -->

<!-- Camera: front 3/4 angle matching the Sketchfab default POV —
     slightly elevated, looking down the length of the wagon -->
<T.PerspectiveCamera
  makeDefault
  position={[4, 3, 12]}
  fov={35}
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0);
  }}
/>

<!-- Lighting: three-light setup -->

<!-- Key light: strong orange directional from upper-right-front -->
<!-- This is the main light -- highest intensity, brand primary color -->
<T.DirectionalLight position={[10, 15, 10]} intensity={2.5} color="#E07800" />

<!-- Fill light: softer yellow from opposite side -->
<!-- Prevents the side facing away from key light from being pure black -->
<T.DirectionalLight position={[-5, 8, -5]} intensity={1} color="#FFB627" />

<!-- Ambient: low-intensity white fills remaining shadows -->
<!-- Without this, unlit surfaces would be completely invisible -->
<T.AmbientLight intensity={0.4} color="#ffffff" />
```

This is a classic **three-point lighting** setup adapted for web 3D:
1. **Key light** (strongest, brand orange) -- provides the main illumination and color
2. **Fill light** (moderate, brand yellow) -- fills shadows on the opposite side
3. **Ambient light** (weak, white) -- ensures nothing is pure black

The brand colors (#E07800 orange and #FFB627 yellow) are used as light colors. This makes the wagon model glow with the brand palette without needing colored materials on the model itself.

## Common Mistakes

1. **Scene is completely black:**
   - **What happens:** You see the canvas background color but no objects.
   - **Fix:** Add at least one light. Start with `<T.AmbientLight intensity={0.5} />` to confirm objects exist, then add directional lights for shape.
   - **Why:** Unlike the real world, a 3D scene starts with zero light. No light = no visible surfaces.

2. **Everything looks flat and washed out:**
   - **What happens:** Objects are visible but have no depth or form -- they look like cardboard cutouts.
   - **Fix:** Reduce ambient light intensity and add a directional light. The contrast between lit and shadowed surfaces is what creates the perception of 3D form.
   - **Why:** High ambient light illuminates everything equally, eliminating the shadows that your brain uses to interpret 3D shape.

3. **Camera shows nothing or shows the inside of an object:**
   - **What happens:** The view is either empty or filled with a single color (you are inside a mesh).
   - **Fix:** Check camera position and `lookAt` target. Use large position values first (like `[0, 0, 50]`) to zoom way out, find your objects, then move closer.
   - **Why:** If the camera is inside a mesh, you see the back-face of its surfaces (usually culled/invisible). If it is pointing the wrong way, the objects are behind you.

## Break It to Learn It

### Exercise 1: Remove All Lights
1. Open `src/lib/motion/three/WagonInner.svelte`
2. Comment out all three light lines (`T.DirectionalLight` and `T.AmbientLight`)
3. **Predict:** The wagon model will be completely invisible (black) against the dark background
4. **Verify:** Run `bun run dev`, navigate to the wagon preview page
5. **What you learned:** 3D scenes have zero default lighting -- you must explicitly add every light source
6. **Undo your change**

### Exercise 2: Make It Monochrome
1. Open `src/lib/motion/three/WagonInner.svelte`
2. Change both DirectionalLight `color` props from `"#E07800"` and `"#FFB627"` to `"#ffffff"`
3. **Predict:** The wagon will be lit with plain white light instead of warm orange/yellow brand tones
4. **Verify:** Run `bun run dev`, observe the difference -- the model should look "clinical" instead of warm
5. **What you learned:** Light color tints everything it touches -- colored lights are a powerful branding tool
6. **Undo your change**

### Exercise 3: Extreme Camera Position
1. Open `src/lib/motion/three/WagonInner.svelte`
2. Change `position={[4, 3, 12]}` to `position={[0, 50, 0]}`
3. **Predict:** You will see the wagon from directly above -- a bird's-eye view
4. **Verify:** Run `bun run dev`, observe -- the wagon should look like a floor plan from above
5. **What you learned:** Camera position dramatically changes the user's perception of the object -- a 3/4 angle feels natural, top-down feels architectural
6. **Undo your change**

## Connections

- **Depends on:** [[threejs-scene-basics|Three.js Scene Basics]] because cameras and lights are scene objects positioned with Vector3 coordinates
- **Related:** [[threlte-svelte-bindings]] because cameras and lights are configured as `<T>` components
- **Enables:** [[postprocessing-bloom|Post-Processing (Bloom)]] because bloom amplifies the bright areas that lighting creates
- **Related:** [[performance-budgets-3d|Performance Budgets for 3D]] because each light adds GPU computation cost

## Knowledge Check

1. What are the four key parameters of a PerspectiveCamera? → See [What It Is](#what-it-is)
2. Why does a scene with only AmbientLight look flat? → See [Common Mistakes](#common-mistakes)
3. What is the "three-point lighting" setup and how does this project implement it? → See [Worked Example](#worked-example)
4. How do brand colors get applied through lights instead of materials? → See [Worked Example](#worked-example)

## Go Deeper

- [Three.js PerspectiveCamera Documentation](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera)
- [Three.js Lights Introduction](https://threejs.org/manual/#en/lights)
