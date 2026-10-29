<!--
  HeroMobileSql — the SQL example under the stacked hero (below lg), folded up behind a binder tab that
  hangs from the amber rule. Pulling the tab draws the example down and the tab rides at its foot;
  the same tab folds it back. Desktop shows the panel in the grid.
-->
<script lang="ts" module>
	let tugged = false;
</script>

<script lang="ts">
	import * as Collapsible from '@yesid/ui/collapsible';
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import type { HeroData } from '#lib/live/index.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	let {
		heroData,
		sqlPrompt,
		sqlLiveLabel,
		sqlColumnRoute,
		sqlColumnAvgDelay,
		sqlColumnVehicles,
		sqlMetaTemplate,
		updatedAgo,
		refreshLabel,
		refreshHelper,
		onRefresh,
	}: {
		heroData: HeroData;
		sqlPrompt: string;
		sqlLiveLabel: string;
		sqlColumnRoute: string;
		sqlColumnAvgDelay: string;
		sqlColumnVehicles: string;
		sqlMetaTemplate: string;
		updatedAgo: string;
		refreshLabel: string;
		refreshHelper: string;
		onRefresh: () => void;
	} = $props();

	const tabs = {
		en: { show: 'See a small example', close: 'Close' },
		fr: { show: 'Voir un petit exemple', close: 'Fermer' },
		es: { show: 'Ver un pequeño ejemplo', close: 'Cerrar' },
	}[getLocale()];

	let open = $state(false);
	let tab = $state<HTMLButtonElement | null>(null);
	let tug = $state(false);

	// Once per page load, the first time the whole tab is in view, it tugs so it reads as pullable.
	$effect(() => {
		const el = tab;
		if (!el || tugged) return;
		const settle = () => (tug = false);
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				tugged = true;
				tug = true;
			},
			{ threshold: 1 },
		);
		observer.observe(el);
		el.addEventListener('animationend', settle);
		el.addEventListener('animationcancel', settle);
		return () => {
			observer.disconnect();
			el.removeEventListener('animationend', settle);
			el.removeEventListener('animationcancel', settle);
		};
	});
</script>

<div class="hero-sql pb-10 lg:hidden" data-testid="hero-mobile-sql">
	<Collapsible.Root bind:open>
		<Collapsible.Content>
			<div class="example pb-8">
				<div class="hero-divider-h mx-6"></div>
				<div class="w-full px-[var(--space-page-x)] pt-6">
					<HeroSqlPanel
						rows={heroData.queryRows}
						queryTime={heroData.queryTime}
						prompt={sqlPrompt}
						liveLabel={sqlLiveLabel}
						columnRoute={sqlColumnRoute}
						columnAvgDelay={sqlColumnAvgDelay}
						columnVehicles={sqlColumnVehicles}
						metaTemplate={sqlMetaTemplate}
						{updatedAgo}
					/>

					<div class="mt-8 text-center">
						<button
							class="refresh-btn tap-press"
							data-testid="hero-refresh-mobile"
							onclick={onRefresh}
						>
							<span class="text-xl">&#x21bb;</span>
							{refreshLabel}
						</button>
						<div class="mt-2 font-mono text-caption text-[var(--muted-foreground)]">
							{refreshHelper}
						</div>
					</div>
				</div>
			</div>
		</Collapsible.Content>
		<!-- Horizontal divider — mirrors the vertical desktop divider -->
		<div class="hero-divider-h mx-6"></div>
		<div class="flex justify-center">
			<Collapsible.Trigger bind:ref={tab} class="binder-tab tap-press {tug ? 'tug' : ''}">
				{open ? tabs.close : tabs.show}<span class="binder-tab-mark" aria-hidden="true">{open ? '▴' : '▾'}</span>
			</Collapsible.Trigger>
		</div>
	</Collapsible.Root>
</div>

<style>
	/* Horizontal divider for mobile — same amber rule + faded ends as the
	   desktop vertical divider (operator call 2026-07-03: yellow on mobile too). */
	.hero-divider-h {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-rule-accent) 15%,
			var(--border-rule-accent) 85%,
			transparent 100%
		);
	}

	/* A binder separator's tip: a trapezoid hanging from the rule above it. The clip would cut an
	   outside focus ring, so the ring sits inside. */
	.hero-sql :global(.binder-tab) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0.5rem 1.75rem 0.625rem;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 700;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--primary-foreground);
		background: var(--primary);
		border: none;
		clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 12px 100%);
		cursor: pointer;
	}
	.hero-sql :global(.binder-tab:focus-visible) {
		outline: 2px solid var(--primary-foreground);
		outline-offset: -6px;
	}

	/* The example slides down from behind the rule in step with the opening panel, so its foot
	   (and the tab under it) leads. */
	:global([data-state='closed']) .example {
		translate: 0 -100%;
	}
	@media (prefers-reduced-motion: no-preference) {
		.example {
			transition: translate var(--duration-slow) var(--ease-default);
		}
		.hero-sql :global(.binder-tab.tug) {
			animation: binder-tug var(--duration-slower) var(--ease-bounce);
		}
	}
	@keyframes binder-tug {
		40% {
			translate: 0 0.5rem;
		}
	}

	/* Refresh button — orange gradient, glow, JetBrains Mono */
	.refresh-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
		color: var(--background);
		border: none;
		padding: 16px 48px;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 800;
		font-family: var(--font-mono);
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow: var(--shadow-cta);
		transition: box-shadow var(--duration-normal), transform var(--duration-normal);
		width: 100%;
		justify-content: center;
		padding: 14px;
		min-height: 44px;
		font-size: var(--text-mono);
	}
	.refresh-btn:hover {
		box-shadow: var(--shadow-cta-hover);
		transform: translateY(-1px);
	}
</style>
