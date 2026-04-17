---
title: "The 9-Signature Vocabulary"
domain: motion
difficulty: 2
difficulty_label: intermediate
reading_time: 6
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

# The 9-Signature Vocabulary

## The Analogy

A jazz band is not playing 40 instruments. It's playing 5–7, and deep fluency in those few is what makes the music sound like anything at all. If the band suddenly adds a sitar, an accordion, and a theremin "just this once," the sound gets muddled and nobody can play with confidence. yesid.dev's motion vocabulary is similarly closed: 9 signatures, each one mastered. Don't add a 10th.

## What It Is

Slice 17e defined the complete set of motion patterns the site is allowed to use. Nine signatures, distributed across three lanes (the [[snappy-doctrine]] lanes: interaction, scroll-scrub, idle ambient):

| # | Signature | Lane | Trigger | Primary consumer |
|---|---|---|---|---|
| 1 | Boop | Interaction | hover/click/focus | buttons, CTAs |
| 2 | Cursor glow + magnetic | Interaction | hover + pointer move | cards, CTAs, StackNodes |
| 3 | Wordmark hover | Interaction | hover | Nav + Footer "yesid." wordmark |
| 4 | SVG morph hover | Interaction | hover/tap | HomeServices panels |
| 5 | MetroNetwork hero scrub | Scroll-scrub | scroll (pinned) | Home page hero |
| 6 | DrawSVG scrub | Scroll-scrub | scroll (through section) | Blueprints on listing pages |
| 7 | Crescendo scrub | Scroll-scrub | scroll (through section) | Manifesto + rotated edge titles |
| 8 | LED pulse | Idle ambient | always (IO-gated) | status dots, stop-label glows |
| 9 | Typewriter idle | Idle ambient | on-load (one-shot) | Hero scroll prompt |

**The list is closed.** Adding a 10th signature requires an amendment to `docs/reference/CONSTITUTION.md` § Motion Doctrine.

## Why It Matters

A bounded vocabulary has two career-relevant effects:

- **Review gets fast.** When a PR introduces motion, the reviewer's first question is "which signature is this?". Either it maps to one of the 9 (approve the mapping, then review the implementation), or it doesn't (reject or amend). No bike-shedding on whether a particular wiggle is OK.
- **Users build mental models.** Visitors can't articulate "I noticed the cursor glow pattern on every card", but they experience the consistency as polish. Adding a new hover effect per section breaks that compounding trust.

The tradeoff: new visual ideas require amendment, not just implementation. That's the point — novelty has a cost, and you should be sure it's worth the review.

## How We Use It in This Project

| File | Signature | Notes |
|---|---|---|
| `src/lib/motion/actions/boop.ts` | 1 | hover-reset transform with 300ms timing |
| `src/lib/motion/actions/cursorGlow.ts` + `magnetic.ts` | 2 | paired on cards; disabled on touch |
| `src/lib/motion/actions/wordmarkHover.ts` | 3 | SplitText pool (4 effects) |
| `src/lib/motion/actions/morphHover.ts` | 4 | MorphSVG path-cycle on hover; mobile tap toggle |
| `src/lib/motion/scrubs/createHeroTimeline.ts` | 5 | 9-phase pin + zoom |
| `src/lib/motion/scrubs/createDrawScrub.ts` | 6 | factory; Blueprint scrub consumer |
| `src/lib/motion/scrubs/createCrescendoScrub.ts` | 7 | factory; Manifesto + rotated edge titles |
| `src/app.css` § LED pulse | 8 | global `@keyframes pulse-glow` |
| `src/lib/motion/utils/heroTypewriter.ts` | 9 | shared-ticker driven |

## The Mental Model

The doctrine lanes map to the vocabulary:

```
              INTERACTION                 SCROLL-SCRUB               IDLE AMBIENT
              (user input)                (scroll position)          (always, IO-gated)
                   │                              │                         │
       ┌───────────┼───────────┐      ┌───────────┼───────────┐   ┌────────┴────────┐
       ▼           ▼           ▼      ▼           ▼           ▼   ▼                 ▼
    1. boop   2. cursor-   3. wordmark  5. hero   6. drawSVG  7. crescendo  8. LED pulse  9. typewriter
              glow +       hover       scrub     scrub       scrub         (pulse-glow)  (heroTypewriter)
              magnetic     4. SVG morph
                           hover
```

Adding a new interaction? It must slot into 1–4. Adding a new scroll behavior? 5–7. Adding a new always-on visual? 8–9. If it doesn't fit, you're proposing a 10th signature — stop and write the amendment first.

## Worked Example

**Question:** I want to add a sparkle trail that follows the cursor as it moves across a card.

**Step 1: Which signature is this?** Interaction lane, trigger is pointer-move. Could be signature 2 (cursor glow) extended, or a 10th signature (sparkle trail).

**Step 2: Is it a sparkle-variant of cursor glow, or genuinely new?** If it's a glow with particles appended, it's signature 2 extended — add a `sparkles: true` param to `cursorGlow.ts`. If it's a trailing particle system (completely different mechanism — particles persist and decay), it's a 10th signature. Requires amendment.

**Step 3 (amendment path):** Write the amendment to `CONSTITUTION.md` § Motion Doctrine, add it to the 9-signature table, add it to `MOTION.md` § 4 (Interaction Actions), ship the action file, ship tests, document.

**Step 4 (variant path):** Extend `cursorGlow`. Document the new param in `MOTION.md`. No amendment needed.

The worked answer is: a particle sparkle trail is a signature 10. It would not pass the amendment review because (a) particles don't fit the "data infrastructure" brand aesthetic, and (b) particle systems are performance-expensive and would hurt mobile Perf. Path: don't add it.

## Common Mistakes

1. **"I'll just add one more action for this edge case"**
   - **What happens:** The 9-signature list becomes 12 over two quarters. Review gets slower because now every PR has to re-examine whether the new motion conflicts with existing vocabulary.
   - **Fix:** Resist. Either the effect maps to an existing signature (extend that one) or it requires an amendment.
   - **Why:** Bounded vocabulary only works if the bound holds.

2. **Conflating lane and signature**
   - **What happens:** You think "scroll-scrub is one signature" and try to handle the hero pin with `createDrawScrub`. The generic scrub can't do 9-phase pin + zoom, so you bolt-on and mangle the factory.
   - **Fix:** Signatures 5, 6, 7 are three distinct scroll-scrub behaviors. Use `createHeroTimeline` for pinned multi-phase (signature 5), `createDrawScrub` for path-draw (6), `createCrescendoScrub` for scale (7).
   - **Why:** Lane = *when* motion fires. Signature = *what kind* of motion. They're different axes.

3. **Adding a "temporary" motion during a demo/pitch**
   - **What happens:** Temporary becomes permanent. Now you have an undocumented 10th signature.
   - **Fix:** Put demo flourishes in a `/preview/*` route that's excluded from the main site IA, or don't ship them.

## Connections

- **Depends on:** [[snappy-doctrine]] — the lanes that partition the vocabulary
- **Enables:** [[scrub-factory-pattern]] (signatures 5–7 implementation), [[shared-ticker-pattern]] (signatures 8–9 implementation)
- **Related:** [[lazy-gsap-plugins]] — each signature's plugin dependencies are known, which is what makes lazy loading possible

## Knowledge Check

1. How many signatures are in the vocabulary? → 9.
2. What happens when I want to add a 10th? → Amendment to `CONSTITUTION.md` § Motion Doctrine required before implementation.
3. Where do scroll-scrub signatures live? → `src/lib/motion/scrubs/`.
4. Why is boop + magnetic two signatures instead of one? → Different triggers: boop is discrete (hover/click/focus) and short-lived; magnetic tracks continuous pointer movement.

## Go Deeper

- `docs/reference/CONSTITUTION.md` § 8 — Motion Doctrine governance
- `docs/reference/MOTION.md` v2.0 § 3–6 — per-signature API reference
