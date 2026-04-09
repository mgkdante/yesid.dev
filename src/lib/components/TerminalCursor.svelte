<!--
  Reusable terminal blinking cursor.
  Sharp step-end blink (not smooth pulse) — mimics a real terminal.
  Respects prefers-reduced-motion (static, no blink).
-->
<span class="terminal-cursor" aria-hidden="true"></span>

<style>
	.terminal-cursor {
		display: inline-block;
		width: 7px;
		height: 1em;
		background: var(--brand-primary);
		vertical-align: text-bottom;
		margin-left: 4px;
		animation: terminal-blink 1.2s step-end infinite;
	}

	@keyframes terminal-blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.terminal-cursor {
			animation: none;
		}
	}
</style>
