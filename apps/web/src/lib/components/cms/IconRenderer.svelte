<script lang="ts">
	import Icon from '@iconify/svelte';
	import { asset } from '$lib/directus/assets';
	import type { IconRecord } from '@repo/shared';

	interface Props {
		icon: IconRecord | null;
		size?: number;
		ariaLabel?: string;
	}

	let { icon, size = 24, ariaLabel }: Props = $props();

	// Resolve render path: svg_override > iconify_id > placeholder
	const resolved = $derived.by(() => {
		if (!icon) return { kind: 'placeholder' as const };
		if (icon.svg_override) {
			return { kind: 'svg' as const, src: asset(icon.svg_override) };
		}
		if (icon.iconify_id) {
			return { kind: 'iconify' as const, id: icon.iconify_id };
		}
		return { kind: 'placeholder' as const };
	});
</script>

{#if resolved.kind === 'svg'}
	<img
		src={resolved.src}
		width={size}
		height={size}
		alt={ariaLabel ?? icon?.name ?? ''}
		loading="lazy"
	/>
{:else if resolved.kind === 'iconify'}
	<Icon
		icon={resolved.id}
		width={size}
		height={size}
		aria-label={ariaLabel}
		aria-hidden={ariaLabel ? undefined : true}
	/>
{:else}
	<!-- placeholder: small neutral box; CSS-styleable via class -->
	<span
		class="icon-placeholder"
		style:width={`${size}px`}
		style:height={`${size}px`}
		aria-hidden="true"
	></span>
{/if}

<style>
	.icon-placeholder {
		display: inline-block;
		background-color: var(--color-surface-muted, #e5e7eb);
		border-radius: 4px;
		vertical-align: middle;
	}
</style>
