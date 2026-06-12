<!--
  ProductPreview (slice-29) — the crafted payoff: what the archetype's stack
  looks like as a labeled product (browser or phone frame).

  Slots come from PREVIEW_CONFIGS (crafted, never generated). Each slot is
  occupied by the archetype tech of its layer (first by sort); the FIRST slot
  of each layer carries data-flip-id=<tech id> so the blueprint box morphs
  into it. Tapping any slot toggles an inline caption with the tech's
  `enables` line (en) from the committed tech module.
-->
<script lang="ts">
	import { STACK_LAYERS, type StackArchetype, type StackLayer } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { techStackItems } from '$lib/content/tech-stack';
	import { LAYER_TEACHING } from './layer-teaching';
	import { FRAME_SIZES, PREVIEW_CONFIGS } from './preview-configs';

	let { archetype }: { archetype: StackArchetype; animate?: boolean } = $props();

	const techById = new Map(techStackItems.map((t) => [t.id, t]));

	const config = $derived(PREVIEW_CONFIGS[archetype.slug] ?? null);
	const frame = $derived(config ? FRAME_SIZES[config.frame] : FRAME_SIZES.browser);

	/** Occupant per layer: the archetype's tech of that layer, first by sort. */
	const occupantByLayer = $derived.by(() => {
		const map = new Map<StackLayer, string>();
		for (const layer of STACK_LAYERS) {
			const links = archetype.tech
				.filter((l) => l.layer === layer)
				.sort((a, b) => a.sort - b.sort);
			if (links.length > 0) map.set(layer, links[0].id);
		}
		return map;
	});

	/** Slots resolved with occupants; the first slot per layer carries the flip id. */
	const resolvedSlots = $derived.by(() => {
		if (!config) return [];
		const flipTagged = new Set<StackLayer>();
		const out: {
			slot: (typeof config.slots)[number];
			techId: string;
			name: string;
			flip: boolean;
		}[] = [];
		for (const slot of config.slots) {
			const techId = occupantByLayer.get(slot.layer);
			if (!techId) continue; // layer unoccupied for this archetype — skip slot
			const flip = !flipTagged.has(slot.layer);
			flipTagged.add(slot.layer);
			out.push({ slot, techId, name: techById.get(techId)?.name ?? techId, flip });
		}
		return out;
	});

	/** Tapped slot tech — caption toggles per tech id. */
	let captionTech = $state<string | null>(null);

	function toggleCaption(techId: string): void {
		captionTech = captionTech === techId ? null : techId;
	}

	// go2/w5 §3 goal-mode parity: the caption appends the layer teaching line
	// (same const module as the chip teach line). Missing `enables` degrades
	// gracefully to the layer line alone — never blank when a layer exists.
	const captionText = $derived.by(() => {
		if (!captionTech) return null;
		const tech = techById.get(captionTech);
		if (!tech) return null;
		const enables = tech.enables ? resolveLocale(tech.enables, locale) : '';
		const layerLine = tech.layer ? `${tech.layer}: ${LAYER_TEACHING[tech.layer]}` : '';
		if (enables && layerLine) return `${enables} · ${layerLine}`;
		if (layerLine) return `lives in ${layerLine}`;
		return enables || null;
	});

	const pct = (v: number, total: number) => `${(v / total) * 100}%`;
</script>

<div class="product-preview" data-testid="product-preview">
	{#if config}
		<div
			class="frame frame-{config.frame}"
			style:aspect-ratio={`${frame.w} / ${frame.h}`}
		>
			<div class="frame-chrome" aria-hidden="true">
				{#if config.frame === 'browser'}
					<span class="chrome-dot"></span><span class="chrome-dot"></span><span class="chrome-dot"></span>
				{:else}
					<span class="chrome-notch"></span>
				{/if}
			</div>
			{#each resolvedSlots as { slot, techId, name, flip }, i (i)}
				<button
					type="button"
					class="slot slot-layer-{slot.layer}"
					class:slot-active={captionTech === techId}
					data-testid={`slot-${techId}`}
					data-flip-id={flip ? techId : undefined}
					style:left={pct(slot.x, frame.w)}
					style:top={pct(slot.y, frame.h)}
					style:width={pct(slot.w, frame.w)}
					style:height={pct(slot.h, frame.h)}
					onclick={() => toggleCaption(techId)}
				>
					{#if slot.label}
						<span class="slot-role">{slot.label}</span>
					{/if}
					<span class="slot-name">{name}</span>
				</button>
			{/each}
		</div>

		{#if captionTech && captionText}
			<p class="enables-caption" data-testid={`enables-${captionTech}`}>
				<span class="caption-tech">{techById.get(captionTech)?.name ?? captionTech}</span>
				— {captionText}
			</p>
		{/if}
	{:else}
		<!-- Crafted previews only — an archetype without one says so (never blank). -->
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

	.slot-role {
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--muted-foreground);
		line-height: 1;
	}

	.slot-name {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--foreground);
		line-height: 1.1;
	}

	.enables-caption {
		font-family: var(--font-mono);
		font-size: 12px;
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
		font-size: 12px;
		color: var(--muted-foreground);
	}
</style>
