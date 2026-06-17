<script lang="ts">
	import type { AboutLanguage } from '$lib/types';
	import { asset } from '$lib/directus/assets';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	const locale = getLocale();

	let { languages, stop, label }: { languages: readonly AboutLanguage[]; stop: string; label: string } = $props();

	let activeIndex = $state(-1);

	function handleTap(index: number) {
		activeIndex = activeIndex === index ? -1 : index;
	}

	function resolveLanguageImage(image: string): string {
		if (image.startsWith('/') || image.startsWith('http') || image.startsWith('data:')) return image;
		return asset(image);
	}
</script>

<div class="group h-full" use:cursorGlow>
	<Card class="relative h-full !gap-0 overflow-hidden !py-0" data-testid="about-languages">
		<div class="language-stop-badge absolute top-3 left-4 z-20">
			<StopLabel {stop} {label} />
		</div>
		<div class="relative flex h-full flex-col">
			<div class="language-strip flex h-full min-h-36 flex-col">
				{#each languages as language, i}
					{@const languageLabel = resolveLocale(language.label, locale)}
					{@const imageSrc = resolveLanguageImage(language.image)}
					<button
						type="button"
						class="tap-press language-flag relative flex min-h-0 flex-1 items-center justify-center overflow-hidden transition-all duration-500 ease-out"
						class:language-flag-seamed={i > 0}
						class:language-flag-active={activeIndex === i}
						data-testid="about-language-flag"
						data-region={language.id}
						aria-label={languageLabel}
						aria-pressed={activeIndex === i}
						onclick={() => handleTap(i)}
					>
						<img
							src={imageSrc}
							alt=""
							class="flag-image absolute inset-0 transition-transform duration-500 ease-out"
							data-testid="about-language-image"
							loading="lazy"
							decoding="async"
						/>
						<div class="flag-overlay absolute inset-0 transition-opacity duration-500"></div>

						<span class="flag-label absolute z-10 font-mono text-caption font-semibold tracking-[3px]">
							{languageLabel}
						</span>
					</button>
				{/each}
			</div>
		</div>
	</Card>
</div>

<style>
	.language-strip {
		container-type: inline-size;
		isolation: isolate;
	}

	.language-stop-badge {
		border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--background) 72%, transparent);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--background) 45%, transparent);
		padding: 0.22rem 0.42rem;
		backdrop-filter: blur(5px);
	}

	button.language-flag {
		appearance: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		background: transparent;
		cursor: pointer;
	}

	.language-flag {
		min-width: 0;
	}

	.language-flag-seamed {
		border-top: 1px solid color-mix(in srgb, var(--primary) 52%, transparent);
	}

	.flag-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.96) saturate(1.12);
		transform: scale(1.01);
	}

	.flag-overlay {
		background: color-mix(in srgb, var(--background) 12%, transparent);
	}

	.flag-label {
		right: clamp(0.35rem, 1.8cqw, 0.7rem);
		bottom: clamp(0.2rem, 1cqw, 0.45rem);
		padding: 0.1rem 0.35rem;
		border: 1px solid color-mix(in srgb, var(--primary) 42%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--background) 62%, transparent);
		backdrop-filter: blur(4px);
		color: var(--foreground);
		font-size: clamp(0.5rem, 2.65cqw, var(--text-caption));
		letter-spacing: clamp(0.04em, 0.7cqw, 0.22em);
		text-shadow: 0 1px 4px color-mix(in srgb, var(--background) 82%, transparent);
		text-transform: uppercase;
		white-space: nowrap;
	}

	:global([data-theme='light']) .flag-image,
	:global(.theme-light) .flag-image {
		filter: brightness(1.04) saturate(1.08);
	}

	.language-flag:hover .flag-image,
	.language-flag.language-flag-active .flag-image {
		filter: brightness(1.05) saturate(1.18);
		transform: scale(1.04);
	}

	:global([data-theme='light']) .language-flag:hover .flag-image,
	:global(.theme-light) .language-flag:hover .flag-image,
	:global([data-theme='light']) .language-flag.language-flag-active .flag-image,
	:global(.theme-light) .language-flag.language-flag-active .flag-image {
		filter: brightness(1.1) saturate(1.13);
	}

	.language-flag:hover .flag-overlay,
	.language-flag.language-flag-active .flag-overlay {
		opacity: var(--opacity-subtle);
	}

	.language-flag:hover,
	.language-flag.language-flag-active {
		flex: 1.55;
		z-index: 5;
	}
</style>
