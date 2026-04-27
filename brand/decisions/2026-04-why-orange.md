# why orange

**Date:** 2026-04-18
**Decision type:** Brand identity
**Status:** Accepted

## Context

I needed to pick a brand color for a freelance digital-infrastructure practice. The color would carry through a portfolio site, client-facing communication, logos, and — eventually — Alto / CDPQ Infra hiring applications. One hue, in use everywhere. The wrong choice would be hard to walk back.

The constraints were specific:

- The practice works on SQL, pipelines, observability, and operational systems. Infrastructure, not UI.
- Primary audience: hiring managers at infrastructure-leaning companies (transit ops, public infra, CDPQ's portfolio), plus freelance clients in Montreal.
- The site uses a dark-first theme. The color needed to clear WCAG AA on a `#141414` background.
- I wanted one brand hue, not a palette. Discipline over variety.

## Options considered

### Blue

The default for enterprise software. Trustworthy, neutral, forgettable. If I picked blue, no one would notice the color at all — which is fine for a brand that competes on enterprise recognition (Oracle, IBM, Salesforce) but not for a solo practice that needs to be remembered after one click.

### Red

Wrong signal. Red reads as error, alert, or danger in infrastructure contexts. A practice that says "data pipelines that don't break" using a red brand color tells the reader "this is urgent" before it tells them anything else.

### Purple

Wrong category signal. Purple reads as design studio, agency, or creative tools (Figma, Vercel, Stripe's purple-leaning gradients). I needed the site to read as infrastructure, not as a brand studio.

### Orange (`#E07800`)

Transit signalling. Construction signalling. Warmth at the same time. The specific hue `#E07800` isn't a traffic cone — it's closer to a subway-signage orange, warm but utility-first. On a near-black dark surface it's readable at body-text contrast (~5.3:1) with a warm visual weight that reads as industrial rather than decorative.

Plus: paired with `#FFB627` yellow as an accent, the combination reads as caution-tape adjacent without being literal hazard stripes. Honest about the work (infrastructure has failure modes; the brand doesn't pretend otherwise).

## Decision

`#E07800` orange as `--primary`. `#FFB627` yellow as `--accent`. Both static — they do not theme-switch. Dark-theme hover variants: `#C96A00` primary, `#E5A220` accent.

Single-hue discipline: `--primary` is the **only** interactive brand color. Every other surface — background, text, border, card, terminal, manifesto — uses a semantic token that theme-switches. No second brand hue for "secondary actions." If a surface wants orange, the question is whether it's interactive. If not, the answer is no.

## Rationale

1. **Transit + construction signalling matches the practice.** The brand narrative around pipelines, journeys, stations, and reliability comes from transit metaphors (MetroNetwork hero, "STOP NN" labels, Closer Terminus). Orange in that context reads as station signage, not a design choice.

2. **High contrast on dark.** `#E07800` on `#141414` clears WCAG AA for body text (~5.3 : 1) and AAA for large text. This was a hard constraint — the hue couldn't be chosen for aesthetics and then patched for a11y.

3. **Light-theme friendly too.** `#E07800` on `#FAFAF8` light theme hits the AA threshold for large text (~3.1 : 1). Not as strong as dark, but adequate for buttons / links where it appears at 14px+ size.

4. **Reserved = memorable.** If orange were used for decoration, it would become visual wallpaper. Restricting it to interactive surfaces — and nothing else — means any orange pixel on the page is something the user can act on. That's a brand and a UX rule at the same time.

5. **Pairing yellow is optional, not required.** `#FFB627` exists for selection highlights and rare accent details. Most pages never show it. That's by design — two hues, but only one does heavy lifting.

## Consequences

- `foundations/color.md` codifies "orange is only for interactive surfaces" as a principle. Every PR that adds an orange element is reviewed against whether the element is interactive.
- Contrast checks on any new text/background pair compare against `--primary` first, because that's the brand-critical pair.
- New semantic roles (e.g., a future "live data" indicator) get a new semantic token, not a new brand hue. Orange stays fixed.
- Any future re-skin (light theme, print stylesheet, email template) picks up this palette via the tokens. The brand color does not re-resolve per surface.
- This decision implicitly binds the next one: `--accent` yellow also stays reserved — it does not become a body-text color or a generic highlight.

## What this decision prevents

Inventing a third, fourth, fifth "just for this one case" brand hue. Every solo brand that drifts does so because an adjacent project needed a slightly different color and no one said no. The single-orange rule is the fence that stops that drift.

## Revisit trigger

This decision gets reopened if:

- The site adds a second theme that cannot clear WCAG AA with the current hues (hypothetical — e.g., a "paper" print mode).
- A client relationship requires co-branded material where the two brands' primaries clash visibly.
- A second yesid. product launches that needs distinct color identity.

Nothing else is a revisit trigger.
