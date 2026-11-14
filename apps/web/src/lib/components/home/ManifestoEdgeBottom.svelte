<script lang="ts">
	let {
		connected, line, url, version, scrollHint,
	}: {
		connected: string; line: string; url: string;
		version: string; scrollHint: string;
	} = $props();
</script>

<div data-testid="manifesto-edge-bottom" class="manifesto__edge-bottom" aria-hidden="true">
	<span>{connected}</span>
	<span class="manifesto__separator"></span>
	<span>{line}</span>
	<span class="manifesto__separator"></span>
	<span>{url}</span>
	<span class="manifesto__separator"></span>
	<span>{version}</span>
	<span class="manifesto__separator"></span>
	<span>{scrollHint}</span>
</div>

<style>

	.manifesto__edge-bottom {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 20px;
		z-index: calc(var(--z-content) + 2);
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 1px;
		color: var(--primary); opacity: var(--chrome-ink-opacity);
		white-space: nowrap;
	}


	.manifesto__separator {
		width: 1px;
		height: 10px;
		background: color-mix(in srgb, var(--primary) 20%, transparent);
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__edge-bottom { opacity: 1; transform: translateX(-50%); translate: none; }
	}
</style>
