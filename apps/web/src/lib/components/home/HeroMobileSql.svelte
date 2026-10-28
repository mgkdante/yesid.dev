<!--
  HeroMobileSql — the SQL example under the stacked hero (below lg), closed behind a binder tab that
  hangs from the amber rule; a tab at its foot folds it back up. Desktop shows the panel in the grid.
-->
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
		en: { show: 'See a small example', hide: 'Hide the example' },
		fr: { show: 'Voir un petit exemple', hide: "Masquer l'exemple" },
		es: { show: 'Ver un pequeño ejemplo', hide: 'Ocultar el ejemplo' },
	}[getLocale()];

	const exampleId = $props.id();
	let open = $state(false);
	let showTab = $state<HTMLButtonElement | null>(null);

	function hide() {
		open = false;
		showTab?.focus();
	}
</script>

<div class="hero-sql pb-10 lg:hidden" data-testid="hero-mobile-sql">
	<Collapsible.Root bind:open>
		<!-- Horizontal divider — mirrors the vertical desktop divider -->
		<div class="hero-divider-h mx-6"></div>
		<div class="flex justify-center">
			<Collapsible.Trigger bind:ref={showTab} class="binder-tab tap-press" aria-controls={exampleId}>
				{tabs.show}<span class="binder-tab-mark" aria-hidden="true">{open ? '▴' : '▾'}</span>
			</Collapsible.Trigger>
		</div>

		<Collapsible.Content id={exampleId}>
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
			<div class="hero-divider-h mx-6 mt-8"></div>
			<div class="flex justify-center">
				<button type="button" class="binder-tab tap-press" onclick={hide}>
					{tabs.hide}<span class="binder-tab-mark" aria-hidden="true">▴</span>
				</button>
			</div>
		</Collapsible.Content>
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
