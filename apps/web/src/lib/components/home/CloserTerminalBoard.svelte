<!--
  CloserTerminalBoard — Departure board with destination rows and cursor.
  Data-driven rows: each row links to a destination (contact, GitHub, blog, about).
-->
<script lang="ts">
	import { TerminalChrome } from '$lib/components/brand';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';

	const locale = getLocale();

	let {
		rows,
		terminalTitle,
		cityLabel,
		encodingLabel,
		destinationsTemplate,
		promptLine,
	}: {
		rows: Array<{
			label: string;
			description: string;
			action: string;
			href: string;
			primary: boolean;
		}>;
		terminalTitle: string;
		cityLabel: string;
		encodingLabel: string;
		/** `{count} destinations` template — `{count}` gets the current rows length. */
		destinationsTemplate: string;
		promptLine: string;
	} = $props();
</script>

<TerminalChrome
	title={terminalTitle}
	noPadding
	footer={[
		{ label: '', value: cityLabel },
		{ label: '', value: encodingLabel },
		{ label: '', value: destinationsTemplate.replace('{count}', String(rows.length)) }
	]}
	data-testid="closer-board"
	data-closer-board
>
	<!-- Welcome line -->
	<div class="terminal-welcome">
		<span class="terminal-comment">{promptLine}</span>
	</div>
	{#each rows as row, i}
		<a
			href={localizeHref(row.href, locale)}
			data-testid="closer-row"
			data-closer-row
			class="terminal-row tap-press"
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
	.terminal-welcome {
		padding: 4px 24px 12px;
	}
	/* GO2-W5: terminal text speaks console ink — comments/dim = ink-muted. */
	.terminal-comment {
		font-size: var(--text-mono);
		color: var(--terminal-ink-muted);
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
	/* go2/w4: accent → accent-text — AA on the now-theme-following terminal
	   surface (dark byte-identical, light gets the AA gold). */
	.terminal-row:hover .terminal-row-action {
		color: var(--accent-text);
	}

	.terminal-line-num {
		font-size: var(--text-detail-kicker);
		color: var(--terminal-ink-muted);
		user-select: none;
	}

	.terminal-row-label {
		font-size: var(--text-mono);
		font-weight: 700;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.terminal-row-desc {
		font-size: var(--text-small);
		color: var(--terminal-ink-muted);
	}
	.terminal-row-desc-primary {
		font-size: var(--text-menu-subtitle);
		color: var(--terminal-ink);
	}

	.terminal-row-action {
		text-align: right;
		font-size: var(--text-caption);
		color: var(--terminal-ink-muted);
		transition: color var(--duration-normal);
	}
	.terminal-row-action-primary {
		color: var(--accent-text);
		font-weight: 600;
	}

	/* Blinking cursor */
	.terminal-cursor-line {
		display: flex;
		gap: 8px;
		padding: 8px 24px 12px;
		align-items: center;
	}

	/* Mobile (<=767px): the 4-column departure-board grid
	   (36px 120px 1fr 80px) starves the description column to ~24px at 360px and
	   ~9px at 320px, stacking words one character per line (illegible). Collapse
	   each row into stacked full-width lines: [num] LABEL on top, the
	   description on its own line, the action below. Keeps the same fields and
	   colors; just gives the description room to read. */
	@media (--tablet-max) {
		.terminal-row {
			grid-template-columns: auto 1fr;
			grid-template-areas:
				'num label'
				'desc desc'
				'action action';
			column-gap: 10px;
			row-gap: 4px;
			align-items: start;
			padding: 14px 20px;
		}
		.terminal-row .terminal-line-num {
			grid-area: num;
			align-self: center;
			font-size: var(--text-caption);
		}
		.terminal-row-label {
			grid-area: label;
			align-self: center;
		}
		.terminal-row-desc,
		.terminal-row-desc-primary {
			grid-area: desc;
		}
		.terminal-row-action,
		.terminal-row-action-primary {
			grid-area: action;
			text-align: left;
			font-size: var(--text-mono);
		}
		.terminal-welcome {
			padding: 4px 20px 10px;
		}
		.terminal-cursor-line {
			padding: 8px 20px 12px;
		}
	}
</style>
