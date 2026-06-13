<!--
  Reusable terminal blinking cursor.
  Sharp step-end blink (not smooth pulse) — mimics a real terminal.
  Respects prefers-reduced-motion (static, no blink).
-->
<span class="terminal-cursor" aria-hidden="true"></span>

<style>
	/* GO2-W5 signal-lamp cursor: the most-watched pixel blinks the second
	   voice — amber lamp in dark, AA amber ink in light. Never clickable, so
	   the yellow-is-never-interactive rule survives. */
	.terminal-cursor {
		display: inline-block;
		width: 8px;
		height: 14px;
		background: var(--accent);
		vertical-align: text-bottom;
		margin-left: 4px;
		animation: blink 1s step-end infinite;
	}

	:global([data-theme='light']) .terminal-cursor,
	:global(.theme-light) .terminal-cursor {
		background: var(--accent-text);
	}

	@media (prefers-reduced-motion: reduce) {
		.terminal-cursor {
			animation: none;
		}
	}
</style>
