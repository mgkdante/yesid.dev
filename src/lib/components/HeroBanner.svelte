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
  Phase 9 (150%)     — Hold — hero fully visible, user reads
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

	let pinContainer: HTMLDivElement;
	let svgWrapper: HTMLDivElement;
	let scrollPrompt: HTMLParagraphElement;
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
	let heroDot: HTMLSpanElement;
	let refreshIcon: HTMLSpanElement;

	let heroData: HeroData = $state(INITIAL_HERO_DATA);
	let updatedAgo: string = $state('30s ago');

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

	// Dynamic scroll distance: extended on mobile when hero has two viewports
	let scrollDistance = $state('900svh');

	let cleanup: (() => void) | undefined;
	onDestroy(() => cleanup?.());

	onMount(async () => {
		reducedMotion = isPrefersReducedMotion();

		// Lock scroll IMMEDIATELY on mount — before any awaits — to close
		// the gap where the user could scroll before the typewriter starts.
		// Only lock when at the top (fresh load, not mid-page reload).
		const shouldLock = !reducedMotion && scrollPrompt && window.scrollY < window.innerHeight * 0.3;
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
			// Enable normalizeScroll AFTER unlock — prevents browser chrome
			// from interfering with ScrollTrigger pin calculations.
			ScrollTrigger.normalizeScroll(true);
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

		const lines = svg.querySelectorAll('.metro-line');
		const stations = svg.querySelectorAll('.metro-station:not(.metro-berri)');
		const berri = svg.querySelector('.metro-berri');

		// Shared blink interval — syncs dot + cursor after typing completes.
		// Hoisted so cleanup and ScrollTrigger can clear/restart it.
		let blinkInterval: ReturnType<typeof setInterval> | undefined;
		let typingComplete = false;

		// Start synced dot + cursor blink. Called after typing finishes
		// and again when user scrolls back to top.
		function startBlink() {
			if (blinkInterval) return; // already blinking
			if (scrollPrompt) {
				scrollPrompt.style.opacity = '1';
				scrollPrompt.textContent = scrollDownLabel + '_';
			}
			if (berri) {
				(berri as HTMLElement).style.opacity = '1';
			}
			let cursorVisible = true;
			blinkInterval = setInterval(() => {
				cursorVisible = !cursorVisible;
				if (scrollPrompt) {
					scrollPrompt.textContent = scrollDownLabel + (cursorVisible ? '_' : '\u00A0');
				}
				if (berri) {
					(berri as HTMLElement).style.opacity = cursorVisible ? '1' : '0';
				}
			}, 500);
		}

		function stopBlink() {
			if (blinkInterval) {
				clearInterval(blinkInterval);
				blinkInterval = undefined;
			}
		}

		// Classic JS typewriter: write one character at a time with a trailing
		// underscore cursor. SKIP if page is already scrolled (reload mid-hero).
		if (shouldLock) {
			// Lock + event blockers already set at top of onMount.
			const fullText = scrollDownLabel;
			scrollPrompt.textContent = '_';
			let charIndex = 0;
			const typeInterval = setInterval(() => {
				charIndex++;
				if (charIndex <= fullText.length) {
					scrollPrompt.textContent = fullText.substring(0, charIndex) + '_';
				} else {
					clearInterval(typeInterval);
					typingComplete = true;
					startBlink();
					unlockScroll();
				}
			}, 80);
		} else if (scrollPrompt) {
			// Already scrolled — set full text so it's ready when user scrolls
			// back to top. Don't touch opacity — let GSAP handle it via
			// ScrollTrigger.refresh() below so the timeline state is correct.
			scrollPrompt.textContent = scrollDownLabel + '_';
			typingComplete = true;
			// Enable normalizeScroll immediately — no typing phase needed
			ScrollTrigger.normalizeScroll(true);
		} else {
			// No scrollPrompt — still enable normalizeScroll for mobile
			ScrollTrigger.normalizeScroll(true);
		}
		const bg = svg.querySelectorAll('.metro-bg');
		const labels = svg.querySelectorAll('.metro-label');

		if (!berri) return;

		// Show Berri-UQAM dot immediately on load (before scroll starts)
		// so the intro screen isn't just black — the dot anchors the scene.
		(berri as HTMLElement).style.opacity = '1';

		// Calculate the exact pixel position of Berri-UQAM relative to svgWrapper.
		// This accounts for preserveAspectRatio letterboxing on any screen size.
		function updateZoomOrigin() {
			const berriRect = berri!.getBoundingClientRect();
			const wrapperRect = svgWrapper.getBoundingClientRect();
			const berriCenterX = berriRect.x + berriRect.width / 2 - wrapperRect.x;
			const berriCenterY = berriRect.y + berriRect.height / 2 - wrapperRect.y;
			const pctX = (berriCenterX / wrapperRect.width) * 100;
			const pctY = (berriCenterY / wrapperRect.height) * 100;
			svgWrapper.style.transformOrigin = `${pctX}% ${pctY}%`;
		}
		updateZoomOrigin();

		// Find the actual rendered position and size of the "." glyph.
		// Strategy: use a DOM probe for the baseline (reliable), then
		// Canvas measureText for glyph metrics (ascent/descent of ".").
		function getDotGlyphCenter(): { x: number; y: number; size: number } {
			const spanRect = heroDot.getBoundingClientRect();
			const computed = window.getComputedStyle(heroDot);
			const fontSize = parseFloat(computed.fontSize);

			// Canvas: measure actual glyph dimensions
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			ctx.font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
			const m = ctx.measureText('.');
			const glyphW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
			const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

			// X: centered in the span
			const x = spanRect.x + spanRect.width / 2;

			// Y: find baseline with a zero-height inline-block probe element.
			// This is the only reliable cross-font way to locate the baseline
			// in the actual browser layout (no font-metric estimation needed).
			const probe = document.createElement('span');
			probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;overflow:hidden;';
			heroDot.parentElement!.insertBefore(probe, heroDot);
			const baselineY = probe.getBoundingClientRect().top;
			probe.remove();

			// Glyph center Y = baseline - ascent above baseline + half glyph height
			const y = baselineY - m.actualBoundingBoxAscent + glyphH / 2;

			return { x, y, size: Math.max(glyphW, glyphH) };
		}

		// Scale so the dot glyph fills the viewport
		function calcHeroTextScale(): number {
			const glyph = getDotGlyphCenter();
			const screen = Math.max(window.innerWidth, window.innerHeight);
			if (glyph.size === 0) return 250;
			// 2.5x headroom covers mobile browser chrome hide/show (lvh vs svh gap)
			return Math.ceil((screen / glyph.size) * 2.5);
		}

		// Transform-origin at the dot glyph's visual center
		function updateHeroTextOrigin() {
			const glyph = getDotGlyphCenter();
			const containerRect = heroTextContainer.getBoundingClientRect();
			const pctX = ((glyph.x - containerRect.x) / containerRect.width) * 100;
			const pctY = ((glyph.y - containerRect.y) / containerRect.height) * 100;
			heroTextContainer.style.transformOrigin = `${pctX}% ${pctY}%`;
		}
		updateHeroTextOrigin();

		gsap.set(heroTextContainer, { scale: calcHeroTextScale() });

		// Measure content overflow BEFORE GSAP applies scale transform.
		// On mobile, hero has two 100dvh sections (~200dvh total) inside a 100lvh container.
		const contentInner = heroTextContainer.firstElementChild as HTMLElement;
		const heroOverflow = contentInner
			? Math.max(0, contentInner.scrollHeight - window.innerHeight)
			: 0;

		if (heroOverflow > 0) scrollDistance = '1200svh';

		// All text elements start invisible — dot stays visible as the orange.
		const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
		gsap.set(staggerEls, { opacity: 0 });

		// Refresh button starts slightly below for a fade-up entrance
		const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
		if (refreshEl) gsap.set(refreshEl, { y: 12 });

		// Recalculate on resize so it stays accurate on any screen
		window.addEventListener('resize', updateZoomOrigin);

		const tl = gsap.timeline();

		// === Phase 1 (0-3%): Berri-UQAM + background appear ===
		// Dot and text are already visible at load (opacity:1 in markup)
		tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
		tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

		// === Phase 1b (3-15%): Light on/off pulse — dot, brand, and scroll text ===
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


		// === Phase 2 (17-45%): "yesid" fades out, "SCROLL DOWN" fades out, lines draw ===
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

		// === Phase 3 (47-58%): Station nodes appear AFTER lines ===
		tl.to(stations, {
			opacity: 1,
			duration: 0.08,
			stagger: 0.002,
			ease: 'power1.out'
		}, 0.47);

		// === Phase 4 (58-65%): Labels fade in ===
		tl.to(labels, {
			opacity: 0.6,
			duration: 0.07,
			stagger: 0.001,
			ease: 'power1.out'
		}, 0.58);

		// === Phase 5 (65-95%): Zoom into Berri-UQAM ===
		// No fading lines — they disappear naturally as the node fills the viewport
		// No orange overlay — the orange comes 100% from the SVG node
		// Scale calculated dynamically so the node fills any screen size
		function calcZoomScale(): number {
			const rect = berri!.getBoundingClientRect();
			const screen = Math.max(window.innerWidth, window.innerHeight);
			const node = Math.max(rect.width, rect.height);
			// 2.5x headroom covers mobile browser chrome hide/show (lvh vs svh gap)
			return Math.ceil((screen / node) * 2.5);
		}

		const zoomTween = tl.to(svgWrapper, {
			scale: calcZoomScale(),
			duration: 0.3,
			ease: 'power2.inOut',
		}, 0.65);

		// === Phase 6 (Slice C): Cross-fade SVG → hero text container ===
		// At this point, svgWrapper is fully zoomed (orange fills screen).
		// heroTextContainer is also scaled up so its dot fills the screen.
		// Cross-fade: SVG out, text container in. Visually seamless — both are orange.
		tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
		tl.to(heroTextContainer, { opacity: 1, duration: 0.05, ease: 'power2.inOut' }, 1.0);

		// Fade out the dark background so the page gradient shows through
		tl.to(pinContainer, {
			backgroundColor: 'transparent',
			duration: 0.20,
			ease: 'power1.out',
		}, 1.10);

		// === Phase 7 (Slice C): Zoom out — scale hero text container down to 1 ===
		const heroZoomTween = tl.to(heroTextContainer, {
			scale: 1,
			duration: 0.35,
			ease: 'power2.out',
		}, 1.05);

		// === Phase 8 (Slice 13d): Text elements stagger in during zoom-out — 7 groups ===
		const stagger1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]'); // Headlines
		const stagger2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]'); // Subheadline
		const stagger3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]'); // Metric cards
		const stagger4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]'); // SQL panel
		const stagger5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]'); // Divider
		const stagger6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]'); // Subtitle + CTAs
		const stagger7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]'); // Refresh button

		// Stagger 1: Headlines ("PIPELINES THAT", "DON'T BREAK.")
		tl.to(stagger1, {
			opacity: 1,
			duration: 0.15,
			stagger: 0.02,
			ease: 'power1.out',
		}, 1.10);

		// Stagger 2: Subheadline ("Data that tell the truth.")
		tl.to(stagger2, {
			opacity: 1,
			duration: 0.12,
			ease: 'power1.out',
		}, 1.18);

		// Stagger 3: Metric cards (left → right)
		tl.to(stagger3, {
			opacity: 1,
			duration: 0.12,
			ease: 'power1.out',
		}, 1.22);

		// Stagger 4: SQL panel (fade in)
		tl.to(stagger4, {
			opacity: 1,
			duration: 0.12,
			ease: 'power1.out',
		}, 1.26);

		// Stagger 5: Vertical divider
		tl.to(stagger5, {
			opacity: 1,
			duration: 0.10,
			ease: 'power1.out',
		}, 1.30);

		// Stagger 6: Subtitle + CTAs
		tl.to(stagger6, {
			opacity: 1,
			duration: 0.10,
			stagger: 0.02,
			ease: 'power1.out',
		}, 1.32);

		// Stagger 7: Refresh button (last, fade up)
		tl.to(stagger7, {
			opacity: 1,
			y: 0,
			duration: 0.10,
			ease: 'power1.out',
		}, 1.38);

		// === Phase 9: Hold — hero first viewport visible, user reads ===
		tl.set({}, {}, 1.55);

		// === Phase 10: Scroll through hero content (mobile: reveals SQL section) ===
		// On desktop heroOverflow is 0 so this is a no-op.
		if (heroOverflow > 0) {
			tl.to(heroTextContainer, {
				y: -heroOverflow,
				duration: 0.5,
				ease: 'none',
			}, 1.60);

			// Hold at bottom so user can read SQL + interact with refresh
			tl.set({}, {}, 2.20);
		}

		// Recalculate zoom scale AND transform-origin on resize
		function onResize() {
			updateZoomOrigin();
			zoomTween.vars.scale = calcZoomScale();
			zoomTween.invalidate();
			// Update hero text zoom-out values
			updateHeroTextOrigin();
			const newHeroScale = calcHeroTextScale();
			gsap.set(heroTextContainer, { scale: newHeroScale });
			heroZoomTween.vars.scale = 1;
			heroZoomTween.invalidate();
			ScrollTrigger.refresh();
		}
		window.removeEventListener('resize', updateZoomOrigin); // remove the earlier one
		window.addEventListener('resize', onResize);

		const st = ScrollTrigger.create({
			trigger: pinContainer,
			start: 'top top',
			end: heroOverflow > 0 ? '+=1100%' : '+=800%',
			pin: true,
			scrub: 1,
			animation: tl,
			onUpdate: (self: { progress: number; direction: number }) => {
				if (self.progress > 0.005) {
					stopBlink();
				} else if (self.progress <= 0.005 && self.direction === -1 && typingComplete) {
					startBlink();
				}
			},
			// After pin releases, extend container to fit hero content
			// (two 100dvh sections on mobile = ~200dvh total).
			onLeave: () => {
				pinContainer.style.overflow = 'visible';
				const inner = heroTextContainer.firstElementChild as HTMLElement;
				if (inner && inner.scrollHeight > pinContainer.clientHeight) {
					pinContainer.style.height = inner.scrollHeight + 'px';
				}
			},
			onEnterBack: () => {
				pinContainer.style.overflow = 'hidden';
				pinContainer.style.height = '';
			},
		});

		// On reload at a mid-scroll position, force GSAP to seek the
		// timeline to the current scroll progress. This applies all
		// tweens (including scroll prompt fade) instantly.
		requestAnimationFrame(() => {
			ScrollTrigger.refresh();
		});

		cleanup = () => {
			stopBlink();
			tl.kill();
			window.removeEventListener('resize', onResize);
			ScrollTrigger.getAll().forEach((st) => {
				if (st.trigger === pinContainer) st.kill();
			});
		};
	});
</script>

<section
	class="relative"
	data-testid="hero-banner"
	style="min-height: {reducedMotion ? '100svh' : scrollDistance};"
>
	<div
		bind:this={pinContainer}
		class="relative flex w-full items-center justify-center overflow-hidden bg-[#141414]"
		style="height: 100lvh; padding-bottom: env(safe-area-inset-bottom, 0px);"
	>
		<!-- SVG wrapper — zooms into Berri-UQAM -->
		<div
			bind:this={svgWrapper}
			class="absolute inset-0 flex items-center justify-center px-4 pr-12 md:pr-20"
		>
			<MetroNetwork bind:this={networkComponent} />
		</div>

		<!-- Hero text reveal layer — initially hidden, revealed during zoom-out -->
		<div
			bind:this={heroTextContainer}
			class="absolute inset-0 flex items-start justify-center pt-20 opacity-0 md:items-center md:pt-0"
			data-testid="hero-text-container"
		>
			<div class="w-full px-6 md:px-12">
				<div class="hero-grid">
					<!-- LEFT COLUMN: text viewport on mobile (100dvh) -->
					<div class="hero-viewport-text">
						<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
							<span
								class="block text-[48px] text-[var(--text-primary)] md:text-[clamp(48px,6vw,84px)]"
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
								class="block text-[48px] text-[var(--brand-primary)] md:text-[clamp(48px,6vw,84px)]"
								data-testid="hero-line2"
							>
								<span data-hero-stagger="1">DON'T BREAK</span><span
									bind:this={heroDot}
									class="text-[var(--brand-primary)]"
									data-testid="hero-dot"
								>.</span>
							</span>
						</h1>

						<div
							class="mt-3 text-[22px] font-bold leading-[1.1] text-[var(--text-secondary)] md:mt-2.5 md:text-[clamp(20px,2.5vw,34px)]"
							data-testid="hero-subheadline"
							data-hero-stagger="2"
						>
							{subheadlineText}
						</div>

						<p
							class="mt-5 text-[15px] leading-[1.7] text-[var(--text-secondary)]"
							data-testid="hero-subtitle"
							data-hero-stagger="6"
						>
							{subtitleText}
						</p>

						<div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
							<a
								href="/work"
								class="inline-flex items-center rounded-lg bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-[#141414] transition-colors hover:bg-[var(--brand-primary-hover)]"
								data-testid="hero-cta-work"
							>
								{ctaWorkLabel}
							</a>
							<a
								href="/contact"
								class="inline-flex items-center rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
								data-testid="hero-cta-contact"
							>
								{ctaContactLabel}
							</a>
						</div>
					</div>

					<!-- VERTICAL DIVIDER (desktop only) -->
					<div
						class="hidden self-stretch md:block"
						data-hero-stagger="5"
					>
						<div class="hero-divider"></div>
					</div>

					<!-- RIGHT COLUMN: SQL viewport on mobile (100dvh) -->
					<div class="hero-viewport-sql">
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
							<div class="mt-2 font-mono text-[10px] text-[var(--text-dim)]">
								{refreshHelper}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- "SCROLL DOWN" — visible at load, typewriter reveal, raised toward center -->
		<p
			bind:this={scrollPrompt}
			class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-lg tracking-[4px] text-[#E07800] md:text-2xl"
		>
			{scrollDownLabel}
		</p>
	</div>
</section>

<style>
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
		color: #141414;
		border: none;
		padding: 16px 48px;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 800;
		font-family: var(--font-mono);
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow:
			0 0 24px rgba(224, 120, 0, 0.3),
			0 4px 12px rgba(0, 0, 0, 0.4);
		transition: box-shadow 0.2s, transform 0.2s;
	}
	.refresh-btn:hover {
		box-shadow:
			0 0 40px rgba(224, 120, 0, 0.5),
			0 6px 20px rgba(0, 0, 0, 0.5);
		transform: translateY(-1px);
	}

	/* Mobile: two full-viewport stacked sections */
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
		.hero-viewport-sql {
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
