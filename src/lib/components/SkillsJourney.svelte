<!--
  SkillsJourney: horizontal scroll CTA section placed after the hero.
  Pinned section that scrolls horizontally, revealing panels with large
  narrative text (SplitText effects), tech stack SVG icons in their own
  row below the text, and ending with a CTA button.

  Icons are interactive — each has a unique GSAP hover animation (bounce,
  wiggle, spin, pulse, etc.) triggered on mouseenter/mouseleave.
  Icons also have scroll-linked entrance animations (scale from 0 with bounce).

  Data-driven — panels come from skillsJourneyPanels in the data layer.
  Adding/removing a panel means editing the data array only.

  Reduced motion: panels stack vertically, no horizontal scroll or SplitText.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, ScrollTrigger, SplitText } from '$lib/motion/utils/gsap.js';
	import { skillsJourneyPanels, skillsJourneyCta } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import type { SkillIcon } from '$lib/data/types.js';

	let reducedMotion = $state(false);

	// DOM refs bound via bind:this — not reactive state, only used in onMount
	let pinContainer: HTMLDivElement;
	let track: HTMLDivElement;
	let sectionEl: HTMLElement;

	// Refs for GSAP cleanup
	let scrollTriggerInstance: { kill: () => void } | undefined;
	let splitInstances: { revert: () => void }[] = [];
	let tweens: { kill: () => void }[] = [];

	// Track hover event listeners for cleanup
	let hoverCleanups: (() => void)[] = [];

	// Resolve CTA strings once at init — they don't change
	const ctaPromptText = resolveLocale(skillsJourneyCta.prompt, 'en');
	const ctaButtonText = resolveLocale(skillsJourneyCta.button, 'en');

	// Total panels: data panels + one combined CTA panel (prompt + button)
	const totalPanelCount = skillsJourneyPanels.length + 1;

	// Section height set dynamically in onMount once scrollDistance is known.
	// Formula: viewportHeight + scrollDistance = exact room for the pin with no empty scroll.
	// SSR fallback uses totalPanelCount * 100vh — close enough until JS runs.
	let sectionHeight = $state(`${totalPanelCount * 100}vh`);

	/**
	 * Renders an inline SVG icon for a given SkillIcon type.
	 * Sized at 56x56 for the icon row below text. Simple line-art style:
	 * white strokes with orange accents.
	 */
	function renderSkillIcon(icon: SkillIcon, size = 56): string {
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
	 * Maps highlight words to their target color per the design spec.
	 * Panel 1: "foundation" → orange
	 * Panel 2: "data" → orange, "logic" → yellow, "pixels" → orange
	 * Panel 3: "Stations" → yellow, "understand" → orange
	 * Panel 4: "motion" → orange/gradient, "unforgettable" → orange
	 */
	const highlightColorMap: Record<string, string> = {
		foundation: '#E07800',
		data: '#E07800',
		logic: '#FFB627',
		pixels: '#E07800',
		stations: '#FFB627',
		understand: '#E07800',
		motion: '#E07800',
		unforgettable: '#E07800',
	};

	/**
	 * Wraps highlight words in styled spans for GSAP animation.
	 * Each highlight span gets its target color applied directly so the
	 * word is always visible at its scroll position (no opacity:0 bugs).
	 * transformOrigin: 'left bottom' prevents scale-ups from overlapping text.
	 */
	function markHighlightWords(
		text: string,
		highlights: readonly string[],
		effect: string,
		panelId?: string
	): string {
		let result = text;
		for (const word of highlights) {
			const regex = new RegExp(`(${word})`, 'i');
			// For 'scale' effect (panel 1), words START at the base text color
			// and GSAP animates them to their target color on scroll.
			// Other effects pre-set the color so the word is always visible.
			const color = effect === 'scale'
				? 'inherit'
				: (highlightColorMap[word.toLowerCase()] || '#E07800');
			result = result.replace(
				regex,
				`<span class="highlight-word highlight-${effect}" data-highlight="${effect}" style="display:inline-block; color:${color}; transform-origin:left bottom">$1</span>`
			);
		}
		return result;
	}

	/**
	 * Applies a unique GSAP hover animation based on the skill icon type.
	 * Each icon gets a distinct effect for variety and delight.
	 */
	function applyHoverEffect(container: HTMLElement, iconType: string): void {
		const svgEl = container.querySelector('svg');
		const nameEl = container.querySelector('[data-skill-name]');

		const onEnter = () => {
			// Animate the skill name text on hover — orange + lift
			if (nameEl) {
				gsap.to(nameEl, { color: '#E07800', y: -3, duration: 0.3, ease: 'power2.out' });
			}

			if (!svgEl) return;

			switch (iconType) {
				case 'sql':
					// Scale up + slight rotate + glow shadow on the container
					gsap.to(svgEl, { scale: 1.2, rotation: 5, duration: 0.4, ease: 'back.out(1.7)' });
					gsap.to(container, { boxShadow: '0 0 20px rgba(224, 120, 0, 0.4)', duration: 0.4 });
					break;
				case 'typescript':
					// Bounce up with elastic ease
					gsap.to(svgEl, { y: -10, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
					break;
				case 'python':
					// Wiggle rotation: -10 -> 10 -> 0 with spring feel
					gsap.to(svgEl, {
						keyframes: [
							{ rotation: -10, duration: 0.15 },
							{ rotation: 10, duration: 0.15 },
							{ rotation: -5, duration: 0.1 },
							{ rotation: 0, duration: 0.1 },
						],
						ease: 'power1.inOut',
					});
					break;
				case 'sveltekit':
					// Spin 360 degrees
					gsap.to(svgEl, { rotation: 360, duration: 0.6, ease: 'power2.inOut' });
					break;
				case 'gsap':
					// Scale pulse: 1 -> 1.3 -> 1 with back.out
					gsap.to(svgEl, {
						keyframes: [
							{ scale: 1.3, duration: 0.25 },
							{ scale: 1, duration: 0.25 },
						],
						ease: 'back.out(1.7)',
					});
					break;
				case 'powerbi':
					// Bars grow taller — scaleY stretch
					gsap.to(svgEl, { scaleY: 1.2, transformOrigin: 'bottom center', duration: 0.4, ease: 'power2.out' });
					break;
				case 'docker':
					// Slide up and back with a bounce
					gsap.to(svgEl, {
						keyframes: [
							{ y: -15, duration: 0.25, ease: 'power2.out' },
							{ y: 0, duration: 0.4, ease: 'bounce.out' },
						],
					});
					break;
				default:
					gsap.to(svgEl, { scale: 1.15, duration: 0.3, ease: 'power2.out' });
			}
		};

		const onLeave = () => {
			// Revert name text
			if (nameEl) {
				gsap.to(nameEl, { color: 'rgba(255,255,255,0.5)', y: 0, duration: 0.3, ease: 'power2.out' });
			}

			if (!svgEl) return;

			// Reset all icon transforms back to rest state
			gsap.to(svgEl, { scale: 1, rotation: 0, y: 0, scaleY: 1, duration: 0.3, ease: 'power2.out' });
			gsap.to(container, { boxShadow: 'none', duration: 0.3 });
		};

		container.addEventListener('mouseenter', onEnter);
		container.addEventListener('mouseleave', onLeave);

		// Return cleanup function
		hoverCleanups.push(() => {
			container.removeEventListener('mouseenter', onEnter);
			container.removeEventListener('mouseleave', onLeave);
		});
	}

	onMount(() => {
		reducedMotion = isPrefersReducedMotion();
		if (reducedMotion) return;

		registerGsapPlugins();

		if (!pinContainer || !track) return;

		// Calculate total scroll distance — how far the track must translate.
		// On narrow viewports the track is proportionally shorter, so scrollDistance
		// is smaller. The section height must match exactly: viewportHeight + scrollDistance.
		// Too much height = empty scroll after content ends. Too little = pin ends early.
		const scrollDistance = track.scrollWidth - window.innerWidth;

		// Set section height precisely so ScrollTrigger pin has exactly enough room.
		// viewport height (100vh) for the pinned frame itself, plus the scroll distance
		// for the horizontal travel. This works at every viewport width.
		sectionHeight = `${window.innerHeight + scrollDistance}px`;

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
			end: () => '+=' + (track.scrollWidth - window.innerWidth),
		});

		// Animate each panel's text using containerAnimation — the correct GSAP
		// pattern for triggering animations inside a horizontally-scrolling container.
		// containerAnimation ties each panel's ScrollTrigger to the horizontal tween's
		// progress rather than raw vertical scroll position.
		const panelEls = track.querySelectorAll<HTMLElement>('[data-panel-text]');
		panelEls.forEach((el) => {
			const panelId = el.closest('[data-testid]')?.getAttribute('data-testid') ?? '';
			const split = new SplitText(el, { type: 'words,chars' });
			splitInstances.push(split);

			// Non-highlight words: fade in with stagger (opacity 0→1, y 20→0).
			// Filter out words inside highlight spans so they get their own effects.
			const nonHighlightWords = split.words.filter(
				(w: Element) => !w.closest('.highlight-word')
			);
			if (nonHighlightWords.length > 0) {
				const wordTween = gsap.from(nonHighlightWords, {
					opacity: 0,
					y: 20,
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
			}

			// Highlight words: apply effect-specific animations per panel
			const highlights = el.querySelectorAll<HTMLElement>('.highlight-word');
			highlights.forEach((hw) => {
				const effect = hw.dataset.highlight;
				const highlightText = hw.textContent?.toLowerCase().trim() ?? '';

				if (effect === 'scale') {
					// Panel 1 "foundation": grey → orange with pulsing glow.
					// Uses toggleActions (not scrub) so it properly reverses
					// when the panel leaves view. Pulse via yoyo repeat.
					const glowTween = gsap.fromTo(hw,
						{
							color: '#999',
							textShadow: '0 0 0px rgba(224,120,0,0)',
						},
						{
							color: '#E07800',
							textShadow: '0 0 40px rgba(224,120,0,0.9), 0 0 80px rgba(224,120,0,0.5), 0 0 120px rgba(224,120,0,0.25)',
							duration: 0.6,
							ease: 'power2.out',
							yoyo: true,
							repeat: 3,
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 70%',
								toggleActions: 'play reverse play reverse',
							},
						}
					);
					tweens.push(glowTween);

				} else if (effect === 'charReveal') {
					// Panel 2 "data", "logic", "pixels": char-by-char opacity reveal
					const revealSplit = new SplitText(hw, { type: 'chars' });
					splitInstances.push(revealSplit);
					const charTargets = revealSplit.chars.length > 0 ? revealSplit.chars : [hw];
					const charTween = gsap.from(charTargets, {
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
					tweens.push(charTween);

					// Bounce: y: 0 → -20 → 0 (timeline within scroll range, fully reversible).
					// The target color is applied in the same tween so the word
					// lands at its spec color after the bounce.
					const targetColor = highlightColorMap[highlightText] || '#E07800';
					const allCharRevealWords = el.querySelectorAll<HTMLElement>('.highlight-charReveal');
					const wordIndex = Array.from(allCharRevealWords).indexOf(hw);
					const bounceTl = gsap.timeline({
						scrollTrigger: {
							trigger: el,
							containerAnimation: tween,
							// Stagger start positions: each word bounces 3% later
							start: `left ${28 - (wordIndex * 3)}%`,
							end: `left ${16 - (wordIndex * 3)}%`,
							scrub: true,
						},
					});
					// Up phase: y → -20 with target color
					bounceTl.to(hw, { y: -20, color: targetColor, ease: 'power2.out', duration: 0.5 });
					// Down phase: y → 0 (bounce landing)
					bounceTl.to(hw, { y: 0, ease: 'back.out(1.7)', duration: 0.5 });
					tweens.push(bounceTl);

				} else if (effect === 'wave') {
					if (highlightText === 'stations') {
						// Panel 3 "Stations": chars wave with sine y-offset ripple
						const waveSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(waveSplit);
						const waveTargets = waveSplit.chars.length > 0 ? waveSplit.chars : [hw];
						// Ripple up then back to 0 within the scroll range
						const waveTl = gsap.timeline({
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 60%',
								end: 'left 30%',
								scrub: true,
							},
						});
						waveTl.to(waveTargets, {
							y: -15,
							stagger: { each: 0.03, from: 'start' },
							ease: 'sine.inOut',
							duration: 0.5,
						});
						waveTl.to(waveTargets, {
							y: 0,
							color: '#FFB627',
							stagger: { each: 0.03, from: 'start' },
							ease: 'sine.inOut',
							duration: 0.5,
						});
						tweens.push(waveTl);

					} else if (highlightText === 'understand') {
						// Panel 3 "understand": scale 1→1.2 + orange + glow shadow.
						// transformOrigin: left bottom is set in the HTML markup.
						const popTween = gsap.to(hw, {
							scale: 1.2,
							color: '#E07800',
							textShadow: '0 0 20px rgba(224,120,0,0.5)',
							ease: 'power2.out',
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 30%',
								end: 'left 10%',
								scrub: true,
							},
						});
						tweens.push(popTween);
					}

				} else if (effect === 'gradient') {
					if (highlightText === 'motion') {
						// Panel 4 "motion": gradient sweep + 360deg rotation tied to scroll.
						// Gradient reveal phase
						const motionGradient = gsap.to(hw, {
							opacity: 1,
							backgroundImage: 'linear-gradient(90deg, #E07800, #FFB627)',
							backgroundClip: 'text',
							webkitBackgroundClip: 'text',
							webkitTextFillColor: 'transparent',
							ease: 'none',
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 60%',
								end: 'left 40%',
								scrub: true,
							},
						});
						tweens.push(motionGradient);

						// Rotation: full 360deg, tied to scroll so it reverses
						const rotateTween = gsap.to(hw, {
							rotation: 360,
							ease: 'none',
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 40%',
								end: 'left 5%',
								scrub: true,
							},
						});
						tweens.push(rotateTween);

					} else if (highlightText === 'unforgettable') {
						// Panel 4 "unforgettable": scale 1→1.2 + orange + pulse oscillation.
						// transformOrigin: left bottom is set in the HTML markup.
						// Scale + color phase
						const unforgettableScale = gsap.to(hw, {
							opacity: 1,
							scale: 1.2,
							color: '#E07800',
							ease: 'power2.out',
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 40%',
								end: 'left 25%',
								scrub: true,
							},
						});
						tweens.push(unforgettableScale);

						// Pulse oscillation: 1.2 → 1.1 → 1.2 (yoyo within scroll)
						const pulseTween = gsap.to(hw, {
							scale: 1.1,
							yoyo: true,
							repeat: 3,
							ease: 'power1.inOut',
							scrollTrigger: {
								trigger: el,
								containerAnimation: tween,
								start: 'left 25%',
								end: 'left 5%',
								scrub: true,
							},
						});
						tweens.push(pulseTween);
					}
				}
			});
		});

		// Set up interactive GSAP hover effects on skill icon containers.
		// Each icon type gets a unique animation for variety and delight.
		const iconContainers = track.querySelectorAll<HTMLElement>('[data-skill-hover]');
		iconContainers.forEach((container) => {
			const iconType = container.dataset.skillHover || '';
			applyHoverEffect(container, iconType);
		});

		// Scroll-linked entrance animations for skill icons.
		// As each panel scrolls into view, its icons scale up from 0 with a bounce.
		const panelDivs = track.querySelectorAll<HTMLElement>('[data-testid^="journey-panel-"]');
		panelDivs.forEach((panelDiv) => {
			const icons = panelDiv.querySelectorAll<HTMLElement>('[data-skill-hover]');
			if (icons.length === 0) return;

			// Set initial state: icons start invisible and at scale 0
			gsap.set(Array.from(icons), { scale: 0, opacity: 0 });

			const iconTween = gsap.to(Array.from(icons), {
				scale: 1,
				opacity: 1,
				stagger: 0.1,
				ease: 'back.out(1.7)',
				scrollTrigger: {
					trigger: panelDiv,
					containerAnimation: tween,
					start: 'left 70%',
					end: 'left 40%',
					scrub: true,
				},
			});
			tweens.push(iconTween);
		});

		// Panel 5 CTA: char-by-char reveal for "Your next stop?" text
		const ctaPanel = track.querySelector<HTMLElement>('[data-testid="journey-cta-prompt"]');
		const ctaTextEl = ctaPanel?.querySelector<HTMLElement>('[data-cta-text]');
		if (ctaTextEl) {
			const ctaSplit = new SplitText(ctaTextEl, { type: 'chars' });
			splitInstances.push(ctaSplit);
			const ctaCharTween = gsap.from(ctaSplit.chars.length > 0 ? ctaSplit.chars : [ctaTextEl], {
				opacity: 0,
				stagger: 0.04,
				ease: 'power1.in',
				scrollTrigger: {
					trigger: ctaPanel!,
					containerAnimation: tween,
					start: 'left 70%',
					end: 'left 40%',
					scrub: true,
				},
			});
			tweens.push(ctaCharTween);
		}

		// Panel 5 CTA button: scale in with elastic ease, then exaggerated pulsing glow.
		const ctaButton = track.querySelector<HTMLElement>('[data-testid="journey-cta-button"]');
		if (ctaButton) {
			// Scale entrance tied to scroll
			gsap.set(ctaButton, { scale: 0, opacity: 0 });
			const ctaBtnEntrance = gsap.to(ctaButton, {
				scale: 1,
				opacity: 1,
				ease: 'elastic.out(1, 0.4)',
				scrollTrigger: {
					trigger: ctaPanel!,
					containerAnimation: tween,
					start: 'left 50%',
					end: 'left 25%',
					scrub: true,
				},
			});
			tweens.push(ctaBtnEntrance);

			// Exaggerated pulsing glow — fires once CTA enters, loops forever
			ScrollTrigger.create({
				trigger: ctaButton,
				containerAnimation: tween,
				start: 'left 80%',
				once: true,
				onEnter: () => {
					const glowTween = gsap.to(ctaButton, {
						boxShadow: '0 0 60px rgba(224,120,0,0.8), 0 0 120px rgba(224,120,0,0.4), 0 0 200px rgba(224,120,0,0.2)',
						duration: 1.5,
						yoyo: true,
						repeat: -1,
						ease: 'sine.inOut',
					});
					tweens.push(glowTween);
				},
			});
		}
	});

	onDestroy(() => {
		// Clean up hover event listeners
		hoverCleanups.forEach((cleanup) => cleanup());
		hoverCleanups = [];

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
  Outer section: height set dynamically in onMount to exactly
  window.innerHeight + scrollDistance (track.scrollWidth - window.innerWidth).
  This formula ensures ScrollTrigger pin has exactly the right room:
  - Too much height = empty scroll dead zone after content ends (the old bug)
  - Too little = pin releases before the last panel is reached
  SSR fallback: totalPanelCount * 100vh (overridden immediately on mount).
  In reduced motion mode, panels are stacked vertically so we use auto height.
  No background — transparent so the page's own gradient shows through.
-->
<section
	bind:this={sectionEl}
	data-testid="skills-journey"
	class="relative"
	style="height: {reducedMotion ? 'auto' : sectionHeight};"
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

					<!-- Panel text with highlighted words -->
					<p class="font-heading text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl">
						{@html markHighlightWords(
							resolveLocale(panel.text, 'en'),
							panel.highlightWords,
							panel.highlightEffect
						)}
					</p>

					<!-- Skill icons row below text -->
					<div class="mt-8 flex flex-wrap gap-4">
						{#each panel.skills as skill (skill.id)}
							<div
								data-testid="journey-skill-{skill.id}"
								class="flex flex-col items-center gap-2 rounded-lg border border-white/10 px-4 py-3"
								aria-label="{skill.name}"
							>
								{@html renderSkillIcon(skill.icon, 56)}
								<span class="text-xs font-mono text-white/50 tracking-wide">{skill.name}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Combined CTA panel: prompt + button in one block -->
			<div data-testid="journey-cta-prompt" class="text-center">
				<div class="mb-8 inline-flex items-center gap-3">
					<span class="h-3 w-3 rounded-full bg-[#E07800] animate-pulse"></span>
					<p class="font-heading text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
						{ctaPromptText}
					</p>
				</div>
				<div>
					<a
						href="/contact"
						data-testid="journey-cta-button"
						class="inline-flex items-center rounded-lg bg-[#E07800] px-8 py-4 text-lg font-semibold text-[#141414] shadow-[0_0_24px_rgba(224,120,0,0.3)] transition-colors hover:bg-[#C96A00]"
					>
						{ctaButtonText}
					</a>
				</div>
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

						<!-- Panel text with highlighted words (SplitText target).
							 Panel 1 (foundation): muted grey #999 base for non-highlight text.
							 Panels 2-4: white #f5f5f5 for non-highlight words. -->
						<p
							data-panel-text
							class="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
							style="color: {panel.id === 'foundation' ? '#999' : '#f5f5f5'};"
						>
							{@html markHighlightWords(
								resolveLocale(panel.text, 'en'),
								panel.highlightWords,
								panel.highlightEffect
							)}
						</p>

						<!-- Skill icons row — interactive with GSAP hover effects -->
						<div class="mt-10 flex flex-wrap gap-5">
							{#each panel.skills as skill (skill.id)}
								<div
									data-testid="journey-skill-{skill.id}"
									data-skill-hover="{skill.icon}"
									class="group flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-white/10 px-5 py-4 transition-colors hover:border-[#E07800]/30"
									aria-label="{skill.name}"
								>
									{@html renderSkillIcon(skill.icon, 56)}
									<span data-skill-name class="text-xs font-mono text-white/50 tracking-wide transition-colors">{skill.name}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Combined CTA panel: pulsing dot, prompt heading, and CTA button -->
				<div
					data-testid="journey-cta-prompt"
					class="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-10"
				>
					<div class="flex items-center gap-4">
						<span class="h-4 w-4 rounded-full bg-[#E07800] animate-pulse"></span>
						<p data-cta-text class="font-heading text-4xl font-bold text-[var(--text-primary)] md:text-5xl lg:text-6xl">
							{ctaPromptText}
						</p>
					</div>
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
