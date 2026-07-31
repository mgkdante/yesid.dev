<script lang="ts">
	import type { Snippet } from 'svelte';
	import { boop } from '@yesid/motion/actions';
	import { CornerMarks } from '$lib/components/brand';
	import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
	import QuietModeButton from '$lib/components/shared/QuietModeButton.svelte';

	type Props = {
		accent: string;
		testId: string;
		rootClass: string;
		mobileMinHeight: 380 | 420;
		backHref: string;
		backLabel: string;
		pills: readonly string[];
		pillsAriaLabel: string;
		decorations: Snippet;
		beforePills: Snippet;
		afterPills?: Snippet;
	};

	let {
		accent,
		testId,
		rootClass,
		mobileMinHeight,
		backHref,
		backLabel,
		pills,
		pillsAriaLabel,
		decorations,
		beforePills,
		afterPills,
	}: Props = $props();

	let headerEl = $state<HTMLElement>(undefined!);
</script>

<div
	bind:this={headerEl}
	class="detail-header-shell {rootClass}"
	data-testid={testId}
	style="--header-accent: {accent}; --detail-header-mobile-min-height: {mobileMinHeight}px;"
>
	<div class="header__circuit-grid detail-header-grid"></div>
	<ManifestoCanvas containerEl={headerEl} />

	<section class="header-section w-full">
		<div class="absolute inset-0 pointer-events-none overflow-hidden">
			<CornerMarks size="md" opacity={0.12} />

			<div
				class="header__decoration absolute right-[55px] top-[70px] hidden items-center gap-1.5 lg:flex"
				aria-hidden="true"
			>
				{#each Array(3) as _}
					<div
						class="header__chevron h-3.5 w-3.5 rotate-[-45deg] border-b-2 border-r-2"
						style="border-color: var(--header-accent);"
					></div>
				{/each}
			</div>

			{@render decorations()}
		</div>

		<div class="header__content">
			<a
				href={backHref}
				class="header__back"
				use:boop={{ scale: 1.05, timing: 200 }}
			>
				{backLabel}
			</a>

			{@render beforePills()}

			<nav
				class="header__pills"
				class:header__pills--with-after={afterPills !== undefined}
				aria-label={pillsAriaLabel}
			>
				{#each pills as pill}
					<span class="header__pill">{pill}</span>
				{/each}
			</nav>

			{@render afterPills?.()}

			<div class="header__quiet">
				<QuietModeButton />
			</div>
		</div>
	</section>
</div>

<style>
	.detail-header-shell {
		position: relative;
		margin-top: calc(-1 * var(--nav-clearance, 5.5rem));
		padding-top: var(--nav-clearance, 5.5rem);
		overflow: hidden;
		background: var(--manifesto);
		cursor: crosshair;
	}

	.header-section {
		position: relative;
		display: grid;
		align-items: center;
		min-height: var(--detail-header-mobile-min-height);
	}

	@media (--desktop-min) {
		.header-section {
			min-height: 440px;
		}
	}

	.header__circuit-grid {
		position: absolute;
		inset: 0;
		z-index: var(--z-base);
	}

	.detail-header-grid {
		background-image:
			repeating-linear-gradient(90deg, color-mix(in srgb, var(--header-accent) 3.5%, transparent) 0px, color-mix(in srgb, var(--header-accent) 3.5%, transparent) 1px, transparent 1px, transparent 80px),
			repeating-linear-gradient(0deg, color-mix(in srgb, var(--header-accent) 3.5%, transparent) 0px, color-mix(in srgb, var(--header-accent) 3.5%, transparent) 1px, transparent 1px, transparent 80px);
	}

	.detail-header-grid::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle 2.5px at 80px 80px, color-mix(in srgb, var(--header-accent) 12%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 160px 160px, color-mix(in srgb, var(--header-accent) 8%, transparent) 0%, transparent 3px),
			radial-gradient(circle 2.5px at 240px 80px, color-mix(in srgb, var(--header-accent) 10%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 80px 240px, color-mix(in srgb, var(--header-accent) 6%, transparent) 0%, transparent 3px);
		background-size: 320px 320px;
	}

	.header__decoration {
		z-index: calc(var(--z-content) + 1);
	}

	.header__content {
		position: relative;
		z-index: calc(var(--z-content) + 9);
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		margin-inline: auto;
		padding: 4.5rem 1.25rem 2.5rem;
		text-align: center;
	}

	@media (--desktop-min) {
		.header__content {
			padding: 5.5rem 2rem 3.75rem;
		}
	}

	.header__back {
		display: inline-block;
		margin-bottom: 1.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-back-link);
		letter-spacing: 0;
		color: var(--header-accent);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity var(--duration-normal) ease;
	}

	.header__back:hover {
		opacity: 1;
	}

	@media (--desktop-min) {
		.header__back {
			margin-bottom: 1.75rem;
		}
	}

	.header__pills {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
	}

	.header__pills--with-after {
		margin-bottom: 1.25rem;
	}

	@media (--desktop-min) {
		.header__pills {
			gap: 8px;
		}
	}

	.header__pill {
		padding: 4px 12px;
		border: 1px solid color-mix(in srgb, var(--header-accent) 12%, transparent);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--header-accent) 3%, transparent);
		color: color-mix(in srgb, var(--header-accent) 85%, transparent);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.04em;
	}

	@media (--desktop-min) {
		.header__pill {
			padding: 7px 18px;
			border-color: color-mix(in srgb, var(--header-accent) 15%, transparent);
			background: color-mix(in srgb, var(--header-accent) 4%, transparent);
			color: color-mix(in srgb, var(--header-accent) 90%, transparent);
			font-size: var(--text-caption);
		}
	}

	.header__quiet {
		margin-top: 1.25rem;
	}
</style>
