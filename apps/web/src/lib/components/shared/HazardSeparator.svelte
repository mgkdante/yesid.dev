<script lang="ts" module>
	import type { SeparatorProps } from '@yesid/ui/separator';

	export type HazardSeparatorProps = Omit<
		Extract<SeparatorProps, { variant: 'hazard' }>,
		'variant' | 'maxWidth'
	>;
</script>

<script lang="ts">
	import { Separator } from '@yesid/ui/separator';

	let { ...props }: HazardSeparatorProps = $props();
</script>

<Separator {...props} variant="hazard" maxWidth="none" />
