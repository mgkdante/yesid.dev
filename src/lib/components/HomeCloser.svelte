<!--
  HomeCloser — Section 5: Transit terminus departure board + graffiti "THE END".
  Merges Blog Teaser + About Strip + Dual CTA into one conversion-focused closer.
  Desktop: board left, graffiti right. Mobile: graffiti behind, board full-width.
  DrawSVGPlugin animates graffiti on viewport entry; hover/tap replays.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { closerContent, resolveLocale, getLatestPosts } from '$lib/data/index.js';
	import { siteMeta } from '$lib/data/meta.js';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	// Static content
	const heading = resolveLocale(closerContent.heading, 'en');
	const headingDot = resolveLocale(closerContent.headingDot, 'en');
	const subheading = resolveLocale(closerContent.subheading, 'en');
	const contactLabel = resolveLocale(closerContent.rows.contact.label, 'en');
	const contactDesc = resolveLocale(closerContent.rows.contact.description, 'en');
	const contactAction = resolveLocale(closerContent.rows.contact.action, 'en');
	const connectLabel = resolveLocale(closerContent.rows.connect.label, 'en');
	const connectDesc = resolveLocale(closerContent.rows.connect.description, 'en');
	const connectAction = resolveLocale(closerContent.rows.connect.action, 'en');
	const readLabel = resolveLocale(closerContent.rows.read.label, 'en');
	const readAction = resolveLocale(closerContent.rows.read.action, 'en');
	const aboutLabel = resolveLocale(closerContent.rows.about.label, 'en');
	const aboutDesc = resolveLocale(closerContent.rows.about.description, 'en');
	const aboutAction = resolveLocale(closerContent.rows.about.action, 'en');

	// Dynamic blog posts
	const latestPosts = getLatestPosts(2, 'professional');

	// Build row data
	type BoardRow = {
		label: string;
		description: string;
		action: string;
		href: string;
		primary: boolean;
	};
	const rows: BoardRow[] = [
		{
			label: contactLabel,
			description: contactDesc,
			action: contactAction,
			href: '/contact',
			primary: true,
		},
		{
			label: connectLabel,
			description: connectDesc,
			action: connectAction,
			href: siteMeta.links.linkedin ?? '#',
			primary: true,
		},
		...latestPosts.map((post) => ({
			label: readLabel,
			description: resolveLocale(post.title, 'en'),
			action: readAction,
			href: `/blog/${post.category}/${post.slug}`,
			primary: false,
		})),
		{
			label: aboutLabel,
			description: aboutDesc,
			action: aboutAction,
			href: '/about',
			primary: false,
		},
	];

	// Social links
	const socials = [
		{ label: 'LinkedIn', href: siteMeta.links.linkedin ?? '#' },
		{ label: 'GitHub', href: siteMeta.links.github },
		{ label: 'Upwork', href: siteMeta.links.upwork ?? '#' },
		{ label: 'Email', href: `mailto:${siteMeta.links.email}` },
	];

	// Darker base — the floodlight filter brightens the lit areas
	const GRAFFITI_COLOR = '#8B4500';

	let sectionEl: HTMLElement | undefined = $state(undefined);

	// Per-letter data: main path (the letter shape) + drip paths
	type LetterData = { main: SVGPathElement; drips: SVGPathElement[] };

	// Track active graffiti timeline so replays kill previous cleanly
	let graffitiTl: gsap.core.Timeline | undefined;

	async function loadGraffiti(wrapper: Element): Promise<LetterData[]> {
		const res = await fetch('/svg/graffiti/the-end.svg');
		const text = await res.text();
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'image/svg+xml');
		const svg = doc.querySelector('svg');
		if (!svg) return [];

		// White stroke for DrawSVG hand-drawn trace, fill controlled by GSAP
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', '#ffffff');
		svg.setAttribute('stroke-width', '4');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		svg.classList.add('closer-graffiti-svg');

		// Construction floodlight filter — light from bottom up
		const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		if (!svg.querySelector('defs')) svg.prepend(defs);

		const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 260, 280];
		const cx = vb[2] / 2;  // center x of viewBox
		const h = vb[3];       // height of viewBox

		defs.innerHTML += `
			<filter id="floodlight" x="-50%" y="-50%" width="200%" height="200%">
				<feDiffuseLighting in="SourceGraphic" result="light" surfaceScale="5" diffuseConstant="1.4" lighting-color="#FFB627">
					<feSpotLight x="${cx}" y="${h + 200}" z="40" pointsAtX="${cx}" pointsAtY="0" pointsAtZ="0" specularExponent="8" limitingConeAngle="45"/>
				</feDiffuseLighting>
				<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.4" k2="0.2" k3="0" k4="0"/>
			</filter>
		`;

		// Apply spotlight to the entire graffiti content
		// Wrap all groups in a filtered container
		const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		contentGroup.setAttribute('filter', 'url(#floodlight)');
		// Move all children (except defs) into the filtered group
		const children = Array.from(svg.children).filter(c => c.tagName !== 'defs');
		children.forEach(c => contentGroup.appendChild(c));
		svg.appendChild(contentGroup);

		wrapper.appendChild(svg);

		// Groups are now inside the filtered container — query from svg root
		const groups = svg.querySelectorAll('g[data-letter]');
		const result: LetterData[] = [];
		groups.forEach((g) => {
			const paths = Array.from(g.querySelectorAll('path'));
			if (paths.length > 0) {
				result.push({ main: paths[0], drips: paths.slice(1) });
			}
		});

		// SVG renders in DOM order. Drips must paint on top of ALL letter
		// shapes (including neighbouring letters). Move each drip into a
		// layer at the end of the filtered content group, preserving the
		// parent group's transform so they stay in the correct position.
		// Inside contentGroup so the floodlight filter applies to drips too.
		const dripsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		dripsLayer.setAttribute('data-layer', 'drips');
		contentGroup.appendChild(dripsLayer);

		result.forEach((letter) => {
			const parentTransform = letter.main.closest('g[data-letter]')?.getAttribute('transform') ?? '';
			letter.drips.forEach((drip) => {
				const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
				wrapper.setAttribute('transform', parentTransform);
				wrapper.appendChild(drip);
				dripsLayer.appendChild(wrapper);
			});
		});

		return result;
	}

	function resetGraffiti(letterData: LetterData[]): void {
		const allMains = letterData.map((l) => l.main);
		const allDrips = letterData.flatMap((l) => l.drips);
		// Stroke hidden (DrawSVG 0%), no fill, drips collapsed
		gsap.set(allMains, { drawSVG: '0%', fill: 'none' });
		gsap.set(allDrips, { scaleY: 0, transformOrigin: 'top center', stroke: 'none', fill: GRAFFITI_COLOR });
	}

	function animateGraffiti(letterData: LetterData[]): gsap.core.Timeline {
		// Kill previous cleanly — no crossover
		if (graffitiTl) {
			graffitiTl.kill();
			graffitiTl = undefined;
		}

		resetGraffiti(letterData);

		const tl = gsap.timeline();
		graffitiTl = tl;

		// Per-letter sequence: draw outline → snap fill → next letter
		letterData.forEach((letter, i) => {
			const offset = i * 0.6; // stagger start per letter

			// Draw the letter outline with DrawSVG (hand-drawn feel)
			tl.to(letter.main, {
				drawSVG: '100%',
				duration: 0.7,
				ease: 'power1.inOut',
			}, offset);

			// Snap solid fill in right as stroke finishes
			tl.set(letter.main, {
				fill: GRAFFITI_COLOR,
			}, offset + 0.65);

			// Drips grow down from the filled letter
			if (letter.drips.length > 0) {
				tl.to(letter.drips, {
					scaleY: 1,
					stagger: 0.08,
					duration: 0.5,
					ease: 'power2.in',
				}, offset + 0.7);
			}
		});

		return tl;
	}

	onMount(() => {
		if (!browser || !sectionEl) return;

		const reduced = isPrefersReducedMotion();

		registerGsapPlugins();

		// Load construction props SVG with floodlight for 3D feel
		const propsWrap = sectionEl.querySelector('[data-closer-props]');
		if (propsWrap) {
			fetch('/svg/graffiti/construction-props.svg')
				.then((r) => r.text())
				.then((text) => {
					const parser = new DOMParser();
					const doc = parser.parseFromString(text, 'image/svg+xml');
					const svg = doc.querySelector('svg');
					if (!svg) return;
					svg.classList.add('closer-props-svg');

					// Same floodlight filter for 3D depth
					const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 420, 75];
					const cx = vb[2] / 2;
					const h = vb[3];
					const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
					if (!svg.querySelector('defs')) svg.prepend(defs);

					const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
					filter.setAttribute('id', 'props-light');
					filter.setAttribute('x', '-50%');
					filter.setAttribute('y', '-50%');
					filter.setAttribute('width', '200%');
					filter.setAttribute('height', '200%');
					filter.innerHTML = `
						<feDiffuseLighting in="SourceGraphic" result="light" surfaceScale="5" diffuseConstant="1.4" lighting-color="#FFB627">
							<feSpotLight x="${cx}" y="${h + 200}" z="40" pointsAtX="${cx}" pointsAtY="0" pointsAtZ="0" specularExponent="8" limitingConeAngle="45"/>
						</feDiffuseLighting>
						<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.4" k2="0.2" k3="0" k4="0"/>
					`;
					defs.appendChild(filter);

					const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
					contentGroup.setAttribute('filter', 'url(#props-light)');
					const children = Array.from(svg.children).filter(c => c.tagName !== 'defs');
					children.forEach(c => contentGroup.appendChild(c));
					svg.appendChild(contentGroup);

					propsWrap.appendChild(svg);
				});
		}

		const headingEl = sectionEl.querySelector('[data-closer-heading]');
		const subEl = sectionEl.querySelector('[data-closer-sub]');
		const boardEl = sectionEl.querySelector('[data-closer-board]');
		const rowEls = sectionEl.querySelectorAll('[data-closer-row]');
		const graffitiWrap = sectionEl.querySelector('[data-closer-graffiti]');
		const socialsEl = sectionEl.querySelector('[data-closer-socials]');

		if (!reduced) {
			gsap.set(headingEl, { opacity: 0, y: 20 });
			gsap.set(subEl, { opacity: 0 });
			gsap.set(boardEl, { opacity: 0, scale: 0.98 });
			gsap.set(rowEls, { opacity: 0, x: -10 });
			gsap.set(socialsEl, { opacity: 0 });
		}

		let masterTl: gsap.core.Timeline | undefined;

		if (graffitiWrap) {
			loadGraffiti(graffitiWrap).then((letterData) => {
				if (letterData.length === 0) return;

				const allMains = letterData.map((l) => l.main);
				const allDrips = letterData.flatMap((l) => l.drips);

				if (reduced) {
					gsap.set(allMains, { drawSVG: '100%', fill: GRAFFITI_COLOR });
					gsap.set(allDrips, { fill: GRAFFITI_COLOR, scaleY: 1, stroke: 'none' });
					return;
				}

				// Initial state: letters invisible, drips scaled to 0
				resetGraffiti(letterData);

				// Master timeline
				masterTl = gsap.timeline({
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 80%',
						once: true,
					},
				});

				masterTl
					.to(headingEl, { opacity: 1, y: 0, duration: 0.4 })
					.to(subEl, { opacity: 1, duration: 0.3 }, '-=0.3')
					.to(boardEl, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.2')
					.to(rowEls, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 }, '-=0.3')
					.to(socialsEl, { opacity: 1, duration: 0.3 }, '-=0.2')
					.add(animateGraffiti(letterData), '-=0.4');

				// Hover/tap replay
				const replayDraw = () => {
					animateGraffiti(letterData);
				};
				graffitiWrap.addEventListener('mouseenter', replayDraw);
				graffitiWrap.addEventListener('touchstart', replayDraw, { passive: true });
			});
		} else if (!reduced) {
			masterTl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionEl,
					start: 'top 80%',
					once: true,
				},
			});
			masterTl
				.to(headingEl, { opacity: 1, y: 0, duration: 0.4 })
				.to(subEl, { opacity: 1, duration: 0.3 }, '-=0.3')
				.to(boardEl, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.2')
				.to(rowEls, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 }, '-=0.3')
				.to(socialsEl, { opacity: 1, duration: 0.3 }, '-=0.2');
		}

		return () => {
			masterTl?.kill();
		};
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="closer-section"
	class="closer-section relative"
>
	<!-- Graffiti "THE END" — SVG loaded dynamically for DrawSVG animation -->
	<div
		class="closer-graffiti-wrap"
		data-testid="closer-graffiti"
		data-closer-graffiti
		role="img"
		aria-label="THE END graffiti"
	></div>

	<!-- Floodlight fixture — ground level, centered on graffiti -->
	<div class="closer-floodlight-wrap" aria-hidden="true">
		<!-- Beam emerges from the lens at top of floodlight, spreads upward -->
		<div class="closer-beam"></div>
		<svg class="closer-floodlight" viewBox="0 0 64 52" fill="none">
			<!-- Tripod legs -->
			<line x1="32" y1="30" x2="10" y2="50" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
			<line x1="32" y1="30" x2="54" y2="50" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
			<!-- Rear leg (shorter, angled back) -->
			<line x1="32" y1="30" x2="32" y2="50" stroke="#4a4a4a" stroke-width="2" stroke-linecap="round"/>
			<!-- Feet -->
			<rect x="6" y="48" width="8" height="3" rx="1" fill="#444"/>
			<rect x="50" y="48" width="8" height="3" rx="1" fill="#444"/>
			<rect x="29" y="48" width="6" height="3" rx="1" fill="#3a3a3a"/>
			<!-- Vertical mast -->
			<line x1="32" y1="30" x2="32" y2="14" stroke="#555" stroke-width="3.5" stroke-linecap="round"/>
			<!-- Pivot joint -->
			<circle cx="32" cy="14" r="3" fill="#444" stroke="#555" stroke-width="1"/>
			<!-- Light head housing (trapezoid pointing up) -->
			<path d="M21,14 L43,14 L38,2 L26,2 Z" fill="#333" stroke="#444" stroke-width="0.5"/>
			<!-- Reflector interior -->
			<path d="M24,12 L40,12 L37,4 L27,4 Z" fill="#2a2a2a"/>
			<!-- Light lens (top face, glowing) -->
			<rect x="26" y="1" width="12" height="3" rx="1" fill="var(--brand-accent, #FFB627)"/>
			<rect x="27.5" y="1.5" width="9" height="1.5" rx="0.5" fill="#FFD060" opacity="0.8"/>
			<!-- Glow halo around lens -->
			<rect x="24" y="0" width="16" height="5" rx="2" fill="var(--brand-accent, #FFB627)" opacity="0.15"/>
		</svg>
	</div>

	<!-- Construction props — ground level scene with same lighting -->
	<div class="closer-props" data-closer-props aria-hidden="true"></div>

	<!-- Content -->
	<div class="closer-content relative z-10">
		<!-- Heading -->
		<h2 data-testid="closer-heading" data-closer-heading class="closer-heading">
			{heading}<span class="closer-dot">{headingDot}</span>
		</h2>
		<p data-testid="closer-subheading" data-closer-sub class="closer-subheading">
			{subheading}
		</p>

		<!-- Departure board -->
		<div data-testid="closer-board" data-closer-board class="closer-board">
			{#each rows as row}
				<a
					href={row.href}
					data-testid="closer-row"
					data-closer-row
					class="closer-row"
					class:closer-row-primary={row.primary}
					aria-label="{row.label} — {row.description}"
					target={row.href.startsWith('http') ? '_blank' : undefined}
					rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				>
					<span class="closer-row-label">{row.label}</span>
					<span class="closer-row-desc" class:closer-row-desc-primary={row.primary}>
						{row.description}
					</span>
					<span class="closer-row-action" class:closer-row-action-primary={row.primary}>
						{row.action}
					</span>
				</a>
			{/each}
		</div>

		<!-- Social links -->
		<div data-testid="closer-socials" data-closer-socials class="closer-socials">
			{#each socials as social}
				<a
					href={social.href}
					class="closer-social-link"
					target={social.href.startsWith('http') ? '_blank' : undefined}
					rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				>
					{social.label}
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	.closer-section {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		padding: 64px 16px 0;
		position: relative;
	}

	/* Light beam — originates from floodlight lens, widens upward to graffiti */
	.closer-beam {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		/* Bottom edge sits at top of floodlight wrapper = lens position */
		bottom: 100%;
		width: clamp(400px, 45vw, 650px);
		height: 42vh;
		/* Narrow at bottom (matches lens width), wide at top (graffiti area) */
		clip-path: polygon(48% 100%, 52% 100%, 100% 0%, 0% 0%);
		background: linear-gradient(
			to top,
			rgba(255, 182, 39, 0.08) 0%,
			rgba(255, 182, 39, 0.04) 35%,
			rgba(255, 182, 39, 0.015) 65%,
			transparent 100%
		);
		filter: blur(8px);
		pointer-events: none;
	}

	/* Construction props — flush to bottom edge, scales with viewport */
	.closer-props {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 80%;
		pointer-events: none;
		z-index: 3;
		overflow: visible;
		line-height: 0;
	}
	:global(.closer-props-svg) {
		width: 100% !important;
		height: auto !important;
		display: block;
		overflow: visible;
	}

	/* Graffiti wrapper — bottom-right on desktop, behind on mobile */
	.closer-graffiti-wrap {
		position: absolute;
		right: 4%;
		bottom: 20%;
		width: clamp(160px, 18vw, 260px);
		max-width: 260px;
		pointer-events: auto;
		cursor: pointer;
		z-index: 2;
		overflow: visible;
	}

	/* Injected SVG inherits this via class added in JS */
	:global(.closer-graffiti-svg) {
		width: 100% !important;
		height: auto !important;
		max-width: 100% !important;
		display: block;
		overflow: visible;
	}

	/* Floodlight wrapper — same right+width as graffiti so it stays centered */
	.closer-floodlight-wrap {
		position: absolute;
		bottom: 0;
		right: 4%;
		width: clamp(160px, 18vw, 260px);
		display: flex;
		justify-content: center;
		pointer-events: none;
		z-index: 4;
		line-height: 0;
		overflow: visible;
	}
	.closer-floodlight {
		width: clamp(60px, 8vw, 100px);
		height: auto;
		display: block;
	}

	/* Content area — wide, leaves room for graffiti on the right */
	.closer-content {
		max-width: 72%;
		width: 100%;
		padding-inline-start: clamp(1rem, 4vw, 3rem);
	}

	.closer-heading {
		font-family: Inter, sans-serif;
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: 900;
		color: var(--text-primary, #f0f0f0);
		letter-spacing: -1px;
		margin-block-end: 4px;
	}
	.closer-dot {
		color: var(--brand-primary, #e07800);
	}

	.closer-subheading {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		color: var(--text-muted, #555);
		letter-spacing: 1px;
		margin-block-end: 24px;
	}

	/* Departure board */
	.closer-board {
		background: rgba(10, 10, 10, 0.92);
		border: 1px solid #252525;
		border-radius: 3px;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);
		margin-block-end: 20px;
		overflow: hidden;
	}

	.closer-row {
		display: grid;
		grid-template-columns: 70px 1fr 50px;
		padding: 10px 14px;
		border-bottom: 1px solid #1a1a1a;
		align-items: center;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	.closer-row:last-child {
		border-bottom: none;
	}
	.closer-row:hover {
		background-color: rgba(224, 120, 0, 0.04);
	}

	.closer-row-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		color: var(--brand-primary, #e07800);
	}

	.closer-row-desc {
		font-size: 10px;
		color: #999;
	}
	.closer-row-desc-primary {
		font-size: 11px;
		color: #ddd;
	}

	.closer-row-action {
		text-align: right;
		font-size: 10px;
		color: #555;
	}
	.closer-row-action-primary {
		color: var(--brand-accent, #ffb627);
		font-weight: 600;
	}

	/* Social links */
	.closer-socials {
		display: flex;
		gap: 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		margin-block-end: 10px;
	}
	.closer-social-link {
		color: #444;
		text-decoration: none;
		transition: color 0.15s;
	}
	.closer-social-link:hover {
		color: var(--brand-primary, #e07800);
	}

	/* ===== Mobile (<768px) ===== */
	@media (max-width: 767px) {
		.closer-section {
			padding: 48px 16px 0;
		}

		.closer-content {
			max-width: 100%;
			padding-inline-start: 0;
		}

		.closer-beam,
		.closer-floodlight-wrap {
			display: none;
		}

		/* Graffiti moves behind content on mobile */
		.closer-graffiti-wrap {
			right: auto;
			bottom: auto;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 70%;
			max-width: none;
			opacity: 0.08;
			pointer-events: none;
		}

		.closer-socials {
			justify-content: flex-start;
		}
	}

	/* ===== Tablet+ (768px+) ===== */
	@media (min-width: 768px) {
		.closer-section {
			padding: 80px 24px 0;
		}
	}

	/* ===== Desktop (1024px+) ===== */
	@media (min-width: 1024px) {
		.closer-section {
			padding: 100px 32px 0;
		}
	}
</style>
