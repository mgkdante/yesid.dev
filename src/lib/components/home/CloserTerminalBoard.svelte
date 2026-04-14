<!--
  CloserTerminalBoard — Departure board with destination rows and cursor.
  Data-driven rows: each row links to a destination (contact, GitHub, blog, about).
-->
<script lang="ts">
	import { TerminalChrome } from '$lib/components/brand';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';

	let {
		rows,
	}: {
		rows: Array<{
			label: string;
			description: string;
			action: string;
			href: string;
			primary: boolean;
		}>;
	} = $props();
</script>

<TerminalChrome
	title="yesid@terminus:~/destinations"
	noPadding
	footer={[
		{ label: '', value: 'Montreal, QC' },
		{ label: '', value: 'UTF-8' },
		{ label: '', value: `${rows.length} destinations` }
	]}
	data-testid="closer-board"
	data-closer-board
	class="closer-terminal"
>
	<!-- Welcome line -->
	<div class="terminal-welcome">
		<span class="terminal-comment">// where to next?</span>
	</div>
	{#each rows as row, i}
		<a
			href={row.href}
			data-testid="closer-row"
			data-closer-row
			class="terminal-row"
			class:terminal-row-primary={row.primary}
			aria-label="{row.label} — {row.description}"
			target={row.href.startsWith('http') ? '_blank' : undefined}
			rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
		>
			<span class="terminal-line-num">{String(i + 1).padStart(2, '0')}</span>
			<span class="terminal-row-label">{row.label}</span>
			<span class="terminal-row-desc" class:terminal-row-desc-primary={row.primary}>
				{row.description}
			</span>
			<span class="terminal-row-action" class:terminal-row-action-primary={row.primary}>
				{row.action} {'->'}
			</span>
		</a>
	{/each}
	<!-- Blinking cursor -->
	<div class="terminal-cursor-line">
		<span class="terminal-line-num">&nbsp;</span>
		<TerminalCursor />
	</div>
</TerminalChrome>

<style>
	/* ===== Terminal window ===== */
	.closer-terminal {
		margin-block-end: 32px;
		font-family: var(--font-mono);
	}

	.terminal-welcome {
		padding: 4px 24px 12px;
	}
	.terminal-comment {
		font-size: 14px;
		color: var(--dim-foreground);
		font-style: italic;
	}

	.terminal-row {
		display: grid;
		grid-template-columns: 36px 120px 1fr 80px;
		padding: 16px 24px;
		align-items: center;
		text-decoration: none;
		cursor: pointer;
		transition: background-color var(--duration-normal);
		position: relative;
	}
	.terminal-row:hover {
		background-color: color-mix(in srgb, var(--primary) 5%, transparent);
	}
	.terminal-row:hover .terminal-row-action {
		color: var(--accent);
	}

	.terminal-line-num {
		font-size: 12px;
		color: var(--dim-foreground);
		user-select: none;
	}

	.terminal-row-label {
		font-size: 14px;
		font-weight: 700;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.terminal-row-desc {
		font-size: 15px;
		color: var(--muted-foreground);
	}
	.terminal-row-desc-primary {
		font-size: 16px;
		color: var(--secondary-foreground);
	}

	.terminal-row-action {
		text-align: right;
		font-size: 13px;
		color: var(--dim-foreground);
		transition: color var(--duration-normal);
	}
	.terminal-row-action-primary {
		color: var(--accent);
		font-weight: 600;
	}

	/* Blinking cursor */
	.terminal-cursor-line {
		display: flex;
		gap: 8px;
		padding: 8px 24px 12px;
		align-items: center;
	}
</style>
