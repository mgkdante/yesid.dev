<script lang="ts">
	import Icon from '@iconify/svelte';
	import { toIconifyId } from './tech-icon-utils';

	interface Props {
		name: string;
		size?: number;
		defaultNamespace?: string;
		ariaLabel?: string;
	}

	let { name, size = 24, defaultNamespace = 'logos', ariaLabel }: Props = $props();

	const iconifyId = $derived(toIconifyId(name, defaultNamespace));
</script>

{#if iconifyId}
	<Icon
		icon={iconifyId}
		width={size}
		height={size}
		aria-label={ariaLabel}
		aria-hidden={ariaLabel ? undefined : true}
	/>
{/if}
