<script lang="ts">
	import { Badge } from '@yesid/ui/badge';
	import {
		MetroStation as UiMetroStation,
		type MetroStationProps as UiMetroStationProps
	} from '@yesid/ui/brand';

	export type MetroStationProps = Omit<UiMetroStationProps, 'roundel'>;

	let { ...rest }: MetroStationProps = $props();
</script>

{#snippet yesidRoundel(stationNo: string)}
	<Badge
		variant="number"
		class="station-number-badge"
		style="background-color: var(--signage-bg); color: var(--signage-text);"
		aria-hidden="true"
	>{stationNo}</Badge>
{/snippet}

<UiMetroStation {...rest} roundel={yesidRoundel} />
