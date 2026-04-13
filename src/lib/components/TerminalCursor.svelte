<!--
  Reusable terminal blinking cursor.
  Sharp step-end blink (not smooth pulse) — mimics a real terminal.
  Respects prefers-reduced-motion (static, no blink).
-->
<span class="terminal-cursor" aria-hidden="true"></span>

<style>
	.terminal-cursor {
		display: inline-block;
		width: 8px;
		height: 14px;
		background: var(--primary);
		vertical-align: text-bottom;
		margin-left: 4px;
		animation: blink 1s step-end infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.terminal-cursor {
			animation: none;
		}
	}
</style>
