<!--
  ChevronToggle — rotatable expand/collapse arrow.
  Brand primitive: replaces 8+ different chevron/arrow implementations.
-->
<script lang="ts">
  export interface ChevronToggleProps {
    /** Whether the toggle is in open/expanded state */
    open: boolean;
    /** Arrow size */
    size?: 'sm' | 'md';
    /** Base direction — rotates 90deg when open */
    direction?: 'right' | 'down';
  }

  let {
    open,
    size = 'md',
    direction = 'right',
  }: ChevronToggleProps = $props();

  const sizeClass = { sm: 'size-4', md: 'size-5' } as const;
</script>

<svg
  class="chevron {sizeClass[size]} shrink-0 text-[var(--text-muted)] transition-transform"
  class:chevron-open={open}
  class:chevron-right={direction === 'right'}
  class:chevron-down={direction === 'down'}
  viewBox="0 0 20 20"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M8 4l7 6-7 6V4z" />
</svg>

<style>
  .chevron {
    transition: transform var(--duration-normal) var(--ease-default),
                color var(--duration-fast) var(--ease-default);
  }

  /* Right-pointing: rotates 90deg clockwise to point down when open */
  .chevron-right.chevron-open {
    transform: rotate(90deg);
  }

  /* Down-pointing: starts at 90deg, rotates to 180deg when open */
  .chevron-down {
    transform: rotate(90deg);
  }
  .chevron-down.chevron-open {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .chevron { transition: none; }
  }
</style>
