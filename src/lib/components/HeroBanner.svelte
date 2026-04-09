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
	import { heroAnimContent, heroContent } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import MetroNetwork from '$lib/motion/svg/MetroNetwork.svelte';

	let pinContainer: HTMLDivElement;
	let svgWrapper: HTMLDivElement;
	let scrollPrompt: HTMLParagraphElement;
	let networkComponent: ReturnType<typeof MetroNetwork>;
	let reducedMotion = false;

	const scrollDownLabel = resolveLocale(heroAnimContent.scrollDown, 'en');
	const badgeLabel = resolveLocale(heroContent.badge, 'en');
	const headlineLine1 = resolveLocale(heroContent.headline.line1, 'en');
	const headlineLine2 = resolveLocale(heroContent.headline.line2, 'en');
	const headlineLine3 = resolveLocale(heroContent.headline.line3, 'en');
	const subtitleText = resolveLocale(heroContent.subtitle, 'en');
	const ctaWorkLabel = resolveLocale(heroContent.ctaWork, 'en');
	const ctaContactLabel = resolveLocale(heroContent.ctaContact, 'en');
	const sqlLine1 = resolveLocale(heroContent.sqlDecoration.line1, 'en');
	const sqlLine2 = resolveLocale(heroContent.sqlDecoration.line2, 'en');
	const sqlLine3 = resolveLocale(heroContent.sqlDecoration.line3, 'en');

	let heroTextContainer: HTMLDivElement;
	let heroDot: HTMLSpanElement;

	let cleanup: (() => void) | undefined;
	onDestroy(() => cleanup?.());

	onMount(async () => {
		reducedMotion = isPrefersReducedMotion();

		await tick();
		await new Promise((r) => setTimeout(r, 300));

		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) return;

		if (reducedMotion) {
			svg.querySelectorAll('.metro-line, .metro-station, .metro-bg, .metro-label, .metro-berri').forEach((el) => {
				(el as HTMLElement).style.opacity = '0.2';
			});
			// Show hero text statically — no animation
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
			// Restore visibility — GSAP timeline fades scrollPrompt during Phase 2,
			// so we need to force it back when restarting at top.
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
		// underscore cursor. The _ follows the typing position exactly.
		if (scrollPrompt) {
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
				}
			}, 80);
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
			if (glyph.size === 0) return 200;
			return Math.ceil((screen / glyph.size) * 2);
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

		// All text elements start invisible — dot stays visible as the orange.
		const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
		gsap.set(staggerEls, { opacity: 0 });

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
			// 2x headroom ensures full orange coverage even on wide desktops
			return Math.ceil((screen / node) * 2);
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

		// === Phase 8 (Slice C): Text elements stagger in during zoom-out ===
		const stagger1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
		const stagger2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
		const stagger3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
		const stagger4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');

		tl.to(stagger1, {
			opacity: 1,
			duration: 0.15,
			stagger: 0.02,
			ease: 'power1.out',
		}, 1.10);

		tl.to(stagger2, {
			opacity: 1,
			duration: 0.12,
			ease: 'power1.out',
		}, 1.18);

		tl.to(stagger3, {
			opacity: 1,
			duration: 0.10,
			stagger: 0.02,
			ease: 'power1.out',
		}, 1.25);

		tl.to(stagger4, {
			opacity: 1,
			duration: 0.10,
			ease: 'power1.out',
		}, 1.32);

		// === Phase 9: Hold — hero fully visible, user reads ===
		tl.set({}, {}, 1.5);

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

		ScrollTrigger.create({
			trigger: pinContainer,
			start: 'top top',
			end: '+=1200%',
			pin: true,
			scrub: 1,
			animation: tl,
			onUpdate: (self: { progress: number; direction: number }) => {
				if (self.progress > 0.005) {
					// Stop idle blink once user scrolls past the threshold — scroll animation takes over
					stopBlink();
				} else if (self.progress <= 0.005 && self.direction === -1 && typingComplete) {
					// Scrolled back to top — restart synced blink
					startBlink();
				}
			},
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
	style="min-height: {reducedMotion ? '100vh' : '1300vh'};"
>
	<div
		bind:this={pinContainer}
		class="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#141414]"
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
			class="absolute inset-0 flex items-center justify-center px-6 pr-12 opacity-0 md:pr-20"
			data-testid="hero-text-container"
		>
			<div class="flex w-full max-w-5xl items-center gap-8">
				<!-- Left: headline + CTAs -->
				<div class="flex-1">
					<span
						class="mb-4 inline-block rounded border border-[#E07800] px-3 py-1 font-mono text-[10px] tracking-[3px] text-[#E07800] md:text-xs"
						data-testid="hero-badge"
						data-hero-stagger="3"
					>
						{badgeLabel}
					</span>

					<h1 class="font-heading font-extrabold leading-[0.95]">
						<span
							class="block text-5xl text-[var(--text-primary)] md:text-7xl"
							data-testid="hero-line1"
						>
							<span data-hero-stagger="1">{headlineLine1}</span>
						</span>
						<span
							class="block text-5xl text-[var(--text-primary)] md:text-7xl"
							data-testid="hero-line2"
						>
							<span data-hero-stagger="1">{headlineLine2}</span><span
								bind:this={heroDot}
								class="text-[#E07800]"
								data-testid="hero-dot"
							>.</span>
						</span>
						<span
							class="mt-2 block text-2xl text-[#999] md:text-4xl"
							data-testid="hero-line3"
						>
							<span data-hero-stagger="2">{headlineLine3}</span>
						</span>
					</h1>

					<p
						class="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] md:text-base"
						data-testid="hero-subtitle"
						data-hero-stagger="3"
					>
						{subtitleText}
					</p>

					<div class="mt-6 flex flex-wrap gap-3" data-hero-stagger="3">
						<a
							href="/work"
							class="inline-flex items-center rounded-lg bg-[#E07800] px-6 py-3 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#C96A00]"
							data-testid="hero-cta-work"
						>
							{ctaWorkLabel}
						</a>
						<a
							href="/contact"
							class="inline-flex items-center rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
							data-testid="hero-cta-contact"
						>
							{ctaContactLabel}
						</a>
					</div>
				</div>

				<!-- Right: SQL decoration (desktop only) -->
				<div
					class="hidden border-l border-[#333] pl-8 md:block"
					style="flex: 0.7;"
					data-testid="hero-sql"
					data-hero-stagger="4"
				>
					<code class="block font-mono text-sm leading-loose text-[#E07800] opacity-70">
						{sqlLine1}<br />
						{sqlLine2}<br />
						{sqlLine3}
					</code>
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
	/* Typewriter reveal for the scroll prompt.
	   overflow:hidden clips characters that haven't appeared yet.
	   white-space:nowrap prevents line breaks mid-animation.
	   The cursor blink is a separate animation on border-right. */
</style>
