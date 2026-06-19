<!--
  HeroMobileSql — Mobile SQL panel section (below the pin, scrolls naturally).
  Hidden on md+ (desktop has it in-grid). Same data/handlers as desktop panel.
-->
<script lang="ts">
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import type { HeroData } from '$lib/content';
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
</script>

<div class="md:hidden" data-testid="hero-mobile-sql">
	<!-- Horizontal divider — mirrors the vertical desktop divider -->
	<div class="hero-divider-h mx-6"></div>

	<div class="w-full px-[var(--space-page-x)] pb-10 pt-4">
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

<style>
	/* Horizontal divider for mobile — faded ends like desktop vertical */
	.hero-divider-h {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border) 15%,
			var(--border) 85%,
			transparent 100%
		);
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
		box-shadow:
			0 0 24px color-mix(in srgb, var(--primary) 30%, transparent),
			0 4px 12px rgba(0, 0, 0, 0.4);
		transition: box-shadow var(--duration-normal), transform var(--duration-normal);
		width: 100%;
		justify-content: center;
		padding: 14px;
		min-height: 44px;
		font-size: 14px;
	}
	:global([data-theme='light']) .refresh-btn {
		box-shadow:
			0 0 24px color-mix(in srgb, var(--primary) 70%, transparent),
			0 4px 12px rgba(0, 0, 0, 0.15);
	}
	.refresh-btn:hover {
		box-shadow:
			0 0 40px color-mix(in srgb, var(--primary) 50%, transparent),
			0 6px 20px rgba(0, 0, 0, 0.5);
		transform: translateY(-1px);
	}
	:global([data-theme='light']) .refresh-btn:hover {
		box-shadow:
			0 0 40px color-mix(in srgb, var(--primary) 95%, transparent),
			0 6px 20px rgba(0, 0, 0, 0.12);
	}
</style>
