<script lang="ts">
	import { getLocale } from '$lib/utils/locale-context';
	const locale = getLocale();
</script>

<span data-testid="probe">{locale}</span>
