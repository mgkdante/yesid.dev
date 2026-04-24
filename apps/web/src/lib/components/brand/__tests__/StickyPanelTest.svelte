<script lang="ts">
  import StickyPanel from '../StickyPanel.svelte';

  interface Props {
    top?: string;
    text?: string;
  }

  let { text = 'Panel content', top }: Props = $props();
</script>

<StickyPanel {top}>{text}</StickyPanel>
