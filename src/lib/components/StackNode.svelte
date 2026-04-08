<!--
  Tech stack node card for the Control Room diagram.
  Displays icon placeholder + name. CSS hover transitions only (no GSAP yet — added in 10c/10d).
  Props: TechStackItem. Emits click for parent (diagram) to handle sidebar/selection.
-->
<script lang="ts">
	import type { TechStackItem, Proficiency } from '$lib/data/types.js';

	let {
		item,
		selected = false,
		dimmed = false,
		onclick,
		onmouseenter,
		onmouseleave,
	}: {
		item: TechStackItem;
		selected?: boolean;
		dimmed?: boolean;
		onclick?: (item: TechStackItem) => void;
		onmouseenter?: (item: TechStackItem) => void;
		onmouseleave?: () => void;
	} = $props();

	const proficiencyLabel: Record<Proficiency, string> = {
		expert: 'Expert',
		proficient: 'Proficient',
		familiar: 'Familiar',
	};

	function handleClick() {
		onclick?.(item);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			// Move focus to next/previous node within the same layer
			e.preventDefault();
			const button = e.currentTarget as HTMLElement;
			const container = button.parentElement;
			if (!container) return;
			const buttons = [...container.querySelectorAll<HTMLElement>('.stack-node')];
			const idx = buttons.indexOf(button);
			const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
			if (next >= 0 && next < buttons.length) {
				buttons[next].focus();
			}
		}
	}
</script>

<button
	type="button"
	class="stack-node"
	class:selected
	class:dimmed
	data-testid="stack-node-{item.id}"
	data-layer={item.layer}
	data-proficiency={item.proficiency}
	onclick={handleClick}
	onkeydown={handleKeydown}
	onmouseenter={() => onmouseenter?.(item)}
	onmouseleave={() => onmouseleave?.()}
	title="{item.name} — {proficiencyLabel[item.proficiency]}"
>
	<span class="node-icon" aria-hidden="true">
		{item.name.slice(0, 2).toUpperCase()}
	</span>
	<span class="node-name">{item.name}</span>
</button>

<style>
	.stack-node {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-surface);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			transform 0.2s ease,
			opacity 0.3s ease,
			box-shadow 0.2s ease;
	}

	.stack-node:hover {
		border-color: var(--brand-primary);
		background: var(--bg-elevated);
		transform: scale(1.05);
		box-shadow: 0 0 12px color-mix(in srgb, var(--brand-primary) 20%, transparent);
	}

	.stack-node:focus-visible {
		outline: 2px solid var(--brand-primary);
		outline-offset: 2px;
	}

	.stack-node.selected {
		border-color: var(--brand-primary);
		background: var(--bg-elevated);
		box-shadow: 0 0 16px color-mix(in srgb, var(--brand-primary) 25%, transparent);
	}

	.stack-node.dimmed {
		opacity: 0.3;
	}

	.stack-node.dimmed:hover {
		opacity: 0.6;
		transform: scale(1.02);
	}

	.node-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
		color: var(--brand-primary);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 700;
		flex-shrink: 0;
	}

	.node-name {
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 500;
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.stack-node {
			transition: none;
		}
		.stack-node:hover {
			transform: none;
		}
	}
</style>
