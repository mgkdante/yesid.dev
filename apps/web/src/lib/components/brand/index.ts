// Brand primitives barrel export.
// Built in Slice 17a-2a; wired into consumers in 17a-2b; expanded in 17d (MetroStation, SectionHeading, SvgIcon).
// GlowOverlay removed in slice-design Child 2 (0 consumers; glow effect lives in motion/actions/cursorGlow.ts).
//
// Migrated to shadcn ui/ in 17d (don't import from here — use the ui/ equivalent):
//   Tag → ui/badge, NumberBadge → ui/badge,
//   HazardStripe → ui/separator, GradientSeparator → ui/separator,
//   BrandButton → ui/button, CardBase → ui/card.

export { BlueprintShell, ChevronToggle, SectionLabel } from '@yesid/ui/brand';
export { default as StopLabel } from './StopLabel.svelte';
export { default as TerminalChrome } from './TerminalChrome.svelte';
export { default as StickyPanel } from './StickyPanel.svelte';
export { default as MetroStation } from './MetroStation.svelte';
export { default as SvgIcon } from './SvgIcon.svelte';


// Props interfaces
export type { BlueprintShellProps, ChevronToggleProps, SectionLabelProps } from '@yesid/ui/brand';
export type { StopLabelProps } from './StopLabel.svelte';
export type { TerminalChromeProps, TerminalFooterItem } from './TerminalChrome.svelte';
export type { StickyPanelProps } from './StickyPanel.svelte';
export type { MetroStationProps } from './MetroStation.svelte';
