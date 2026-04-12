<script lang="ts">
  import TerminalChrome from '../TerminalChrome.svelte';
  import type { TerminalFooterItem } from '../TerminalChrome.svelte';

  interface Props {
    title: string;
    tag?: string;
    status?: string;
    footer?: TerminalFooterItem[];
    bodyText?: string;
  }

  let { bodyText = '$ hello', ...rest }: Props = $props();
</script>

<TerminalChrome {...rest}>
  <p>{bodyText}</p>
</TerminalChrome>
