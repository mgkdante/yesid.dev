<script lang="ts">
  import BrandButton from '../BrandButton.svelte';

  interface Props {
    text: string;
    variant?: 'primary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
  }

  let { text, variant, size, href }: Props = $props();
</script>

<BrandButton {variant} {size} {href}>{text}</BrandButton>
