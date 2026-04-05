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
	import { registerGsapPlugins, gsap, ScrollTrigger, SplitText, MorphSVGPlugin } from '$lib/motion/utils/gsap.js';
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

		// Simple horizontal scroll tween — no artificial hold zones.
		const tween = gsap.to(track, {
			x: -scrollDistance,
			ease: 'none',
		});
		tweens.push(tween);

		// Section height multiplier slows horizontal travel.
		// Mobile gets a bigger multiplier because touch swipes cover more
		// scroll distance per gesture than desktop wheels/trackpads.
		const isMobile = window.innerWidth < 768;
		const scrollMultiplier = isMobile ? 1.8 : 1.4;
		const paddedDistance = scrollDistance * scrollMultiplier;
		sectionHeight = `${window.innerHeight + paddedDistance}px`;

		// Build snap points: one per panel. This gives a natural "land on
		// each panel" feel — a quick swipe on trackpad/mobile snaps to the
		// nearest panel instead of stopping mid-transition.
		const panelCount = totalPanelCount;
		const snapPoints = Array.from({ length: panelCount }, (_, i) => i / (panelCount - 1));

		scrollTriggerInstance = ScrollTrigger.create({
			trigger: pinContainer,
			animation: tween,
			scrub: 1,
			pin: true,
			anticipatePin: 1,
			end: () => '+=' + paddedDistance,
			snap: {
				snapTo: snapPoints,
				duration: { min: 0.2, max: 0.6 },
				delay: 0.1,
				ease: 'power1.inOut',
			},
		});

		// Animate each panel's text using containerAnimation — the correct GSAP
		// pattern for triggering animations inside a horizontally-scrolling container.
		// containerAnimation ties each panel's ScrollTrigger to the horizontal tween's
		// progress rather than raw vertical scroll position.
		const panelEls = track.querySelectorAll<HTMLElement>('[data-panel-text]');
		panelEls.forEach((el, panelTextIdx) => {
			const panelId = el.closest('[data-testid]')?.getAttribute('data-testid') ?? '';
			const split = new SplitText(el, { type: 'words,chars' });
			splitInstances.push(split);

			// Panel 1 is already visible when the section pins — its animations
			// fire on VERTICAL scroll (as the user arrives at the section) rather
			// than on horizontal scroll progress like panels 2–4.
			const isFirstPanel = panelTextIdx === 0;

			// Non-highlight words: no animation — static white text.
			// Only keyword highlight words get scroll-linked effects.
			// This keeps text uniform and reduces GSAP tween count.

			// Highlight words: apply effect-specific animations per panel
			const highlights = el.querySelectorAll<HTMLElement>('.highlight-word');
			highlights.forEach((hw) => {
				const effect = hw.dataset.highlight;
				const highlightText = hw.textContent?.toLowerCase().trim() ?? '';

				if (effect === 'scale') {
					// Panel 1 "foundation": structural assembly.
					// Chars start sunken, dim, disconnected below the baseline.
					// Rise with controlled, weighted motion and lock into position
					// like building blocks being placed. No bounce or elastic.
					// Animated on VERTICAL scroll as the section enters the viewport.
					const fSplit = new SplitText(hw, { type: 'chars' });
					splitInstances.push(fSplit);
					fSplit.chars.forEach((char, i) => {
						gsap.set(char, {
							y: 25 + (i % 4) * 5,
							x: ((i % 3) - 1) * 4,
							opacity: 0.2,
							filter: 'blur(1px)',
						});
					});
					const fTween = gsap.to(fSplit.chars, {
						y: 0,
						x: 0,
						opacity: 1,
						filter: 'blur(0px)',
						color: '#E07800',
						stagger: { each: 0.03, from: 'start' },
						ease: 'power2.out',
						scrollTrigger: {
							trigger: pinContainer,
							start: 'top 35%',
							end: 'top -5%',
							scrub: true,
						},
					});
					tweens.push(fTween);

				} else if (effect === 'charReveal') {
					// Panel 2: each keyword gets a unique per-word effect.
					if (highlightText === 'data') {
						// Text scramble: chars cycle through random symbols then
						// resolve one-by-one into the correct letters. Uses onUpdate
						// for real-time char replacement scrubbed to scroll position.
						const dSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(dSplit);
						const originalDataChars = dSplit.chars.map((c) => c.textContent || '');
						const scramblePool = '!<>-_\\/[]{}=+*^?#01234ABCDEF';

						dSplit.chars.forEach((char, i) => {
							char.textContent = scramblePool[(i * 7) % scramblePool.length];
							gsap.set(char, { opacity: 0.3 });
						});

						const scrambleST = ScrollTrigger.create({
							trigger: hw,
							containerAnimation: tween,
							start: 'left 55%',
							end: 'left 15%',
							onUpdate: (self) => {
								const p = self.progress;
								dSplit.chars.forEach((charEl, i) => {
									const threshold = (i + 0.8) / originalDataChars.length;
									if (p >= threshold) {
										charEl.textContent = originalDataChars[i];
										gsap.set(charEl, { opacity: 1 });
									} else {
										// Cycle through symbols — Date.now gives rapid cycling while scrolling
										const idx = (i * 7 + Math.floor(Date.now() / 60)) % scramblePool.length;
										charEl.textContent = scramblePool[idx];
										gsap.set(charEl, { opacity: 0.3 + p * 0.5 });
									}
								});
							},
							onLeaveBack: () => {
								dSplit.chars.forEach((charEl, i) => {
									charEl.textContent = scramblePool[(i * 7) % scramblePool.length];
									gsap.set(charEl, { opacity: 0.3 });
								});
							},
							onLeave: () => {
								dSplit.chars.forEach((charEl, i) => {
									charEl.textContent = originalDataChars[i];
									gsap.set(charEl, { opacity: 1 });
								});
							},
						});
						tweens.push(scrambleST);

					} else if (highlightText === 'logic') {
						// Precise assembly: chars start spread from center with blur,
						// converge inward with mathematical precision.
						const lSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(lSplit);
						const lCenter = (lSplit.chars.length - 1) / 2;
						lSplit.chars.forEach((char, i) => {
							gsap.set(char, {
								x: (i - lCenter) * 6,
								opacity: 0.3,
								filter: 'blur(1px)',
							});
						});
						const lTween = gsap.to(lSplit.chars, {
							x: 0,
							opacity: 1,
							filter: 'blur(0px)',
							stagger: { each: 0.04, from: 'center' },
							ease: 'power3.inOut',
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 55%',
								end: 'left 15%',
								scrub: true,
							},
						});
						tweens.push(lTween);

					} else if (highlightText === 'pixels') {
						// Fragmented particles: chars start as blocky fragments —
						// tiny, rotated, blurred, scattered. Snap and cluster into
						// clean typography like resolution increasing.
						const pSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(pSplit);
						pSplit.chars.forEach((char, i) => {
							gsap.set(char, {
								scale: 0.3 + (i % 3) * 0.1,
								rotation: (i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 10),
								opacity: 0.15,
								filter: 'blur(4px)',
								x: (i % 2 === 0 ? 1 : -1) * (4 + (i % 3) * 3),
								y: (i % 3 === 0 ? -1 : 1) * (3 + (i % 4) * 2),
							});
						});
						const pTween = gsap.to(pSplit.chars, {
							scale: 1,
							rotation: 0,
							opacity: 1,
							filter: 'blur(0px)',
							x: 0,
							y: 0,
							stagger: 0.03,
							ease: 'power2.out',
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 55%',
								end: 'left 15%',
								scrub: true,
							},
						});
						tweens.push(pTween);
					}

				} else if (effect === 'wave') {
					if (highlightText === 'stations') {
						// Panel 3 "Stations": chars wave with sine y-offset ripple (KEPT)
						const waveSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(waveSplit);
						const waveTargets = waveSplit.chars.length > 0 ? waveSplit.chars : [hw];
						const waveTl = gsap.timeline({
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 55%',
								end: 'left 20%',
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
						// Panel 3 "understand": disorder → comprehension.
						// Chars start scattered, blurred, dim with random offsets and
						// rotation. Gradually resolve into order — a thought clicking.
						const uSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(uSplit);
						uSplit.chars.forEach((char, i) => {
							gsap.set(char, {
								x: (i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 3),
								y: (i % 3 === 0 ? -1 : 1) * (4 + (i % 4) * 3),
								rotation: (i % 2 === 0 ? 1 : -1) * (5 + (i % 6) * 4),
								opacity: 0.15,
								filter: 'blur(3px)',
							});
						});
						const uTween = gsap.to(uSplit.chars, {
							x: 0,
							y: 0,
							rotation: 0,
							opacity: 1,
							filter: 'blur(0px)',
							color: '#E07800',
							stagger: { each: 0.02, from: 'random' },
							ease: 'power2.out',
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 55%',
								end: 'left 15%',
								scrub: true,
							},
						});
						tweens.push(uTween);
					}

				} else if (effect === 'gradient') {
					if (highlightText === 'motion') {
						// Panel 4 "motion": orange color + 360deg rotation.
						// Rotate from the CENTER of the word so it spins in place
						// rather than orbiting around its left edge.
						gsap.set(hw, { transformOrigin: 'center center' });
						const motionTl = gsap.timeline({
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 75%',
								end: 'left 10%',
								scrub: true,
							},
						});
						motionTl.to(hw, { color: '#E07800', duration: 0.3 });
						motionTl.to(hw, { rotation: 360, ease: 'none', duration: 0.7 }, 0);
						tweens.push(motionTl);

					} else if (highlightText === 'unforgettable') {
						// Panel 4 "unforgettable": ghosted → permanent.
						// Chars start barely visible, drifting — a memory slipping away.
						// Gradually reclaim solidity, becoming emotionally stamped.
						const ufSplit = new SplitText(hw, { type: 'chars' });
						splitInstances.push(ufSplit);
						ufSplit.chars.forEach((char, i) => {
							gsap.set(char, {
								opacity: 0.06,
								y: (i % 2 === 0 ? -1 : 1) * (2 + (i % 3)),
								filter: 'blur(2px)',
								scale: 0.95,
							});
						});
						// Two-phase: ghost becomes visible, then crisp and permanent
						const ufTl = gsap.timeline({
							scrollTrigger: {
								trigger: hw,
								containerAnimation: tween,
								start: 'left 55%',
								end: 'left 8%',
								scrub: true,
							},
						});
						ufTl.to(ufSplit.chars, {
							opacity: 0.5,
							y: 0,
							filter: 'blur(1px)',
							scale: 1,
							stagger: 0.015,
							duration: 0.5,
							ease: 'power1.out',
						});
						ufTl.to(ufSplit.chars, {
							opacity: 1,
							filter: 'blur(0px)',
							color: '#E07800',
							textShadow: '0 0 12px rgba(224,120,0,0.3)',
							stagger: 0.01,
							duration: 0.5,
							ease: 'power2.out',
						});
						tweens.push(ufTl);
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

		// Scroll-linked icon morph + entrance.
		// Icons scale from 0 while their internal SVG paths morph from
		// simple circles into the final icon shapes. After the morph
		// completes, hover effects still work because they target the
		// container/SVG, not individual paths.
		const panelDivs = track.querySelectorAll<HTMLElement>('[data-testid^="journey-panel-"]');
		panelDivs.forEach((panelDiv, panelIdx) => {
			const icons = panelDiv.querySelectorAll<HTMLElement>('[data-skill-hover]');
			if (icons.length === 0) return;

			// Panel 1 is already on-screen when the section pins, so its trigger
			// needs to fire at the very start of horizontal scroll (progress 0→15%).
			// Other panels trigger normally as they enter from the right.
			const isFirstPanel = panelIdx === 0;

			// Set initial state: icons start invisible and at scale 0
			gsap.set(Array.from(icons), { scale: 0, opacity: 0 });

			// Scale + fade entrance.
			// Panel 1: vertical scroll trigger (section entering viewport).
			// Panels 2+: horizontal containerAnimation trigger.
			const iconTween = gsap.to(Array.from(icons), {
				scale: 1,
				opacity: 1,
				stagger: 0.1,
				ease: 'back.out(1.7)',
				scrollTrigger: isFirstPanel
					? { trigger: pinContainer, start: 'top 30%', end: 'top -5%', scrub: true }
					: { trigger: panelDiv, containerAnimation: tween, start: 'left 50%', end: 'left 25%', scrub: true },
			});
			tweens.push(iconTween);

			// Morph each icon's SVG paths: circle → final icon form.
			// convertToPath turns rects/circles/lines into <path> elements
			// so MorphSVGPlugin can interpolate between them.
			const startCircle = 'M12,4 A8,8 0 1,1 12,20 A8,8 0 1,1 12,4 Z';

			icons.forEach((container) => {
				const svg = container.querySelector('svg');
				if (!svg) return;

				// Convert basic SVG shapes to <path> for morphing.
				// <text> elements (e.g. "TS" in TypeScript) are left unchanged.
				// Convert basic SVG shapes to <path> one-by-one.
				// convertToPath replaces the element in the DOM with a <path>.
				const convertible = svg.querySelectorAll('rect, circle, line, ellipse, polygon, polyline');
				convertible.forEach((el) => {
					MorphSVGPlugin.convertToPath(el as unknown as string);
				});

				// Morph all <path> elements from a circle to their final form
				const paths = svg.querySelectorAll<SVGPathElement>('path');
				paths.forEach((p) => {
					const finalD = p.getAttribute('d') || '';
					if (!finalD) return;
					p.setAttribute('d', startCircle);

					const morphTween = gsap.to(p, {
						morphSVG: finalD,
						ease: 'power2.inOut',
						scrollTrigger: isFirstPanel
							? { trigger: pinContainer, start: 'top 25%', end: 'top -5%', scrub: true }
							: { trigger: panelDiv, containerAnimation: tween, start: 'left 45%', end: 'left 20%', scrub: true },
					});
					tweens.push(morphTween);
				});

				// Fade in <text> elements slightly later (they can't morph)
				const textEls = svg.querySelectorAll('text');
				textEls.forEach((t) => {
					gsap.set(t, { opacity: 0 });
					const textTween = gsap.to(t, {
						opacity: 1,
						ease: 'power2.in',
						scrollTrigger: isFirstPanel
							? { trigger: pinContainer, start: 'top 15%', end: 'top -5%', scrub: true }
							: { trigger: panelDiv, containerAnimation: tween, start: 'left 35%', end: 'left 20%', scrub: true },
					});
					tweens.push(textTween);
				});
			});
		});

		// Panel 5 CTA: "Your next stop?" — separate "stop" for brake effect
		const ctaPanel = track.querySelector<HTMLElement>('[data-testid="journey-cta-prompt"]');
		const ctaTextEl = ctaPanel?.querySelector<HTMLElement>('[data-cta-text]');
		if (ctaTextEl) {
			const ctaSplit = new SplitText(ctaTextEl, { type: 'chars' });
			splitInstances.push(ctaSplit);

			// Separate "stop" chars (inside highlight-brake span) from others
			const stopHighlight = ctaTextEl.querySelector('.highlight-brake');
			const allCtaChars = Array.from(ctaSplit.chars) as HTMLElement[];
			const stopChars = stopHighlight
				? allCtaChars.filter((c) => stopHighlight.contains(c))
				: [];
			const otherChars = allCtaChars.filter((c) => !stopChars.includes(c));

			// Non-stop chars: no animation — static white text.
			// Only "stop" keyword gets the brake effect.

			// "stop" chars: train braking into station.
			// Subtle initial momentum (small offset + slight stretch + blur),
			// then decelerate and lock into crisp yellow position.
			// Values kept small so the word is always readable even at progress 0.
			if (stopChars.length > 0) {
				stopChars.forEach((char, i) => {
					gsap.set(char, {
						x: 10 - (i * 2),
						scaleX: 1.04,
						opacity: 0.75,
						filter: 'blur(0.5px)',
					});
				});

				// Start at 75% (entering from right), complete by 50% (center).
				// Completing by center ensures the animation finishes on any
				// screen width, including mobile where the word can't scroll
				// as far left before the pin releases.
				const brakeTween = gsap.to(stopChars, {
					x: 0,
					scaleX: 1,
					opacity: 1,
					filter: 'blur(0px)',
					color: '#FFB627',
					stagger: 0.04,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: stopHighlight!,
						containerAnimation: tween,
						start: 'left 75%',
						end: 'left 50%',
						scrub: true,
					},
				});
				tweens.push(brakeTween);
			}
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
					start: 'left 40%',
					end: 'left 15%',
					scrub: true,
				},
			});
			tweens.push(ctaBtnEntrance);

			// Exaggerated pulsing glow — fires once CTA enters, loops forever
			ScrollTrigger.create({
				trigger: ctaButton,
				containerAnimation: tween,
				start: 'left 40%',
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
		// Revert in reverse order — inner SplitText instances must revert
		// before outer ones to avoid operating on already-restored DOM nodes
		for (let i = splitInstances.length - 1; i >= 0; i--) {
			splitInstances[i].revert();
		}
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
					class="relative mb-16 last:mb-0"
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
						class="relative flex h-full w-screen flex-shrink-0 flex-col justify-center px-12 md:px-20 lg:px-32"
					>
						<!-- Panel label -->
						<p class="mb-6 font-mono text-xs tracking-[3px] text-[#E07800] uppercase">
							{resolveLocale(panel.label, 'en')}
						</p>

						<!-- Panel text with highlighted words (SplitText target).
							 All panels use white #f5f5f5 base. GSAP animates highlight
							 words to their target color (orange/yellow) per the color map. -->
						<p
							data-panel-text
							class="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
							style="color: #f5f5f5;"
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
					class="relative flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-10"
				>
					<div class="flex items-center gap-4">
						<span class="h-4 w-4 rounded-full bg-[#E07800] animate-pulse"></span>
						<p data-cta-text class="font-heading text-4xl font-bold text-[var(--text-primary)] md:text-5xl lg:text-6xl">
							{@html ctaPromptText.replace(/\b(stop)\b/i, '<span class="highlight-word highlight-brake" data-highlight="brake" style="display:inline-block; transform-origin:center bottom">$1</span>')}
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
