---
title: "The Shared Ticker Pattern"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 7
tags:
  - learn
  - motion
  - intermediate
  - slice-17e
prerequisites:
  - "[[snappy-doctrine]]"
date: 2026-04-17
slice: 17e-6
---

# The Shared Ticker Pattern

## The Analogy

A cron job runs on a schedule — once per minute, it wakes up, loops through registered jobs, runs each one, and goes back to sleep. `gsap.ticker` is the cron, fired ~60 times per second. Each subscriber is a cron job. Without a shared ticker, every component that needs a per-frame callback would spawn its own `setInterval(..., 16)` — you'd end up with 50 cron daemons running instead of one daemon with 50 jobs.

## What It Is

A single `gsap.ticker.add` callback registered at module load, which fans out to all subscribers via a `Map<string, Callback>`:

```ts
// src/lib/motion/utils/ticker.ts
const subscribers = new Map<string, Callback>();
let internalSubscription = null;

function ensureTickerSubscription(): void {
  if (internalSubscription) return;
  internalSubscription = (time, deltaTime) => {
    subscribers.forEach((fn) => fn(time, deltaTime));
  };
  gsap.ticker.add(internalSubscription);
}

export function subscribe(id, fn) {
  ensureTickerSubscription();
  subscribers.set(id, fn);
  return () => unsubscribe(id);
}

export function unsubscribe(id) {
  subscribers.delete(id);
}
```

Consumers register with a string ID. Subscribing with an existing ID replaces the previous callback (idempotent — safe to re-call).

**One critical detail:** `deltaTime` is in **milliseconds**, not seconds. (~16.67 at 60fps.) Getting this wrong makes frame-rate-dependent code run at the wrong speed — see the [[snappy-doctrine]] doc's worked example of the typewriter ms/sec unit bug.

## Why It Matters

Per-component `requestAnimationFrame` loops:

- Add up. 5 components × one RAF each = 5 function-call overheads per frame + 5 browser-scheduler entries.
- Are hard to pause in aggregate. "Pause all motion when the user opens a modal" is a per-loop change across 5 places instead of one toggle on the shared ticker.
- Don't pause when offscreen unless you do it yourself. On mobile, a canvas painting every frame while the user is 2 sections down burns battery for no visible benefit.

The shared ticker centralizes the scheduling + makes the offscreen-pause pattern cheap: each subscriber early-returns if `!isVisible`.

## How We Use It in This Project

| File | Subscriber ID | What it does | IO-gated? |
|---|---|---|---|
| `src/lib/motion/utils/heroTypewriter.ts` | `typewriter-N` | Advances one character every 80ms during hero type-sequence; unsubscribes on completion | No (one-shot) |
| `src/lib/components/home/ManifestoCanvas.svelte` | `manifesto-canvas` | Paints the circuit-node canvas (heavy) | Yes — early-returns when Manifesto section offscreen |
| `src/lib/components/about/AboutTrain.svelte` | `about-train` | Advances the train angle + draws on canvas | Yes — early-returns when card offscreen |

Pre-17e, each of these had its own `requestAnimationFrame(loop)` self-recursion. Post-17e-5, the site has **one RAF** (GSAP's ticker) with up to N subscribers.

## The Mental Model

```
                      gsap.ticker (one RAF)
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          internal       (GSAP's own    (ScrollTrigger's
          callback       tweens)         own updates)
              │
              ▼
         subscribers Map
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  typewriter  manifesto  about-train
  -canvas     -canvas    (loop fn)
              (IO check  (IO check
               early     early
               return)   return)
```

### IO-gate pattern

For subscribers that shouldn't run while offscreen:

```ts
let isVisible = false;
let observer: IntersectionObserver | null = null;
const SUB_ID = 'my-component';

function tick(_time, deltaTime) {
  if (!isVisible) return;   // ← early-return is cheap; the subscription
                            //    itself stays registered
  // ... paint / advance state ...
}

onMount(() => {
  observer = new IntersectionObserver(
    (entries) => { isVisible = entries[0].isIntersecting; },
    { rootMargin: '50px' },  // resume slightly before entering viewport
  );
  observer.observe(sectionEl);
  subscribe(SUB_ID, tick);
});

onDestroy(() => {
  unsubscribe(SUB_ID);
  observer?.disconnect();
});
```

Why not unsubscribe+re-subscribe on visibility change? Because Map insert/delete has churn cost and the early-return is essentially free. The subscription stays stable; only the work inside changes.

## Worked Example

**Migrating a `setInterval`-based carousel to the IO-gated pattern** (adapted from `AboutTestimonials.svelte`):

Before (always-on setInterval):

```ts
let intervalId;
const ROTATE_MS = 6000;

function startTimer() {
  stopTimer();
  intervalId = setInterval(() => {
    if (!paused) activeIndex = (activeIndex + 1) % testimonials.length;
  }, ROTATE_MS);
}

onMount(() => startTimer());
onDestroy(() => stopTimer());
```

This keeps ticking even while the user is scrolled past the carousel.

After (IO-gated):

```ts
let visibilityObserver: IntersectionObserver | null = null;
let isVisible = false;

onMount(() => {
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible) startTimer();
      else stopTimer();
    },
    { rootMargin: '100px' },
  );
  if (rootEl) visibilityObserver.observe(rootEl);
});

onDestroy(() => {
  stopTimer();
  visibilityObserver?.disconnect();
});
```

Note this one still uses `setInterval` (discrete-second semantics are cleaner than accumulator logic for a 6-second rotation), but IO gates its START/STOP. That's different from the ticker pattern (which keeps subscription stable, gates the work inside). Both are valid; use whichever matches the work.

**Rule of thumb:** RAF-shaped work (60fps canvas paint, smooth animation) → shared ticker + early-return IO-gate. Discrete-second work (carousel rotate, countdown) → setInterval + start/stop IO-gate.

## Common Mistakes

1. **Assuming `deltaTime` is in seconds**
   - **What happens:** Your 80ms-per-char typewriter completes in one frame because `16.67 >= 0.08` is true.
   - **Fix:** Compare to `80` (ms), not `0.08` (seconds). The GSAP ticker contract is consistent with `setInterval(fn, ms)` — all time values in ms.
   - **Why:** GSAP's own internal tweens use seconds for durations, but the ticker callback reports frame time in ms. Yes, it's confusing.

2. **Subscribing without guarding unmount-during-await**
   - **What happens:** A component unmounts mid-onMount (test teardown, fast route transition) but your subscription writes to a now-null DOM ref.
   - **Fix:** After `await loadX()`, re-check the binding before calling subscribe: `if (!container) return;`
   - **Why:** Svelte doesn't abort an in-flight `onMount` on unmount; your code has to guard.

3. **Unsubscribing outside onDestroy**
   - **What happens:** Route changes orphan subscriptions. After visiting `/` three times, three typewriter callbacks run in parallel racing to write textContent.
   - **Fix:** Always `unsubscribe(id)` from the component's `onDestroy`. Subscription IDs per-instance if a component might mount multiple times on the same page.
   - **Why:** The shared ticker keeps references alive until explicitly removed.

4. **Writing CSS-cheap ambient work to the ticker**
   - **What happens:** You subscribe a 1-line "pulse this dot's opacity" callback that CSS `@keyframes` + `animation:` would do for free.
   - **Fix:** If the work is expressible in a CSS keyframe, use CSS. Reserve the ticker for work that needs JS (canvas painting, reading scroll/pointer state).
   - **Why:** CSS animations run on the compositor thread; ticker callbacks run on main. Don't steal main-thread time for work the compositor can handle.

## Connections

- **Depends on:** [[snappy-doctrine]] (idle-ambient lane justification)
- **Enables:** Single point of control for pause-all-motion site-wide
- **Related:** [[lazy-gsap-plugins]] — the ticker lives inside gsap.ts, so it's always available once anything imports GSAP

## Knowledge Check

1. How many `requestAnimationFrame` loops does the site run? → One (the shared ticker's). Every consumer is a subscriber.
2. What unit is `deltaTime`? → Milliseconds. Compare accumulator thresholds in ms.
3. How do you pause a subscription while offscreen without the re-subscribe churn? → `isVisible` flag + early-return in the callback; IntersectionObserver updates the flag.
4. When should I use `setInterval` instead of the shared ticker? → For discrete-second work (carousel, countdown) where accumulator logic is clumsier than `setInterval(fn, 1000)`.

## Go Deeper

- `docs/reference/MOTION.md` § 7 — shared ticker API
- GSAP ticker docs: https://gsap.com/docs/v3/GSAP/gsap.ticker
- `src/lib/motion/utils/ticker.ts` — the implementation (< 60 lines)
