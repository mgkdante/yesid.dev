<!--
  ProductPreview (slice-29, go2/w5 round 4) — the crafted payoff: what a
  stack looks like as a labeled product (browser or phone frame).

  Two sources, one renderer:
  - `archetype` → the slug's crafted PREVIEW_CONFIGS entry, occupants resolved
    per slot (layer + pick index, first slot per TECH carries the flip id).
  - `picks` (round 4) → the composed build's GENERIC preview — frame derived
    from covered layers, one slot per pick ("see your build as a product").

  Round 4 dual-role rule: every slot prints its ROLE line (the slot's job in
  this product) above the tech name, so the same tech in two boxes tells two
  stories (Python "pulls the raw feeds" vs Python "cleans & reshapes").
  Captions are therefore PER SLOT (not per tech): tapping each Python reads
  its own role into the caption — and tapping the second no longer toggles
  the first's caption off.
-->
<script lang="ts">
	import type { StackArchetype, StackLayer } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { techStackItems } from '$lib/content/tech-stack';
	import { LAYER_TEACHING } from './layer-teaching';
	import { FRAME_SIZES, buildComposedPreview, resolveArchetypePreview } from './preview-configs';

	let {
		archetype = null,
		picks = null,
	}: {
		archetype?: StackArchetype | null;
		/** Composed mode (round 4): the picked techs — overrides archetype. */
		picks?: readonly { id: string; layer: StackLayer }[] | null;
		animate?: boolean;
	} = $props();

	const techById = new Map(techStackItems.map((t) => [t.id, t]));

	const resolved = $derived(
		picks ? buildComposedPreview(picks) : archetype ? resolveArchetypePreview(archetype) : null,
	);
	const frame = $derived(resolved ? FRAME_SIZES[resolved.frame] : FRAME_SIZES.browser);

	/** Tapped slot index — captions are per SLOT so dual-role techs read distinctly. */
	let captionSlot = $state<number | null>(null);

	function toggleCaption(index: number): void {
		captionSlot = captionSlot === index ? null : index;
	}

	// go2/w5 §3 goal-mode parity + round 4 roles: the caption opens with the
	// slot's role story, then the tech's `enables` line, then the layer
	// teaching line (same const module as the chip teach line). Missing
	// `enables` degrades gracefully — never blank when a layer exists.
	const caption = $derived.by(() => {
		if (captionSlot === null || !resolved) return null;
		const slot = resolved.slots[captionSlot];
		if (!slot) return null;
		const tech = techById.get(slot.techId);
		const name = tech?.name ?? slot.techId;
		const enables = tech?.enables ? resolveLocale(tech.enables, locale) : '';
		const layerLine = `${slot.layer}: ${LAYER_TEACHING[slot.layer]}`;
		const tail = enables ? `${enables} · ${layerLine}` : `lives in ${layerLine}`;
		return { techId: slot.techId, name, text: `${slot.role} here. ${tail}` };
	});

	const pct = (v: number, total: number) => `${(v / total) * 100}%`;
</script>

<div class="product-preview" data-testid="product-preview">
	{#if resolved}
		<div
			class="frame frame-{resolved.frame}"
			style:aspect-ratio={`${frame.w} / ${frame.h}`}
		>
			<div class="frame-chrome" aria-hidden="true">
				{#if resolved.frame === 'browser'}
					<span class="chrome-dot"></span><span class="chrome-dot"></span><span class="chrome-dot"></span>
				{:else}
					<span class="chrome-notch"></span>
				{/if}
			</div>
			{#each resolved.slots as slot, i (i)}
				<button
					type="button"
					class="slot slot-layer-{slot.layer}"
					class:slot-active={captionSlot === i}
					data-testid={`slot-${slot.techId}`}
					data-flip-id={slot.flip ? slot.techId : undefined}
					style:left={pct(slot.x, frame.w)}
					style:top={pct(slot.y, frame.h)}
					style:width={pct(slot.w, frame.w)}
					style:height={pct(slot.h, frame.h)}
					onclick={() => toggleCaption(i)}
				>
					<span class="slot-role">{slot.role}</span>
					<span class="slot-name">{techById.get(slot.techId)?.name ?? slot.techId}</span>
				</button>
			{/each}
		</div>

		{#if caption}
			<p class="enables-caption" data-testid={`enables-${caption.techId}`}>
				<span class="caption-tech">{caption.name}</span>
				— {caption.text}
			</p>
		{/if}
	{:else}
		<!-- Defensive only (round 4 totality: every published slug HAS a config) —
		     an unknown slug says so rather than rendering blank. -->
		<p class="preview-pending">this one's still on the drawing board — the blueprint view has the full picture.</p>
	{/if}
</div>

<style>
	.product-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.frame {
		position: relative;
		width: 100%;
		border: 1.5px solid var(--secondary-foreground);
		border-radius: 8px;
		background: var(--background);
		overflow: hidden;
	}

	.frame-browser {
		max-width: 540px;
	}

	.frame-phone {
		max-width: 240px;
		border-radius: 18px;
	}

	.frame-chrome {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		pointer-events: none;
		z-index: 1;
	}

	.frame-browser .frame-chrome {
		justify-content: flex-start;
		padding-left: 8px;
		border-bottom: 1px solid var(--border);
	}

	.chrome-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--muted-foreground);
		opacity: 0.6;
	}

	.chrome-notch {
		width: 40px;
		height: 6px;
		border-radius: 3px;
		background: var(--border);
		margin-top: 4px;
	}

	.slot {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
		padding: 2px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: color-mix(in oklab, var(--primary) 6%, var(--background));
		cursor: pointer;
		overflow: hidden;
		transition: border-color 150ms ease;
	}

	.slot:hover,
	.slot-active {
		border-color: var(--primary);
	}

	/* Round 4: roles are story phrases now ("pulls the raw feeds") — let them
	   wrap inside roomy lanes; shallow bars still clamp via overflow:hidden.
	   go2/w5 legibility pass: slot type steps up one full rung (tokens only);
	   the shallow bars in preview-configs grew to h≥26 to hold the pair. */
	.slot-role {
		font-family: var(--font-mono);
		font-size: var(--text-micro);
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--muted-foreground);
		line-height: 1.2;
		text-align: center;
		max-width: 100%;
	}

	/* go2/w5 taste round 2 (fit audit): shallow slots (infra/data bars ≈ 18px
	   rendered at 375px viewports) can't hold role + name — the name is the
	   payload, the role hint yields below 480px instead of clipping it. */
	@media (max-width: 479px) {
		.slot-role {
			display: none;
		}
	}

	.slot-name {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--foreground);
		line-height: 1.1;
	}

	.enables-caption {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--muted-foreground);
		margin: 0;
		max-width: 540px;
		text-align: center;
	}

	.caption-tech {
		color: var(--primary);
	}

	.preview-pending {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
</style>
