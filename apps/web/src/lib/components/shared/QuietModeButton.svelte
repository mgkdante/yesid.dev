<script lang="ts">
	import {
		QuietModeButton as UiQuietModeButton,
		type QuietModeButtonCopy,
	} from '@yesid/ui/brand';
	import { onMount } from 'svelte';
	import { siteLabels } from '$lib/content';
	import { quietModeStore } from '$lib/state/quiet-mode.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	let { class: className = '' }: { class?: string } = $props();

	const locale = getLocale();
	const a11y = siteLabels.a11y;
	const copy: QuietModeButtonCopy = {
		collapse: resolveLocale(a11y.quietModeLabel, locale),
		expand: resolveLocale(a11y.quietModeLabelCollapsed, locale),
		collapseTitle: resolveLocale(a11y.quietModeEnable, locale),
		expandTitle: resolveLocale(a11y.quietModeDisable, locale),
		remember: resolveLocale(a11y.quietModeRemember, locale),
		forget: resolveLocale(a11y.quietModeForget, locale),
	};
	const enabled = $derived(quietModeStore.enabled);
	const remembered = $derived(quietModeStore.remembered);

	onMount(() => quietModeStore.init());
</script>

<UiQuietModeButton
	{copy}
	{enabled}
	{remembered}
	onToggle={() => quietModeStore.toggle()}
	onRememberToggle={() =>
		remembered ? quietModeStore.forgetDefault() : quietModeStore.rememberCurrent()}
	activeEffect="glow"
	class={className}
/>
