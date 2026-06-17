<script lang="ts">
	import type { IconRecord } from '$lib/types';
	import { asset } from '$lib/directus/assets';

	let {
		icon,
		label,
		class: className = '',
	}: {
		icon: IconRecord | null;
		label: string;
		class?: string;
	} = $props();

	const testKey = $derived(
		icon?.id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
	);
	const fallbackMark = $derived(label.trim().charAt(0).toUpperCase() || '?');
	const src = $derived(iconSource(icon));

	function iconSource(record: IconRecord | null): string | null {
		if (!record) return null;
		if (record.svg_override) return asset(record.svg_override);
		if (!record.iconify_id) return null;
		const [prefix, name] = record.iconify_id.split(':');
		if (!prefix || !name) return null;
		return `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;
	}
</script>

<span class="tech-icon {className}" aria-hidden="true">
	{#if src}
		<img
			src={src}
			alt=""
			loading="lazy"
			decoding="async"
			data-testid={`tech-icon-${testKey}`}
		/>
	{:else}
		<span class="tech-icon-fallback" data-testid={`tech-icon-${testKey}-fallback`}>
			{fallbackMark}
		</span>
	{/if}
</span>

<style>
	.tech-icon {
		display: inline-grid;
		place-items: center;
		width: 1.2em;
		height: 1.2em;
		flex: 0 0 auto;
	}

	.tech-icon img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.tech-icon-fallback {
		display: inline-grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border: 1px solid currentColor;
		border-radius: 50%;
		font-size: 0.68em;
		font-weight: 700;
		line-height: 1;
	}
</style>
