<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.ts';
	let { label = 'SQL' }: { label?: string } = $props();
	const openLabel = {
		en: 'Open Transit in a new tab',
		fr: 'Ouvrir Transit dans un nouvel onglet',
		es: 'Abrir Transit en una pestaña nueva',
	}[getLocale()];
</script>

<a class="transit-info" data-testid="transit-info-link" href="https://transit.yesid.dev/"
	target="_blank" rel="noopener noreferrer" title="{label} · {openLabel}"
	aria-label="{label} · {openLabel}"><span aria-hidden="true">i</span></a>

<style>
	.transit-info {
		display: inline-flex;
		position: relative;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1rem;
		height: 1rem;
		border: 1px solid currentColor;
		border-radius: 50%;
		font: 11px var(--font-mono);
		color: var(--muted-foreground);
		letter-spacing: 0;
		text-transform: none;
	}
	.transit-info::after { content: ''; position: absolute; inset: -14px; }
	.transit-info:hover { color: var(--primary); }
	.transit-info:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; }
</style>
