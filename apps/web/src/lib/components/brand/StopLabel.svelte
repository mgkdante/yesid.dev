<script lang="ts">
	import { StopLabel as UiStopLabel, type StopLabelProps as UiStopLabelProps } from '@yesid/ui/brand';
	import type { Locale } from '$lib/types';
	import { getLocale } from '$lib/utils/locale-context';

	export interface StopLabelProps extends Omit<UiStopLabelProps, 'prefix'> {
		label: string;
	}

	let { ...rest }: StopLabelProps = $props();

	const STOP_WORD: Record<Locale, string> = { en: 'STOP', fr: 'ARRÊT', es: 'PARADA' };
	const locale = getLocale();
</script>

<UiStopLabel prefix={STOP_WORD[locale]} {...rest} />
