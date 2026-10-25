<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.ts';
	const locale = getLocale();
</script>

<span data-testid="probe">{locale}</span>
