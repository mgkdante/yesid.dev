<!--
  SkillsJourney: horizontal scroll CTA section placed after the hero.
  Pinned section that scrolls horizontally, revealing panels with large
  narrative text (SplitText effects), tech stack SVG icons, and ending
  with a CTA button. The metro/train metaphor bridges to digital infrastructure.

  Data-driven — panels come from skillsJourneyPanels in the data layer.
  Adding/removing a panel means editing the data array only.

  Icons are embedded inline with the text near their associated highlight
  words — gsap.com "Animate Anything" style. Some icons have a subtle
  parallax counter-scroll effect for depth.

  Reduced motion: panels stack vertically, no horizontal scroll or SplitText.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, ScrollTrigger, SplitText } from '$lib/motion/utils/gsap.js';
	import { skillsJourneyPanels, skillsJourneyCta } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import type { SkillIcon, JourneySkill } from '$lib/data/types.js';

	let reducedMotion = $state(false);

	// DOM refs bound via bind:this — not reactive state, only used in onMount
	let pinContainer: HTMLDivElement;
	let track: HTMLDivElement;

	// Refs for GSAP cleanup
	let scrollTriggerInstance: { kill: () => void } | undefined;
	let splitInstances: { revert: () => void }[] = [];
	let tweens: { kill: () => void }[] = [];

	// Resolve CTA strings once at init — they don't change
	const ctaPromptText = resolveLocale(skillsJourneyCta.prompt, 'en');
	const ctaButtonText = resolveLocale(skillsJourneyCta.button, 'en');

	// Total panels: data panels + CTA prompt + CTA button
	const totalPanelCount = skillsJourneyPanels.length + 2;

	/**
	 * Renders an inline SVG icon for a given SkillIcon type.
	 * Sized at 48x48 for inline text visibility. Simple line-art style:
	 * white strokes with orange accents.
	 */
	function renderSkillIcon(icon: SkillIcon, size = 48): string {
		const base = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

		switch (icon) {
			case 'sql':
				// Database table grid icon
				return `<svg ${base} stroke="white">
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<line x1="3" y1="9" x2="21" y2="9" />
					<line x1="3" y1="15" x2="21" y2="15" />
					<line x1="9" y1="3" x2="9" y2="21" />
					<circle cx="16" cy="18" r="0.5" fill="#E07800" stroke="#E07800" />
				</svg>`;

			case 'typescript':
				// Rectangle with "TS" text
				return `<svg ${base} stroke="white">
					<rect x="2" y="4" width="20" height="16" rx="2" />
					<text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="white" stroke="none" font-family="monospace">TS</text>
					<line x1="2" y1="8" x2="22" y2="8" stroke="#E07800" />
				</svg>`;

			case 'python':
				// Stacked layers/diamond icon
				return `<svg ${base} stroke="white">
					<path d="M12 2 L22 8 L12 14 L2 8 Z" />
					<path d="M2 12 L12 18 L22 12" stroke="#E07800" />
					<path d="M2 16 L12 22 L22 16" opacity="0.5" />
				</svg>`;

			case 'sveltekit':
				// Hexagon/shield icon
				return `<svg ${base} stroke="white">
					<path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
					<path d="M8 10 L12 14 L16 10" stroke="#E07800" />
				</svg>`;

			case 'gsap':
				// Wave/sine curve icon
				return `<svg ${base} stroke="white">
					<path d="M2 12 C5 6, 8 6, 11 12 C14 18, 17 18, 20 12" />
					<circle cx="2" cy="12" r="1.5" fill="#E07800" stroke="#E07800" />
					<circle cx="20" cy="12" r="1.5" fill="#E07800" stroke="#E07800" />
				</svg>`;

			case 'powerbi':
				// Bar chart icon
				return `<svg ${base} stroke="white">
					<rect x="3" y="14" width="4" height="7" rx="1" fill="#E07800" stroke="#E07800" />
					<rect x="10" y="8" width="4" height="13" rx="1" />
					<rect x="17" y="3" width="4" height="18" rx="1" />
				</svg>`;

			case 'docker':
				// Container/box icon
				return `<svg ${base} stroke="white">
					<path d="M4 10 L4 20 L20 20 L20 10" />
					<path d="M2 10 L12 4 L22 10" />
					<line x1="12" y1="10" x2="12" y2="20" stroke="#E07800" />
					<line x1="8" y1="10" x2="8" y2="20" opacity="0.4" />
					<line x1="16" y1="10" x2="16" y2="20" opacity="0.4" />
				</svg>`;

			default:
				// Fallback: simple circle
				return `<svg ${base} stroke="white">
					<circle cx="12" cy="12" r="8" />
					<circle cx="12" cy="12" r="2" fill="#E07800" stroke="#E07800" />
				</svg>`;
		}
	}

	/**
	 * Builds panel HTML with icons embedded inline near highlight words.
	 * Icons appear right before their associated highlight word, floating
	 * between words at roughly the same visual size as the heading text.
	 *
	 * Strategy: pair each skill with a highlight word (round-robin if
	 * counts differ). Insert the icon span just before the matched word.
	 */
	function buildPanelContent(
		text: string,
		highlights: readonly string[],
		effect: string,
		skills: readonly JourneySkill[]
	): string {
		// Map each highlight word to the skills that should appear before it.
		// Distribute skills across highlights round-robin style.
		const highlightSkillMap = new Map<string, JourneySkill[]>();
		for (const h of highlights) {
			highlightSkillMap.set(h.toLowerCase(), []);
		}

		skills.forEach((skill, idx) => {
			if (highlights.length > 0) {
				const targetHighlight = highlights[idx % highlights.length];
				const bucket = highlightSkillMap.get(targetHighlight.toLowerCase());
				if (bucket) bucket.push(skill);
			}
		});

		let result = text;

		// Process each highlight word: inject icons before it and wrap in highlight span
		for (const word of highlights) {
			const regex = new RegExp(`(${word})`, 'i');
			const associatedSkills = highlightSkillMap.get(word.toLowerCase()) || [];

			// Build inline icon HTML for skills associated with this word
			const iconHtml = associatedSkills
				.map(
					(skill) =>
						`<span class="journey-inline-icon inline-flex items-baseline align-baseline mx-1" data-testid="journey-skill-${skill.id}" data-parallax-icon aria-label="${skill.name}">` +
						renderSkillIcon(skill.icon, 48) +
						`</span>`
				)
				.join('');

			// Place icons just before the highlight word
			result = result.replace(
				regex,
				`${iconHtml}<span class="highlight-word highlight-${effect}" data-highlight="${effect}">$1</span>`
			);
		}

		// Any remaining skills that did not get attached to a highlight word
		// (happens when there are more skills than highlights and skills overflow).
		// Append them at the end.
		const placedSkillIds = new Set(
			Array.from(highlightSkillMap.values())
				.flat()
				.map((s) => s.id)
		);
		const unplacedSkills = skills.filter((s) => !placedSkillIds.has(s.id));
		if (unplacedSkills.length > 0) {
			const trailingIcons = unplacedSkills
				.map(
					(skill) =>
						` <span class="journey-inline-icon inline-flex items-baseline align-baseline mx-1" data-testid="journey-skill-${skill.id}" data-parallax-icon aria-label="${skill.name}">` +
						renderSkillIcon(skill.icon, 48) +
						`</span>`
				)
				.join('');
			result += trailingIcons;
		}

		return result;
	}

	onMount(() => {
		reducedMotion = isPrefersReducedMotion();
		if (reducedMotion) return;

		registerGsapPlugins();

		if (!pinContainer || !track) return;

		// Calculate total scroll distance — how far the track must translate
		const scrollDistance = track.scrollWidth - window.innerWidth;

		// Main horizontal scroll tween — translates the track leftward
		const tween = gsap.to(track, {
			x: -scrollDistance,
			ease: 'none',
		});
		tweens.push(tween);

		// Pin the container and scrub the horizontal tween with vertical scroll.
		// end uses scrollDistance so the pin lasts exactly as long as the track is wide.
		scrollTriggerInstance = ScrollTrigger.create({
			trigger: pinContainer,
			animation: tween,
			scrub: 1,
			pin: true,
			anticipatePin: 1,
			end: () => '+=' + scrollDistance,
		});

		// Animate each panel's text using containerAnimation — the correct GSAP
		// pattern for triggering animations inside a horizontally-scrolling container.
		// containerAnimation ties each panel's ScrollTrigger to the horizontal tween's
		// progress rather than raw vertical scroll position.
		const panelEls = track.querySelectorAll<HTMLElement>('[data-panel-text]');
		panelEls.forEach((el) => {
			const split = new SplitText(el, { type: 'words,chars' });
			splitInstances.push(split);

			// Stagger text reveal as the panel scrolls into view
			const wordTween = gsap.from(split.words.length > 0 ? split.words : [el], {
				opacity: 0,
				y: 30,
				stagger: 0.05,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: el,
					containerAnimation: tween,
					start: 'left 80%',
					end: 'left 30%',
					scrub: true,
				},
			});
			tweens.push(wordTween);

			// Highlight words: apply effect-specific animations
			const highlights = el.querySelectorAll<HTMLElement>('.highlight-word');
			highlights.forEach((hw) => {
				const effect = hw.dataset.highlight;
				let highlightTween: { kill: () => void } | undefined;

				if (effect === 'scale') {
					highlightTween = gsap.to(hw, {
						scale: 1.2,
						color: '#E07800',
						ease: 'power2.out',
						scrollTrigger: {
							trigger: el,
							containerAnimation: tween,
							start: 'left 60%',
							end: 'left 30%',
							scrub: true,
						},
					});
				} else if (effect === 'gradient') {
					highlightTween = gsap.to(hw, {
						backgroundImage: 'linear-gradient(90deg, #E07800, #FFB627)',
						backgroundClip: 'text',
						webkitBackgroundClip: 'text',
						webkitTextFillColor: 'transparent',
						ease: 'none',
						scrollTrigger: {
							trigger: el,
							containerAnimation: tween,
							start: 'left 60%',
							end: 'left 30%',
							scrub: true,
						},
					});
				} else if (effect === 'wave') {
					const waveSplit = new SplitText(hw, { type: 'chars' });
					splitInstances.push(waveSplit);
					highlightTween = gsap.from(waveSplit.chars.length > 0 ? waveSplit.chars : [hw], {
						y: -15,
						stagger: { each: 0.03, from: 'start' },
						ease: 'sine.inOut',
						scrollTrigger: {
							trigger: el,
							containerAnimation: tween,
							start: 'left 60%',
							end: 'left 30%',
							scrub: true,
						},
					});
				} else if (effect === 'charReveal') {
					const revealSplit = new SplitText(hw, { type: 'chars' });
					splitInstances.push(revealSplit);
					highlightTween = gsap.from(revealSplit.chars.length > 0 ? revealSplit.chars : [hw], {
						opacity: 0,
						stagger: 0.04,
						ease: 'power1.in',
						scrollTrigger: {
							trigger: el,
							containerAnimation: tween,
							start: 'left 60%',
							end: 'left 30%',
							scrub: true,
						},
					});
				}

				if (highlightTween) tweens.push(highlightTween);
			});
		});

		// Parallax effect on inline icons — translate slightly opposite to scroll
		// direction for depth. Uses the main horizontal tween's progress via
		// containerAnimation so the offset tracks the scroll precisely.
		const parallaxIcons = track.querySelectorAll<HTMLElement>('[data-parallax-icon]');
		parallaxIcons.forEach((iconEl, i) => {
			// Alternate direction and magnitude for visual variety
			const xOffset = i % 2 === 0 ? 30 : -25;
			const yOffset = i % 3 === 0 ? -8 : 6;

			const pTween = gsap.to(iconEl, {
				x: xOffset,
				y: yOffset,
				ease: 'none',
				scrollTrigger: {
					trigger: iconEl,
					containerAnimation: tween,
					start: 'left right',
					end: 'right left',
					scrub: true,
				},
			});
			tweens.push(pTween);
		});
	});

	onDestroy(() => {
		// Clean up all GSAP artifacts to prevent memory leaks
		tweens.forEach((t) => t.kill());
		tweens = [];
		scrollTriggerInstance?.kill();
		scrollTriggerInstance = undefined;
		splitInstances.forEach((s) => s.revert());
		splitInstances = [];
	});
</script>

<!--
  Outer section: height set to allow ScrollTrigger pinning.
  scrollDistance = track.scrollWidth - window.innerWidth. We use
  totalPanelCount * 150vh to guarantee enough vertical room for the pin.
  In reduced motion mode, panels are stacked vertically so we use auto height.
  No background — transparent so the page's own gradient shows through.
-->
<section
	data-testid="skills-journey"
	class="relative"
	style="height: {reducedMotion ? 'auto' : `${totalPanelCount * 150}vh`};"
>
	{#if reducedMotion}
		<!-- Reduced motion: vertical stack, no animation -->
		<div class="mx-auto max-w-5xl px-6 py-20">
			{#each skillsJourneyPanels as panel (panel.id)}
				<div
					data-testid="journey-panel-{panel.id}"
					class="mb-16 last:mb-0"
				>
					<!-- Panel label -->
					<p class="mb-4 font-mono text-xs tracking-[3px] text-[#E07800] uppercase">
						{resolveLocale(panel.label, 'en')}
					</p>

					<!-- Panel text with inline icons -->
					<p class="font-heading text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl">
						{@html buildPanelContent(
							resolveLocale(panel.text, 'en'),
							panel.highlightWords,
							panel.highlightEffect,
							panel.skills
						)}
					</p>
				</div>
			{/each}

			<!-- CTA prompt -->
			<div data-testid="journey-cta-prompt" class="mb-8 text-center">
				<div class="inline-flex items-center gap-3">
					<span class="h-3 w-3 rounded-full bg-[#E07800] animate-pulse"></span>
					<p class="font-heading text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
						{ctaPromptText}
					</p>
				</div>
			</div>

			<!-- CTA button -->
			<div class="text-center">
				<a
					href="/contact"
					data-testid="journey-cta-button"
					class="inline-flex items-center rounded-lg bg-[#E07800] px-8 py-4 text-lg font-semibold text-[#141414] shadow-[0_0_24px_rgba(224,120,0,0.3)] transition-colors hover:bg-[#C96A00]"
				>
					{ctaButtonText}
				</a>
			</div>
		</div>
	{:else}
		<!-- Animated mode: horizontal scroll with pinning -->
		<div bind:this={pinContainer} class="relative h-screen overflow-hidden">
			<!-- Orange metro line threading through all panels -->
			<div
				class="absolute top-12 left-0 z-10 h-[2px] bg-[#E07800]"
				style="width: {totalPanelCount * 100}vw;"
				aria-hidden="true"
			></div>

			<!-- Horizontal track -->
			<div
				bind:this={track}
				class="flex h-full"
				style="width: {totalPanelCount * 100}vw;"
			>
				{#each skillsJourneyPanels as panel (panel.id)}
					<div
						data-testid="journey-panel-{panel.id}"
						class="flex h-full w-screen flex-shrink-0 flex-col justify-center px-12 md:px-20 lg:px-32"
					>
						<!-- Panel label -->
						<p class="mb-6 font-mono text-xs tracking-[3px] text-[#E07800] uppercase">
							{resolveLocale(panel.label, 'en')}
						</p>

						<!-- Panel text with inline icons (SplitText target) -->
						<p
							data-panel-text
							class="font-heading text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl"
						>
							{@html buildPanelContent(
								resolveLocale(panel.text, 'en'),
								panel.highlightWords,
								panel.highlightEffect,
								panel.skills
							)}
						</p>
					</div>
				{/each}

				<!-- CTA prompt panel -->
				<div
					data-testid="journey-cta-prompt"
					class="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center"
				>
					<div class="flex items-center gap-4">
						<span class="h-4 w-4 rounded-full bg-[#E07800] animate-pulse"></span>
						<p class="font-heading text-4xl font-bold text-[var(--text-primary)] md:text-5xl lg:text-6xl">
							{ctaPromptText}
						</p>
					</div>
				</div>

				<!-- CTA button panel -->
				<div
					class="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center"
				>
					<a
						href="/contact"
						data-testid="journey-cta-button"
						class="inline-flex items-center rounded-lg bg-[#E07800] px-10 py-5 text-xl font-semibold text-[#141414] shadow-[0_0_32px_rgba(224,120,0,0.3)] transition-all hover:bg-[#C96A00] hover:shadow-[0_0_48px_rgba(224,120,0,0.5)]"
					>
						{ctaButtonText}
					</a>
				</div>
			</div>
		</div>
	{/if}
</section>
