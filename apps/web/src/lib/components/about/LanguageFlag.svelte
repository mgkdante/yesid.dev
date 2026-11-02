<!--
  Flags drawn for the box they fill: the emblem keeps its proportions and stays centred,
  while the stripes, bands and cross arms stretch as far as the box needs. Geometry and
  colours follow the public-domain Wikimedia Commons flags of Canada (Pantone) and Quebec.
-->
<script lang="ts" module>
	export const FLAG_IDS = ['quebec', 'canada', 'colombia'] as const;
	export type FlagId = (typeof FLAG_IDS)[number];
	export const isFlagId = (id: string): id is FlagId => (FLAG_IDS as readonly string[]).includes(id);
</script>

<script lang="ts">
	let { id, class: className }: { id: FlagId; class?: string } = $props();

	const LEAF = 'M4890 4430l-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z';
	const FLEUR = 'M2309 1622v-129h-115c0-66 32-130 66-150 20-17 65-25 104-5 51 29 54 113 28 151 243-45 219-280 136-365-67-69-140-79-196-58-128 46-214 199-218 427h-67c0-207 36-273 130-534 48-123 19-275-65-415-31-50-69-95-112-144-43 49-81 94-112 144-84 140-113 292-65 415 94 261 130 327 130 534h-67c-4-228-90-381-218-427-56-21-129-11-196 58-83 85-107 320 136 365-26-38-23-122 28-151 39-20 84-12 104 5 34 20 66 84 66 150h-115v129h239c-3 67-39 119-106 148 8 28 49 85 105 81 11 60 21 94 71 149 50-55 60-89 71-149 56 4 97-53 105-81-67-29-103-81-106-148z';
	const QUADRANTS = [['0', '0'], ['50%', '0'], ['0', '62.5%'], ['50%', '62.5%']] as const;
</script>

<svg class={className} data-flag={id} aria-hidden="true">
	{#if id === 'canada'}
		<rect width="100%" height="100%" fill="#d52b1e" />
		<svg width="100%" height="100%" viewBox="2400 0 4800 4800" overflow="visible">
			<rect x="2400" y="-100000" width="4800" height="204800" fill="#fff" />
			<path d={LEAF} fill="#d52b1e" />
		</svg>
	{:else if id === 'quebec'}
		<rect width="100%" height="100%" fill="#003da5" />
		<svg width="100%" height="100%" viewBox="0 0 4 4" overflow="visible">
			<rect x="1.5" y="-10000" width="1" height="20004" fill="#fff" />
			<rect x="-10000" y="1.5" width="20004" height="1" fill="#fff" />
		</svg>
		{#each QUADRANTS as [x, y]}
			<svg {x} {y} width="50%" height="37.5%" viewBox="0 0 4000 2400"><path d={FLEUR} fill="#fff" /></svg>
		{/each}
	{:else}
		<rect width="100%" height="50%" fill="#fcd116" />
		<rect y="50%" width="100%" height="25%" fill="#003893" />
		<rect y="75%" width="100%" height="25%" fill="#ce1126" />
	{/if}
</svg>
