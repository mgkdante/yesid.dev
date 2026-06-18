<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { siteLabels } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	let { code }: { code: string } = $props();

	const locale = getLocale();

	let svg = $state('');
	let renderError = $state('');
	let root: HTMLElement | null = null;

	const source = $derived(cleanMermaidSource(code));
	const architectureDiagramLabel = $derived(resolveLocale(siteLabels.a11y.architectureDiagram, locale));

	function cleanMermaidSource(value: string): string {
		const trimmed = value.trim();
		return trimmed.replace(/^mermaid\s*\n/i, '').trim();
	}

	function cssVar(style: CSSStyleDeclaration, name: string, fallback: string): string {
		return style.getPropertyValue(name).trim() || fallback;
	}

	function buildThemeVariables(): Record<string, string> {
		const style = getComputedStyle(root ?? document.documentElement);
		const primary = cssVar(style, '--primary', '#E07800');
		const accent = cssVar(style, '--accent', '#FFB627');
		const background = cssVar(style, '--background', '#141414');
		const card = cssVar(style, '--card', '#1a1a1a');
		const foreground = cssVar(style, '--foreground', '#F5F5F0');
		const muted = cssVar(style, '--muted-foreground', '#949494');
		const border = cssVar(style, '--border-subtle', '#2f2f2f');

		return {
			background,
			mainBkg: card,
			primaryColor: card,
			primaryBorderColor: primary,
			primaryTextColor: foreground,
			secondaryColor: background,
			secondaryBorderColor: accent,
			secondaryTextColor: foreground,
			tertiaryColor: background,
			tertiaryBorderColor: border,
			tertiaryTextColor: foreground,
			lineColor: accent,
			textColor: foreground,
			nodeTextColor: foreground,
			clusterBkg: background,
			clusterBorder: primary,
			edgeLabelBackground: card,
			labelTextColor: foreground,
			noteBkgColor: card,
			noteTextColor: foreground,
			noteBorderColor: border,
			actorBkg: card,
			actorBorder: primary,
			actorTextColor: foreground,
			activationBkgColor: primary,
			activationBorderColor: accent,
			signalColor: muted,
			signalTextColor: foreground,
		};
	}

	onMount(() => {
		if (!browser || !source) return;

		let cancelled = false;
		let observer: MutationObserver | null = null;
		let renderToken = 0;
		let queued = false;

		async function renderDiagram(): Promise<void> {
			const token = ++renderToken;
			try {
				renderError = '';
				const mermaid = (await import('mermaid')).default;
				mermaid.initialize({
					startOnLoad: false,
					securityLevel: 'strict',
					theme: 'base',
					themeVariables: buildThemeVariables(),
					flowchart: {
						curve: 'basis',
						htmlLabels: false,
					},
				});
				const id = `mermaid-${Math.random().toString(36).slice(2)}`;
				const rendered = await mermaid.render(id, source);
				if (!cancelled && token === renderToken) svg = rendered.svg;
			} catch {
				if (!cancelled && token === renderToken) renderError = 'Diagram source could not be rendered.';
			}
		}

		function queueRender(): void {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				void renderDiagram();
			});
		}

		void renderDiagram();
		observer = new MutationObserver(queueRender);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class'],
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	});
</script>

<figure class="mermaid-diagram" data-testid="mermaid-diagram" bind:this={root}>
	<div class="mermaid-diagram__surface" aria-label={architectureDiagramLabel}>
		{#if svg}
			{@html svg}
		{:else}
			<pre class="mermaid-diagram__fallback"><code>{source}</code></pre>
		{/if}
	</div>
	{#if renderError}
		<figcaption>{renderError}</figcaption>
	{/if}
</figure>

<style>
	.mermaid-diagram {
		margin: 1.25rem 0 0;
		border: 1px solid color-mix(in srgb, var(--primary) 28%, transparent);
		border-radius: var(--radius-sm);
		background:
			linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), transparent 42%),
			color-mix(in srgb, var(--card) 92%, var(--background));
		padding: 1rem;
	}

	.mermaid-diagram__surface {
		overflow-x: auto;
	}

	.mermaid-diagram__surface :global(svg) {
		display: block;
		width: 100%;
		max-width: 100%;
		height: auto;
		margin-inline: auto;
	}

	.mermaid-diagram__fallback {
		margin: 0;
		background: transparent;
		white-space: pre;
	}

	:global([data-theme="light"]) .mermaid-diagram {
		background:
			linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent 42%),
			var(--card);
	}

	figcaption {
		margin-top: 0.75rem;
		color: color-mix(in srgb, var(--foreground) 65%, transparent);
		font-size: var(--text-caption);
	}
</style>
