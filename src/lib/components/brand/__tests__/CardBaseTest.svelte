<script lang="ts">
  import CardBase from '../CardBase.svelte';

  interface Props {
    hover?: boolean;
    glow?: boolean;
    interactive?: boolean;
    padding?: 'sm' | 'md' | 'lg';
    href?: string;
    text?: string;
  }

  let { text = 'Card content', ...rest }: Props = $props();
</script>

<CardBase {...rest}>{text}</CardBase>
