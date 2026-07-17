<!-- Kept as a yesid.dev compatibility wrapper per packages/ui/PARITY-NOTES.md. -->
<script lang="ts">
	import { TerminalCursor as UiTerminalCursor } from '@yesid/ui/brand';
</script>

<UiTerminalCursor class="yesid-terminal-cursor" />

<style>
	:global(.yesid-terminal-cursor.yesid-terminal-cursor.yesid-terminal-cursor) {
		width: 8px;
		height: 14px;
		margin-left: 4px;
		background: var(--accent);
	}

	:global([data-theme='light'] .yesid-terminal-cursor.yesid-terminal-cursor.yesid-terminal-cursor),
	:global(.theme-light .yesid-terminal-cursor.yesid-terminal-cursor.yesid-terminal-cursor) {
		background: var(--accent-text);
	}
</style>
