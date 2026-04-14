<script lang="ts">
	import { ListingLayout } from '$lib/components/shells';

	let { children } = $props();
</script>

<ListingLayout label="Blog">
	{@render children()}
</ListingLayout>
