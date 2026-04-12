<!--
  Tag — tech tag pill with mono font.
  Brand primitive: replaces 8+ scattered pill implementations.
-->
<script lang="ts">
  export interface TagProps {
    /** Tag text */
    text: string;
    /** Pill size */
    size?: 'xs' | 'sm';
    /** Active/highlighted state */
    active?: boolean;
    /** Custom accent color (CSS value) — defaults to brand-primary */
    accentColor?: string;
    /** Renders as interactive (button-like cursor) */
    interactive?: boolean;
  }

  let {
    text,
    size = 'sm',
    active = false,
    accentColor,
    interactive = false,
  }: TagProps = $props();

  const sizeClass = {
    xs: 'px-2 py-0.5 text-[0.6875rem]',
    sm: 'px-3 py-1 text-xs',
  } as const;

  const stateClass = $derived(
    active && !accentColor
      ? 'tag-active'
      : active && accentColor
        ? ''
        : 'tag-inactive'
  );
</script>

<span
  class="inline-flex items-center rounded-full border font-mono leading-tight {sizeClass[size]} {stateClass} {interactive ? 'cursor-pointer' : ''}"
  style={active && accentColor ? `border-color: ${accentColor}30; background: ${accentColor}15; color: ${accentColor}` : ''}
>{text}</span>

<style>
  .tag-active {
    border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
    background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
    color: var(--brand-primary);
  }
  .tag-inactive {
    border-color: var(--border);
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }
</style>
