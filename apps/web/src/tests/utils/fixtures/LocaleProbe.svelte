<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.js';
	const locale = getLocale();
</script>

<span data-testid="probe">{locale}</span>
