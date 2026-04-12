<!--
  SectionLabel — mono uppercase label in 3 variants.
  Brand primitive: replaces 25+ scattered label patterns.
-->
<script lang="ts">
  export interface SectionLabelProps {
    /** Label text */
    text: string;
    /** Visual style variant */
    variant?: 'section' | 'station' | 'metric';
    /** Text alignment */
    align?: 'left' | 'center';
  }

  let {
    text,
    variant = 'section',
    align = 'left',
  }: SectionLabelProps = $props();

  const variantClass = {
    section: 'label-section',
    station: 'label-station',
    metric: 'label-metric',
  } as const;
</script>

<span
  class="{variantClass[variant]} {align === 'center' ? 'text-center block' : ''}"
>{text}</span>
