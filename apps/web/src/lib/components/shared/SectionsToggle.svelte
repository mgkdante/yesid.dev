<script lang="ts">
	import { SectionsToggle as UiSectionsToggle } from '@yesid/ui/brand';
	import { localeCopy } from '#lib/locales/index.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	let { class: className = '' }: { class?: string } = $props();
	const locale = getLocale();
</script>

<UiSectionsToggle copy={localeCopy[locale].sections} activeEffect="glow" class={className} />
