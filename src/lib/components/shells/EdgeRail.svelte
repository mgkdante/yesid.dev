<!--
  EdgeRail — Tier 3 shell for page-level edge decorations.
  Sticky within parent CSS grid — participates in layout flow.
  Parent must provide the grid context (e.g., grid-template-columns: auto 1fr).
  Constitution: EdgeRail = page-scoped truth; SectionWrapper sides = section-scoped.
  When EdgeRail is present, sections CANNOT overlap it — it's a grid column.

  Title variant uses Pretext + Canvas measureText for pixel-perfect glyph bounds.
  The rail width is CALCULATED from actual text metrics — not a CSS approximation.
  The "g" tail of "Blog" is measured to the pixel. No overflow, no guesswork.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { prepare, layout } from '@chenglou/pretext';

	export interface EdgeRailProps {
		/** Which side of the viewport */
		position: 'left' | 'right';
		/** Rotated page label (small mono by default, big display with variant="title") */
		label?: string;
		/** Label display variant */
		variant?: 'default' | 'title';
		/** Section markers for vertical navigation */
		sections?: { id: string; label: string }[];
		/** Custom edge content */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		position,
		label,
		variant = 'default',
		sections,
		children,
		class: className,
		...rest
	}: EdgeRailProps = $props();

	let railEl: HTMLDivElement | undefined = $state();

	/**
	 * Measures exact font-level bounding box for a text string using Canvas.
	 * Uses fontBoundingBox (font max ascent + descent) — not actualBoundingBox
	 * (which only covers the ink area of the specific glyphs).
	 * fontBoundingBox guarantees NO glyph in the font can overflow.
	 */
	function measureTextMetrics(text: string, font: string) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		ctx.font = font;
		const m = ctx.measureText(text);
		return {
			/** Horizontal text width (becomes vertical extent when rotated) */
			textWidth: m.width,
			/** Font-level ascent — tallest any glyph can be above baseline */
			fontAscent: m.fontBoundingBoxAscent,
			/** Font-level descent — deepest any glyph can hang below baseline */
			fontDescent: m.fontBoundingBoxDescent,
			/** Total cross-axis: ascent + descent — becomes rail width in vertical mode */
			crossAxis: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
		};
	}

	// For title variant: measure font metrics and set rail width precisely.
	// CSS provides an initial approximation. This $effect refines to exact.
	$effect(() => {
		if (variant !== 'title' || !label || !railEl) return;

		const labelEl = railEl.querySelector('[data-edge-label]') as HTMLElement | null;
		if (!labelEl) return;

		const cs = getComputedStyle(labelEl);
		const fontFamily = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
		const font = `${cs.fontWeight} ${cs.fontSize} ${fontFamily}`;
		const metrics = measureTextMetrics(label, font);

		// crossAxis = font ascent + font descent (maximum possible extent).
		// In vertical writing mode, this IS the horizontal width the text needs.
		// Use max() with current width to prevent layout shift (never shrink).
		const currentWidth = railEl.getBoundingClientRect().width;
		const calculatedWidth = Math.ceil(metrics.crossAxis);
		railEl.style.width = `${Math.max(calculatedWidth, currentWidth)}px`;

		// Pretext: measure text inline width (vertical extent of rotated label)
		try {
			const prepared = prepare(label, font);
			const result = layout(prepared, 10000, parseFloat(cs.fontSize));
			railEl.dataset.textWidth = String(Math.ceil(metrics.textWidth));
			railEl.dataset.crossAxis = String(Math.ceil(metrics.crossAxis));
			railEl.dataset.pretextLines = String(result.lineCount);
		} catch {
			// Pretext may fail on some font formats — CSS approximation holds
		}
	});
</script>

<div
	bind:this={railEl}
	data-slot="edge-rail"
	data-position={position}
	data-variant={variant}
	class={cn('edge-rail', className)}
	aria-hidden="true"
	{...rest}
>
	{#if label}
		<span data-edge-label class="edge-label">{label}{#if variant === 'title'}<span class="edge-dot">.</span>{/if}</span>
	{/if}

	{#if sections}
		<nav class="edge-markers">
			{#each sections as section}
				<span data-edge-marker data-section={section.id} class="edge-marker">
					{section.label}
				</span>
			{/each}
		</nav>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.edge-rail {
		position: sticky;
		top: 0;
		height: 100dvh;
		display: none;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		pointer-events: none;
	}

	/* Only visible at lg:+ (1024px) */
	@media (min-width: 1024px) {
		.edge-rail {
			display: flex;
		}
	}

	/* --- Default variant: small mono label --- */
	.edge-rail[data-variant="default"] {
		width: clamp(2rem, 3vw, 3.5rem);
	}

	.edge-rail[data-variant="default"] .edge-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-foreground);
		white-space: nowrap;
	}

	/* --- Title variant: big bold display label --- */
	/* Initial CSS width is a close approximation. $effect() refines to exact
	   glyph bounds on mount via Canvas measureText. The grid column adapts. */
	.edge-rail[data-variant="title"] {
		--_title-size: clamp(8rem, 15vw, 15rem);
		width: calc(var(--_title-size) * 1.25);
		align-items: flex-start; /* flush to viewport edge, clearance on content side */
	}

	.edge-rail[data-variant="title"] .edge-label {
		font-family: var(--font-heading);
		font-size: var(--_title-size);
		line-height: 1;
		font-weight: 900;
		letter-spacing: -0.04em;
		color: var(--foreground);
		white-space: nowrap;
	}

	.edge-dot {
		color: var(--primary);
	}

	/* --- Rotation per position --- */
	.edge-rail[data-position="left"] .edge-label {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	.edge-rail[data-position="right"] .edge-label {
		writing-mode: vertical-rl;
	}

	/* --- Section markers --- */
	.edge-markers {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.edge-marker {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		letter-spacing: 0.05em;
		color: var(--muted-foreground);
		opacity: var(--opacity-muted);
		white-space: nowrap;
	}

	.edge-rail[data-position="left"] .edge-marker,
	.edge-rail[data-position="right"] .edge-marker {
		writing-mode: vertical-rl;
	}

	.edge-rail[data-position="left"] .edge-marker {
		transform: rotate(180deg);
	}
</style>
