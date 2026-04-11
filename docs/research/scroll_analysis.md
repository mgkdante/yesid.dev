# Scroll Position & User State Analysis — Section 4 (Services Grid)

*Generated: 2026-04-10 | Context: Slice 13g Services Grid planning*
*Sources: NN/g, Smashing Magazine, UX research publications*

---

## Executive Summary

By Section 4 of the yesid.dev home page, the visitor is **convinced but transitioning to evaluation mode**. Three dense, kinetic sections have impressed them. Now they want to self-select: "Which of these services applies to ME?" The design must respect their depleted attention budget by being the most scannable, structured, and breathing section on the page.

---

## 1. Attention Curve at Section 4

### NN/g Eyetracking Data

- **57% of viewing time** concentrates above the fold
- **74% within first two screenfuls**, 81% within three
- Attention drops sharply after fold, then gradually
- Users who scroll past 2-3 screenfuls are **committed** — they passed the "bounce or stay" gate

### Key Insight

By Section 4 (~4th-5th screenful), you're dealing with a **self-selected engaged audience**. They chose to keep going. However, attention per section is declining — the visitor is interested but becoming more **selective** about what earns their focus.

---

## 2. Emotional Arc Through the Page

| Section | Emotional Effect | Cognitive Load | Visitor's Internal State |
|---------|-----------------|----------------|--------------------------|
| **Hero** (animated metrics, SQL panel) | Awe + credibility | HIGH — dense animation, visual complexity | "This person is serious" |
| **Manifesto** (SplitText + transit HUD) | Conviction + clarity | MEDIUM — single statement, scroll-driven | "I know what he does" |
| **Proof Reel** (3 project cards) | Validation + trust | MEDIUM-HIGH — reading metrics, parsing cards | "The work backs it up" |
| **→ Services Grid** | Self-interest + evaluation | Should be LOW | "What can you do for ME?" |

### The Critical Transition

The dominant feeling arriving at Section 4 is: *"OK, I believe you're legit. Now what can you do specifically for ME?"*

This is the classic shift from **admiration to self-interest** — what information scent theory calls "foraging for relevance."

---

## 3. Information Scent at This Scroll Depth

**Information scent** (NN/g) says users scan for cues that the next content is **worth their remaining attention**.

After 3 high-energy sections, the visitor's internal question shifts from "Is this person impressive?" to "Does this person solve MY problem?"

The services grid must provide **strong scent**:
- Clear labels and recognizable service names
- Benefit-oriented language
- Obvious clickability to detail pages

**If services feel vague or generic, the scent breaks and the user bounces.**

---

## 4. Energy Level: The Page Must Exhale

### Cognitive Load Theory

Smashing Magazine's research on cognitive overload confirms that users hit fatigue after processing dense visual information. Three sections of kinetic animation, bold statements, and impact metrics create cumulative cognitive load.

### The Prescription

The services section should function as a **palette cleanser**:
- Structured and scannable
- Lower animation intensity
- The page "exhaling" after three intense breaths

**This does NOT mean boring.** It means:
- Grid structure provides visual rest
- Clear typography does the work
- Animation is subtle (staggered fade-in, not cinematic)
- The visitor's brain shifts from "experiencing" to "evaluating"

---

## 5. Actionable Design Principles

1. **Lead with benefits, not service names.** The visitor is in "what's in it for me?" mode.
2. **Generous whitespace.** After three dense sections, breathing room signals organization.
3. **Low-key animation.** Simple staggered scroll-entrance (200-300ms stagger). No SplitText, no parallax, no cinematic reveals.
4. **High information density per card, low visual density.** Title + one-line benefit + icon. No paragraphs.
5. **Clear exit paths.** Each card links to `/services/[id]`. Strong scent = user knows clicking gives them what they want.
6. **Visual contrast from previous sections.** Proof Reel used dark cards with B&W images; services grid should feel lighter or use brand orange more structurally (borders, icons) to signal a new "mode."

---

## Sources

- [Scrolling and Attention — NN/g](https://www.nngroup.com/articles/scrolling-and-attention/)
- [Scrolling and Attention (Original Research) — NN/g](https://www.nngroup.com/articles/scrolling-and-attention-original-research/)
- [Information Scent: How Users Decide Where to Go Next — NN/g](https://www.nngroup.com/articles/information-scent/)
- [Minimize Cognitive Load to Maximize Usability — NN/g](https://www.nngroup.com/articles/minimize-cognitive-load/)
- [Reducing Cognitive Overload for Better UX — Smashing Magazine](https://www.smashingmagazine.com/2016/09/reducing-cognitive-overload-for-a-better-user-experience/)
- [The Psychology of Scroll — Webwave](https://webwave.me/blog/the-psychology-of-scroll)
- [Landing Page Structure — involve.me](https://www.involve.me/blog/landing-page-structure)
