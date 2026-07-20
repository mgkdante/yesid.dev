// Brand primitives barrel export — 12 reusable components.
// Built in Slice 17a-2a; wired into consumers in 17a-2b; expanded in 17d (MetroStation, SectionHeading, SvgIcon).
// GlowOverlay removed in slice-design Child 2 (0 consumers; glow effect lives in motion/actions/cursorGlow.ts).
//
// Migrated to shadcn ui/ in 17d (don't import from here — use the ui/ equivalent):
//   Tag → ui/badge, NumberBadge → ui/badge,
//   HazardStripe → ui/separator, GradientSeparator → ui/separator,
//   BrandButton → ui/button, CardBase → ui/card.

export { default as StatusDot } from './StatusDot.svelte';
export { BlueprintShell, ChevronToggle, SectionLabel } from '@yesid/ui/brand';
export { default as StopLabel } from './StopLabel.svelte';
export { default as MetricDisplay } from './MetricDisplay.svelte';
export { default as CornerMarks } from './CornerMarks.svelte';
export { default as TerminalChrome } from './TerminalChrome.svelte';
export { default as StickyPanel } from './StickyPanel.svelte';
export { default as SectionHeading } from './SectionHeading.svelte';
export { default as MetroStation } from './MetroStation.svelte';
export { default as SvgIcon } from './SvgIcon.svelte';


// Props interfaces
export type { StatusDotProps } from './StatusDot.svelte';
export type { BlueprintShellProps, ChevronToggleProps, SectionLabelProps } from '@yesid/ui/brand';
export type { StopLabelProps } from './StopLabel.svelte';
export type { MetricDisplayProps } from './MetricDisplay.svelte';
export type { CornerMarksProps } from './CornerMarks.svelte';
export type { TerminalChromeProps, TerminalFooterItem } from './TerminalChrome.svelte';
export type { StickyPanelProps } from './StickyPanel.svelte';
export type { SectionHeadingProps } from './SectionHeading.svelte';
export type { MetroStationProps } from './MetroStation.svelte';
