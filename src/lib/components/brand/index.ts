// Brand primitives barrel export — 14 reusable components (BrandButton migrated to ui/button).
// Built in Slice 17a-2a. Wired into consumers in 17a-2b.

export { default as StatusDot } from './StatusDot.svelte';
export { default as SectionLabel } from './SectionLabel.svelte';
export { default as StopLabel } from './StopLabel.svelte';
export { default as Tag } from './Tag.svelte';
export { default as NumberBadge } from './NumberBadge.svelte';
export { default as ChevronToggle } from './ChevronToggle.svelte';
export { default as HazardStripe } from './HazardStripe.svelte';
export { default as GlowOverlay } from './GlowOverlay.svelte';
export { default as MetricDisplay } from './MetricDisplay.svelte';

export { default as CardBase } from './CardBase.svelte';
export { default as CornerMarks } from './CornerMarks.svelte';
export { default as TerminalChrome } from './TerminalChrome.svelte';
export { default as StickyPanel } from './StickyPanel.svelte';

// Props interfaces
export type { StatusDotProps } from './StatusDot.svelte';
export type { SectionLabelProps } from './SectionLabel.svelte';
export type { StopLabelProps } from './StopLabel.svelte';
export type { TagProps } from './Tag.svelte';
export type { NumberBadgeProps } from './NumberBadge.svelte';
export type { ChevronToggleProps } from './ChevronToggle.svelte';
export type { HazardStripeProps } from './HazardStripe.svelte';
export type { GlowOverlayProps } from './GlowOverlay.svelte';
export type { MetricDisplayProps } from './MetricDisplay.svelte';

export type { CardBaseProps } from './CardBase.svelte';
export type { CornerMarksProps } from './CornerMarks.svelte';
export type { TerminalChromeProps, TerminalFooterItem } from './TerminalChrome.svelte';
export type { StickyPanelProps } from './StickyPanel.svelte';

// GradientSeparator is #15 but lives in components/ root (pre-existing).
// Re-export for convenience.
export { default as GradientSeparator } from '../GradientSeparator.svelte';
export type { GradientSeparatorProps } from '../GradientSeparator.svelte';
