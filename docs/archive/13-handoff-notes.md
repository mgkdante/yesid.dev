# Slice 13 — Handoff Notes (accumulate during implementation)

## Transit Line Easter Eggs (session 2026-04-10)

- Replaced 4 generic numbered roundels (1, 2, 4) with 9 Montreal transit line easter eggs
- **STM Metro:** Ligne Bleue (#003DA5), Ligne Verte (#008F4F), Ligne Jaune (#F0CB00)
- **REM:** (#78BE20)
- **Exo trains:** 11 Vaudreuil/Hudson (#DA291C), 12 Saint-Jérôme (#009B3A), 13 Mont-Saint-Hilaire (#FFD100), 14 Candiac (#7B2D8E), 15 Mascouche (#0072CE)
- Each has a colored dot + line name, scattered at 9 positions around the manifesto edges
- Hidden on mobile (dot only, no text at ≤768px) — updated: text visible on mobile at 7px
- Data-driven via `manifestoContent.hiddenTransitLines` in content.ts
- Ligne Orange was already present in the bottom status bar

## Sharper Manifesto Elements (same session)

- Capability pills now match terminal prompt style (orange tint border/bg/text)
- Terminal prompt (`yesid@mtl`) opacity increased: cmd 0.65→0.85, text 0.4→0.6
- Pill hover brightens to 0.85 text / 0.4 border

## Next: Proof Reel (Section 3)

- Design spec: `docs/specs/2026-04-09-home-page-redesign.md` Section 3
- Plan: `docs/plans/2026-04-09-home-page-redesign.md` Sub-slice 13d
- Component: `ProofReel.svelte` — featured project cards with impact metrics
