<!--
  Hero banner: scroll-driven SVG metro network animation (Slice A + Slice C).
  Uses Yesid's hand-built montreal_map.svg.

  Phase 1 (0-3%)    — Berri-UQAM dot + "yesid" + "SCROLL DOWN" visible at load
  Phase 1b (3-15%)   — Dot + text pulse (light on/off, opacity)
  Phase 2 (17-45%)   — "yesid" + "SCROLL DOWN" fade out, lines draw outward
  Phase 3 (47-58%)   — Station nodes appear
  Phase 4 (58-65%)   — Labels fade in
  Phase 5 (65-95%)   — Zoom into Berri-UQAM (fills viewport with orange from the node itself)
  Phase 6 (100%)     — Cross-fade SVG out → hero text container in (both orange, seamless)
  Phase 7 (105-140%) — Zoom out hero text container (scale→1), revealing headline
  Phase 8 (110-142%) — Text elements stagger in during zoom-out
  Phase 9 (155%)     — Brief hold, then unpin — SQL panel visible on natural scroll

  Scroll: 800% on all breakpoints. Desktop: Lenis + scrub:true. Mobile: normalizeScroll + scrub:0.5.
-->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, ScrollTrigger, CustomEase } from '$lib/motion/utils/gsap.js';
	import { heroAnimContent, heroContent, INITIAL_HERO_DATA, generateHeroData } from '$lib/data';
	import type { HeroData } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import MetroNetwork from '$lib/motion/svg/MetroNetwork.svelte';
	import HeroMetrics from './HeroMetrics.svelte';
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import { BrandButton } from '$lib/components/brand';

	let pinContainer: HTMLDivElement;
	let svgWrapper: HTMLDivElement;
	let scrollPrompt: HTMLParagraphElement;
	let scrollText: HTMLSpanElement;
	let scrollCursorEl: HTMLSpanElement;
	let networkComponent: ReturnType<typeof MetroNetwork>;
	let reducedMotion = false;

	const scrollDownLabel = resolveLocale(heroAnimContent.scrollDown, 'en');
	const headlineLine1 = resolveLocale(heroContent.headline.line1, 'en');
	const headlineLine2 = resolveLocale(heroContent.headline.line2, 'en');
	const subheadlineText = resolveLocale(heroContent.subheadline, 'en');
	const subtitleText = resolveLocale(heroContent.subtitle, 'en');
	const ctaWorkLabel = resolveLocale(heroContent.ctaWork, 'en');
	const ctaContactLabel = resolveLocale(heroContent.ctaContact, 'en');
	const sqlPrompt = resolveLocale(heroContent.sqlPanel.prompt, 'en');
	const sqlLiveLabel = resolveLocale(heroContent.sqlPanel.liveLabel, 'en');
	const refreshLabel = resolveLocale(heroContent.refreshButton.label, 'en');
	const refreshHelper = resolveLocale(heroContent.refreshButton.helper, 'en');

	let heroTextContainer: HTMLDivElement;
	let heroDot: SVGSVGElement;
	let refreshIcon: HTMLSpanElement;

	let heroData: HeroData = $state(INITIAL_HERO_DATA);
	let updatedAgo: string = $state('30s ago');
	const sectionMinHeight = '900svh';

	function handleRefresh() {
		heroData = generateHeroData();
		updatedAgo = 'just now';
		if (refreshIcon) {
			refreshIcon.style.transition = 'transform 0.6s ease';
			refreshIcon.style.transform = 'rotate(360deg)';
			setTimeout(() => {
				refreshIcon.style.transition = 'none';
				refreshIcon.style.transform = 'rotate(0deg)';
			}, 600);
		}
	}

	// Blink state — shared between typewriter (onMount) and ScrollTrigger (buildHeroTimeline)
	let blinkInterval: ReturnType<typeof setInterval> | undefined;
	let typingComplete = false;

	function startBlink() {
		if (blinkInterval) return;
		if (scrollPrompt) {
			scrollPrompt.style.opacity = '1';
			scrollText.textContent = scrollDownLabel;
			scrollCursorEl.style.opacity = '1';
		}
		let cursorVisible = true;
		blinkInterval = setInterval(() => {
			cursorVisible = !cursorVisible;
			if (scrollCursorEl) {
				scrollCursorEl.style.opacity = cursorVisible ? '1' : '0';
			}
		}, 500);
	}

	function stopBlink() {
		if (blinkInterval) {
			clearInterval(blinkInterval);
			blinkInterval = undefined;
		}
	}

	// Calculate Berri-UQAM position relative to svgWrapper for transform-origin
	function updateZoomOrigin() {
		const berri = pinContainer?.querySelector('.metro-berri');
		if (!berri) return;
		const berriRect = berri.getBoundingClientRect();
		const wrapperRect = svgWrapper.getBoundingClientRect();
		const berriCenterX = berriRect.x + berriRect.width / 2 - wrapperRect.x;
		const berriCenterY = berriRect.y + berriRect.height / 2 - wrapperRect.y;
		const pctX = (berriCenterX / wrapperRect.width) * 100;
		const pctY = (berriCenterY / wrapperRect.height) * 100;
		svgWrapper.style.transformOrigin = `${pctX}% ${pctY}%`;
	}

	// The dot is an inline SVG circle — its getBoundingClientRect gives
	// the exact geometric center with zero measurement error. No canvas
	// metrics, no baseline probes, no anti-aliasing offset drift.
	function getDotGlyphCenter(): { x: number; y: number; size: number } {
		const rect = heroDot.getBoundingClientRect();
		return {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
			size: Math.max(rect.width, rect.height),
		};
	}

	function calcHeroTextScale(): number {
		const glyph = getDotGlyphCenter();
		const screen = Math.max(window.innerWidth, window.innerHeight);
		if (glyph.size === 0) return 250;
		// 2.5x headroom covers mobile browser chrome hide/show (lvh vs svh gap)
		return Math.ceil((screen / glyph.size) * 2.5);
	}

	function calcZoomScale(): number {
		const berri = pinContainer?.querySelector('.metro-berri');
		if (!berri) return 100;
		const rect = berri.getBoundingClientRect();
		const screen = Math.max(window.innerWidth, window.innerHeight);
		const node = Math.max(rect.width, rect.height);
		return Math.ceil((screen / node) * 2.5);
	}

	function updateHeroTextOrigin() {
		const glyph = getDotGlyphCenter();
		const containerRect = heroTextContainer.getBoundingClientRect();
		const pctX = ((glyph.x - containerRect.x) / containerRect.width) * 100;
		const pctY = ((glyph.y - containerRect.y) / containerRect.height) * 100;
		heroTextContainer.style.transformOrigin = `${pctX}% ${pctY}%`;
	}

	/**
	 * Build the complete hero scroll-driven timeline.
	 * Called by gsap.matchMedia() — once per breakpoint match.
	 * All GSAP objects created here are auto-reverted by matchMedia on breakpoint exit.
	 */
	function buildHeroTimeline(): void {
		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) return;

		const lines = svg.querySelectorAll('.metro-line');
		const stations = svg.querySelectorAll('.metro-station:not(.metro-berri)');
		const berri = svg.querySelector('.metro-berri');
		const bg = svg.querySelectorAll('.metro-bg');
		const labels = svg.querySelectorAll('.metro-label');
		if (!berri) return;

		// Show Berri-UQAM dot immediately
		(berri as HTMLElement).style.opacity = '1';

		// Measure origins BEFORE applying scale — matchMedia reverts all styles
		// before calling this, so heroTextContainer is at natural scale=1.
		updateZoomOrigin();
		updateHeroTextOrigin();

		// All text elements start invisible
		const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
		gsap.set(staggerEls, { opacity: 0 });

		// Refresh button starts slightly below for fade-up entrance
		const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
		if (refreshEl) gsap.set(refreshEl, { y: 12 });

		// Set initial hero text scale — use gsap.set so matchMedia can revert
		gsap.set(heroTextContainer, { scale: calcHeroTextScale() });

		const tl = gsap.timeline();

		// === Phase 1 (0-3%): Berri-UQAM + background appear ===
		tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
		tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

		// === Phase 1b (3-15%): Light on/off pulse ===
		tl.to(berri, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
		tl.to(scrollPrompt, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
		tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
		tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
		tl.to(berri, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
		tl.to(scrollPrompt, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
		tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
		tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
		tl.to(berri, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
		tl.to(scrollPrompt, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
		tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);
		tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);

		// === Phase 2 (17-45%): "SCROLL DOWN" fades out, lines draw ===
		tl.to(scrollPrompt, { opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.17);
		lines.forEach((line, i) => {
			const stagger = i * 0.02;
			tl.set(line, { opacity: 1 }, 0.17 + stagger);
			tl.fromTo(line,
				{ drawSVG: '0%' },
				{ drawSVG: '100%', duration: 0.22, ease: 'networkDraw' },
				0.17 + stagger
			);
		});

		// === Phase 3 (47-58%): Station nodes appear ===
		tl.to(stations, {
			opacity: 1, duration: 0.08, stagger: 0.002, ease: 'power1.out'
		}, 0.47);

		// === Phase 4 (58-65%): Labels fade in ===
		tl.to(labels, {
			opacity: 0.6, duration: 0.07, stagger: 0.001, ease: 'power1.out'
		}, 0.58);

		// === Phase 5 (65-95%): Zoom into Berri-UQAM ===
		// Function-based: recalculates origin + scale on invalidateOnRefresh.
		// Origin update MUST happen here (not onRefreshInit) because GSAP
		// evaluates function-based values AFTER reverting inline styles,
		// so berri.getBoundingClientRect() returns the natural-scale position.
		tl.to(svgWrapper, {
			scale: () => { updateZoomOrigin(); return calcZoomScale(); },
			duration: 0.3,
			ease: 'power2.inOut',
		}, 0.65);

		// === Phase 6: Cross-fade SVG → hero text container ===
		tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
		tl.to(heroTextContainer, { opacity: 1, duration: 0.05, ease: 'power2.inOut' }, 1.0);

		// === Phase 7: Zoom out hero text container to scale=1 ===
		// Function-based so invalidateOnRefresh recalculates heroText origin
		// at scale=1 (after revert), preventing drift on within-breakpoint resize.
		tl.to(heroTextContainer, {
			scale: () => { updateHeroTextOrigin(); return 1; },
			duration: 0.35,
			ease: 'power2.out',
		}, 1.05);

		// === Phase 8: Text elements stagger in during zoom-out ===
		const s1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
		const s2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
		const s3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
		const s4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');
		const s5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]');
		const s6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]');
		const s7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]');

		tl.to(s1, { opacity: 1, duration: 0.15, stagger: 0.02, ease: 'power1.out' }, 1.10);
		tl.to(s2, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.18);
		tl.to(s3, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.22);
		tl.to(s4, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.26);
		tl.to(s5, { opacity: 1, duration: 0.10, ease: 'power1.out' }, 1.30);
		tl.to(s6, { opacity: 1, duration: 0.10, stagger: 0.02, ease: 'power1.out' }, 1.32);
		tl.to(s7, { opacity: 1, y: 0, duration: 0.10, ease: 'power1.out' }, 1.38);

		// === Phase 9: Brief hold — let user read headline before unpin ===
		tl.set({}, {}, 1.55);

		// matchMedia rebuilds happen after typing — always allow blink restart
		const typingDone = true;

		// Desktop (Lenis): scrub: true = 1:1 tracking, Lenis provides smoothing.
		// Mobile (normalizeScroll): scrub: 0.5 = small buffer for stable touch feel.
		const isTouch = ScrollTrigger.isTouch > 0;

		ScrollTrigger.create({
			trigger: pinContainer,
			start: 'top top',
			end: '+=800%',
			pin: true,
			scrub: isTouch ? 0.5 : true,
			animation: tl,
			invalidateOnRefresh: true,
			onUpdate: (self: { progress: number; direction: number }) => {
				if (self.progress > 0.005) {
					stopBlink();
				} else if (self.progress <= 0.005 && self.direction === -1 && typingDone) {
					startBlink();
				}
			},
		});

		// Force-sync timeline to current scroll position
		requestAnimationFrame(() => {
			ScrollTrigger.refresh();
		});
	}

	let cleanup: (() => void) | undefined;
	onDestroy(() => cleanup?.());

	onMount(async () => {
		reducedMotion = isPrefersReducedMotion();

		// Lock scroll IMMEDIATELY on mount — before any awaits — to close
		// the gap where the user could scroll before the typewriter starts.
		// Only lock on fresh navigation at the top. Skip on reload so the
		// browser can restore scroll position (avoids replaying the animation).
		const isReload = performance.getEntriesByType('navigation').some(
			(e) => (e as PerformanceNavigationTiming).type === 'reload'
		);
		const shouldLock = !isReload && !reducedMotion && scrollPrompt && window.scrollY < window.innerHeight * 0.3;
		const bodyStyle = document.body.style;
		const htmlStyle = document.documentElement.style;

		if (shouldLock) {
			bodyStyle.position = 'fixed';
			bodyStyle.top = '0';
			bodyStyle.left = '0';
			bodyStyle.right = '0';
			bodyStyle.overflow = 'hidden';
			htmlStyle.overflow = 'hidden';
		}

		const blockScroll = (e: Event) => e.preventDefault();
		const blockKeys = (e: KeyboardEvent) => {
			if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp'].includes(e.code)) {
				e.preventDefault();
			}
		};
		if (shouldLock) {
			document.addEventListener('touchmove', blockScroll, { passive: false });
			document.addEventListener('wheel', blockScroll, { passive: false });
			document.addEventListener('keydown', blockKeys, { capture: true });
		}

		function unlockScroll() {
			bodyStyle.position = '';
			bodyStyle.top = '';
			bodyStyle.left = '';
			bodyStyle.right = '';
			bodyStyle.overflow = '';
			htmlStyle.overflow = '';
			document.removeEventListener('touchmove', blockScroll);
			document.removeEventListener('wheel', blockScroll);
			document.removeEventListener('keydown', blockKeys, { capture: true });
			ScrollTrigger.refresh();
		}

		await tick();
		await new Promise((r) => setTimeout(r, 300));

		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) { if (shouldLock) unlockScroll(); return; }

		if (reducedMotion) {
			svg.querySelectorAll('.metro-line, .metro-station, .metro-bg, .metro-label, .metro-berri').forEach((el) => {
				(el as HTMLElement).style.opacity = '0.2';
			});
			heroTextContainer.style.opacity = '1';
			heroTextContainer.style.transform = 'scale(1)';
			return;
		}

		registerGsapPlugins();
		CustomEase.create('networkDraw', 'M0,0 C0.2,0.6 0.4,1 1,1');

		// Typewriter: one character at a time with trailing cursor.
		// Uses component-scope blink functions. SKIP if scrolled past hero.
		if (shouldLock) {
			const fullText = scrollDownLabel;
			scrollText.textContent = '';
			scrollCursorEl.style.opacity = '1';
			let charIndex = 0;
			const typeInterval = setInterval(() => {
				charIndex++;
				if (charIndex <= fullText.length) {
					scrollText.textContent = fullText.substring(0, charIndex);
				} else {
					clearInterval(typeInterval);
					typingComplete = true;
					startBlink();
					unlockScroll();
				}
			}, 80);
		} else if (scrollText) {
			scrollText.textContent = scrollDownLabel;
			typingComplete = true;
			startBlink();
		}

		// Ensure fonts are loaded before glyph measurements — fallback font
		// metrics differ from Inter, causing transform-origin drift at high scale.
		await document.fonts.ready;

		// ---- matchMedia: responsive timeline with automatic teardown/rebuild ----
		let savedProgress: number | null = null;

		const mm = gsap.matchMedia();

		// Desktop / tablet (>=769px): no Phase 10, 800% scroll range
		mm.add('(min-width: 769px)', () => {
			buildHeroTimeline();

			// Restore scroll position from previous breakpoint
			if (savedProgress !== null) {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) {
					const newScrollY = st.start + (savedProgress * (st.end - st.start));
					window.scrollTo(0, newScrollY);
				}
				savedProgress = null;
			}

			return () => {
				// Cleanup: save progress before teardown
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) savedProgress = st.progress;
			};
		});

		// Mobile (<769px): Phase 10 content scroll, 1100% scroll range
		mm.add('(max-width: 768px)', () => {
			buildHeroTimeline();

			if (savedProgress !== null) {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) {
					const newScrollY = st.start + (savedProgress * (st.end - st.start));
					window.scrollTo(0, newScrollY);
				}
				savedProgress = null;
			}

			return () => {
				const st = ScrollTrigger.getAll().find((s) => s.trigger === pinContainer);
				if (st) savedProgress = st.progress;
			};
		});

		// Sleep/wake: refresh ScrollTrigger when tab becomes visible again
		function onVisibilityChange() {
			if (!document.hidden) {
				ScrollTrigger.refresh();
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		cleanup = () => {
			stopBlink();
			mm.revert(); // kills all animations from both breakpoints
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});
</script>

<section
	class="relative"
	data-testid="hero-banner"
	style="min-height: {reducedMotion ? '100svh' : sectionMinHeight};"
>
	<div
		bind:this={pinContainer}
		class="relative flex w-full items-center justify-center overflow-hidden"
		style="height: 100lvh; padding-bottom: env(safe-area-inset-bottom, 0px);"
	>
		<!-- SVG wrapper — zooms into Berri-UQAM -->
		<div
			bind:this={svgWrapper}
			class="absolute inset-0 flex items-center justify-center md:px-4 md:pr-20"
		>
			<MetroNetwork bind:this={networkComponent} />
		</div>

		<!-- Hero text reveal layer — initially hidden, revealed during zoom-out -->
		<div
			bind:this={heroTextContainer}
			class="absolute inset-0 flex items-start justify-center pt-20 opacity-0 md:items-center md:py-[max(5vh,2.5rem)]"
			data-testid="hero-text-container"
		>
			<div class="w-full px-6 md:px-12">
				<div class="hero-grid">
					<!-- LEFT COLUMN: text viewport on mobile (100dvh) -->
					<div class="hero-viewport-text">
						<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
							<span
								class="block text-hero text-[var(--text-primary)]"
								data-testid="hero-line1"
								data-hero-stagger="1"
							>
								{headlineLine1}
							</span>
						</h1>

						<div class="my-6 md:my-6" data-hero-stagger="3">
							<HeroMetrics metrics={heroData.metrics} />
						</div>

						<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
							<span
								class="block text-hero text-[var(--brand-primary)]"
								data-testid="hero-line2"
							>
								<span data-hero-stagger="1">DON'T BREAK</span><svg
									bind:this={heroDot}
									class="hero-dot"
									data-testid="hero-dot"
									viewBox="0 0 10 10"
									aria-hidden="true"
								><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>
							</span>
						</h1>

						<div
							class="mt-3 text-title font-bold leading-[1.1] text-[var(--text-secondary)] md:mt-2.5 md:text-[clamp(26px,min(3.5vw,4vh),44px)]"
							data-testid="hero-subheadline"
							data-hero-stagger="2"
						>
							{subheadlineText}
						</div>

						<p
							class="mt-5 text-body-lg leading-[1.7] text-[var(--text-secondary)] md:text-heading"
							data-testid="hero-subtitle"
							data-hero-stagger="6"
						>
							{subtitleText}
						</p>

						<div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
							<BrandButton variant="primary" size="lg" href="/work" data-testid="hero-cta-work">
								{ctaWorkLabel}
							</BrandButton>
							<BrandButton variant="ghost" size="lg" href="/contact" data-testid="hero-cta-contact">
								{ctaContactLabel}
							</BrandButton>
						</div>
					</div>

					<!-- VERTICAL DIVIDER (desktop only) -->
					<div
						class="hidden self-stretch md:block"
						data-hero-stagger="5"
					>
						<div class="hero-divider"></div>
					</div>

					<!-- RIGHT COLUMN: desktop only (mobile gets its own section below pin) -->
					<div class="hero-viewport-sql hidden md:block">
						<div data-hero-stagger="4">
							<HeroSqlPanel
								rows={heroData.queryRows}
								queryTime={heroData.queryTime}
								prompt={sqlPrompt}
								liveLabel={sqlLiveLabel}
								{updatedAgo}
							/>
						</div>

						<div class="mt-8 text-center" data-hero-stagger="7">
							<button
								class="refresh-btn"
								data-testid="hero-refresh"
								onclick={handleRefresh}
							>
								<span bind:this={refreshIcon} class="text-xl">&#x21bb;</span>
								{refreshLabel}
							</button>
							<div class="mt-2 font-mono text-caption text-[var(--text-dim)]">
								{refreshHelper}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- "NEXT STOP: SCROLL DOWN" — full-width billboard flush to bottom.
		     Starts empty; typewriter or instant-fill populates on mount.
		     Mobile: wraps to 2 lines at the colon. Desktop: single line. -->
		<p
			bind:this={scrollPrompt}
			class="scroll-prompt pointer-events-none absolute left-0 w-full text-center font-mono font-black uppercase leading-[0.95] text-brand-primary md:whitespace-nowrap md:leading-none"
		>
			<span bind:this={scrollText}></span><span bind:this={scrollCursorEl} class="scroll-block-cursor" aria-hidden="true">&#x2588;</span>
		</p>
	</div>

	<!-- Mobile SQL section — outside the pin, scrolls naturally after hero text.
	     Same data/handlers as desktop SQL panel. Hidden on md+ (desktop has it in-grid). -->
	<div class="md:hidden" data-testid="hero-mobile-sql">
		<!-- Horizontal divider — mirrors the vertical desktop divider -->
		<div class="hero-divider-h mx-6"></div>

		<div class="w-full px-6 py-10">
			<HeroSqlPanel
				rows={heroData.queryRows}
				queryTime={heroData.queryTime}
				prompt={sqlPrompt}
				liveLabel={sqlLiveLabel}
				{updatedAgo}
			/>

			<div class="mt-8 text-center">
				<button
					class="refresh-btn"
					data-testid="hero-refresh-mobile"
					onclick={handleRefresh}
				>
					<span class="text-xl">&#x21bb;</span>
					{refreshLabel}
				</button>
				<div class="mt-2 font-mono text-caption text-[var(--text-dim)]">
					{refreshHelper}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* SVG period dot — replaces text "." for pixel-perfect zoom center.
	   Sized in em so it scales with the heading font-size. */
	.hero-dot {
		display: inline-block;
		width: 0.19em;
		height: 0.19em;
		vertical-align: baseline;
		margin-bottom: 0.03em;
		color: var(--brand-primary);
	}

	/* Two-column hero grid: text | divider | SQL panel */
	.hero-grid {
		display: grid;
		grid-template-columns: 1fr 1px 1fr;
		gap: 32px;
		align-items: start;
	}

	/* Vertical divider with faded ends */
	.hero-divider {
		width: 1px;
		height: 100%;
		background: linear-gradient(
			180deg,
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
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%);
		color: var(--bg-primary);
		border: none;
		padding: 16px 48px;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 800;
		font-family: var(--font-mono);
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow:
			0 0 24px color-mix(in srgb, var(--brand-primary) 30%, transparent),
			0 4px 12px rgba(0, 0, 0, 0.4);
		transition: box-shadow var(--duration-normal), transform var(--duration-normal);
	}
	.refresh-btn:hover {
		box-shadow:
			0 0 40px color-mix(in srgb, var(--brand-primary) 50%, transparent),
			0 6px 20px rgba(0, 0, 0, 0.5);
		transform: translateY(-1px);
	}

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

	/* Full-width billboard text.
	   Mobile: offset bottom by browser chrome height (lvh - dvh) so text
	   stays visible when the address bar is showing. */
	.scroll-prompt {
		font-size: 11.5vw;
		letter-spacing: -0.3vw;
		bottom: calc(100lvh - 100dvh);
	}
	.scroll-block-cursor {
		margin-left: 0.15em;
		opacity: 0;
	}

	@media (min-width: 768px) {
		.scroll-prompt {
			font-size: 6.8vw;
			letter-spacing: -0.5vw;
			bottom: 0;
		}
	}

	/* Mobile: single-column grid */
	@media (max-width: 768px) {
		.hero-grid {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.hero-viewport-text {
			min-height: 100dvh;
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding-block: 2rem;
		}
		.refresh-btn {
			width: 100%;
			justify-content: center;
			padding: 14px;
			font-size: 14px;
		}
	}
</style>
