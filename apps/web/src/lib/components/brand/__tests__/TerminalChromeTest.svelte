<script lang="ts">
  import TerminalChrome from '../TerminalChrome.svelte';
  import type { TerminalFooterItem } from '../TerminalChrome.svelte';

  interface Props {
    title: string;
    tag?: string;
    status?: string;
    footer?: TerminalFooterItem[];
    bodyText?: string;
    showActions?: boolean;
  }

  let { bodyText = '$ hello', showActions = false, ...rest }: Props = $props();
</script>

<TerminalChrome {...rest}>
  {#snippet actions()}
    {#if showActions}
      <button type="button">Copy</button>
    {/if}
  {/snippet}
  <p>{bodyText}</p>
</TerminalChrome>
