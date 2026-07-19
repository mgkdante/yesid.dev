<!--
  WeatherScene — layered Montréal weather vignette (GO Wave 4).

  One crafted scene per condition family (clear / clouds / rain / snow /
  storm / mist / offline), each composed of: a sky gradient, celestial +
  weather elements, and a Montréal skyline silhouette (Mount Royal cross,
  Place Ville Marie, 1000 De La Gauchetière, Habitat 67, the Olympic
  Stadium tower) whose windows light up at night.

  Theming — dark theme is the base (brand default); a
  [data-theme='light'] block re-tunes every palette knob, so the scene
  sits naturally on both card surfaces. Brand tokens (--accent, --primary)
  drive the sun, lightning and lit windows.

  Motion — every loop here is infinite ambient motion, which is
	MOTION-GATED per the two-tier policy (@yesid/motion/policy). The gate is
  the prefers-reduced-motion block at the bottom: animations stop and each
  element rests at its *designed* base position (precipitation is scattered
  mid-sky like a postcard still, the bolt stays lit, fog banks sit layered)
  — a composed static scene, never blank, never frozen mid-fall.

  Purely decorative: aria-hidden, pointer-events none, zero layout impact
  (absolute inset-0 behind the card's text).
-->
<script lang="ts">
	import type { WeatherSceneId } from './weather-scene';

	let { scene, night = false }: { scene: WeatherSceneId; night?: boolean } = $props();

	const showStars = $derived(night && (scene === 'clear' || scene === 'clouds' || scene === 'snow'));
	const showSun = $derived(!night && (scene === 'clear' || scene === 'clouds'));
	const showMoon = $derived(night && (scene === 'clear' || scene === 'clouds'));
	const cloudCount = $derived(
		scene === 'clouds' ? 3 : scene === 'rain' || scene === 'storm' || scene === 'snow' ? 2 : scene === 'offline' ? 1 : 0
	);
	const hasRain = $derived(scene === 'rain' || scene === 'storm');

	// Hand-placed star field (left%, top%, px size) — one bright "Venus".
	const STARS = [
		{ x: 10, y: 12, r: 2 },
		{ x: 22, y: 26, r: 2 },
		{ x: 34, y: 8, r: 3 },
		{ x: 48, y: 20, r: 2 },
		{ x: 60, y: 10, r: 2 },
		{ x: 71, y: 30, r: 2 },
		{ x: 84, y: 16, r: 4 },
		{ x: 93, y: 28, r: 2 },
	] as const;

	// Deterministic scatter (index-hashed): the BASE positions double as the
	// reduced-motion still — drops/flakes rest mid-sky, composed, not parked
	// off-canvas. The fall keyframes override `top` while motion is allowed.
	const drops = $derived(
		Array.from({ length: scene === 'storm' ? 14 : 12 }, (_, i) => ({
			x: (i * 8.05 + 3) % 96,
			y: 6 + ((i * 41) % 72),
			dur: (scene === 'storm' ? 0.72 : 1.05) + (i % 4) * 0.11,
			delay: i * 0.17,
		}))
	);
	const flakes = Array.from({ length: 14 }, (_, i) => ({
		x: (i * 7.3 + 2) % 96,
		y: 4 + ((i * 53) % 74),
		dur: 3.4 + (i % 5) * 0.55,
		delay: i * 0.35,
		size: 2 + (i % 3),
	}));
</script>

<div
	class="weather-scene"
	class:night
	data-scene={scene}
	data-weather-night={night}
	aria-hidden="true"
>
	<!-- Sky wash -->
	<div class="weather-sky"></div>

	<!-- Stars (clear / clouds / snow nights) -->
	{#if showStars}
		{#each STARS as star, i (i)}
			<div
				class="weather-star"
				style="left:{star.x}%; top:{star.y}%; width:{star.r}px; height:{star.r}px; animation-delay:{i * 0.45}s;"
			></div>
		{/each}
	{/if}

	<!-- Sun / moon -->
	{#if showSun}
		<div class="weather-sun"></div>
	{/if}
	{#if showMoon}
		<svg class="weather-moon" viewBox="0 0 32 32">
			<path
				fill-rule="evenodd"
				d="M16 3 A 13 13 0 1 0 16 29 A 13 13 0 1 0 16 3 Z M 20.5 5.5 A 11 11 0 1 1 20.5 26.5 A 13.5 13.5 0 1 0 20.5 5.5 Z"
			/>
			<circle class="weather-moon-crater" cx="11" cy="12" r="2.1" />
			<circle class="weather-moon-crater" cx="14.5" cy="20" r="1.5" />
			<circle class="weather-moon-crater" cx="8.5" cy="18" r="1.1" />
		</svg>
	{/if}

	<!-- Clouds -->
	{#each Array.from({ length: cloudCount }) as _, i (i)}
		<svg class="weather-cloud weather-cloud-{i + 1}" viewBox="0 0 64 34">
			<g>
				<rect x="4" y="19" width="56" height="12" rx="6" />
				<circle cx="17" cy="17" r="10" />
				<circle cx="32" cy="12" r="12" />
				<circle cx="46" cy="18" r="8.5" />
			</g>
		</svg>
	{/each}

	<!-- Lightning bolt (strikes behind the skyline) -->
	{#if scene === 'storm'}
		<svg class="weather-bolt" viewBox="0 0 24 36">
			<path d="M13 0 L2 20 H9 L6 36 L22 12 H13 L18 0 Z" />
		</svg>
	{/if}

	<!-- Montréal skyline — Mount Royal cross · Place Ville Marie ·
	     1000 De La Gauchetière · Habitat 67 · Olympic Stadium tower -->
	<svg class="weather-skyline" viewBox="0 0 600 64" preserveAspectRatio="xMidYMax slice">
		<path
			class="weather-skyline-ink"
			d="M0 64 V46 H10 V41 H22 V49 H34 V44 H47 V51 H60 V47 H72 V54 H84
			   C 98 50 112 33 127 30 C 142 33 157 44 170 49
			   H178 V44 H191 V46 H205
			   V28 H235 V46 H242
			   V24 H246 V20 H276 V24 H280 V46
			   H288 V24 L307 12 L326 24 V46
			   H334 V30 H344 V21 H346 V30 H356 V48
			   H362 V52 H374 V46 H388 V53 H398
			   V50 H404 V42 H414 V46 H422 V38 H432 V44 H440 V50 H448
			   V56 H470 C 480 44 520 44 530 56 H540
			   V50 H548 V46 H560 V51 H574 V47 H588 V52 H600 V64 Z
			   M125.9 30 V20.4 H121 V18.1 H125.9 V14 H128.1 V18.1 H133 V20.4 H128.1 V30 Z
			   M531 56 C 528 44 519 34 505 28 L508 24 C 524 31 536 42 540 56 Z"
		/>
		<g class="weather-windows">
			<rect x="15" y="45" width="2.2" height="2.4" />
			<rect x="40" y="48" width="2.2" height="2.4" />
			<rect x="66" y="51" width="2.2" height="2.4" />
			<rect x="210" y="33" width="2.2" height="2.4" />
			<rect x="218" y="37" width="2.2" height="2.4" />
			<rect x="227" y="32" width="2.2" height="2.4" />
			<rect x="214" y="42" width="2.2" height="2.4" />
			<rect x="249" y="26" width="2.2" height="2.4" />
			<rect x="258" y="31" width="2.2" height="2.4" />
			<rect x="266" y="25" width="2.2" height="2.4" />
			<rect x="271" y="34" width="2.2" height="2.4" />
			<rect x="252" y="39" width="2.2" height="2.4" />
			<rect x="296" y="30" width="2.2" height="2.4" />
			<rect x="305" y="34" width="2.2" height="2.4" />
			<rect x="313" y="28" width="2.2" height="2.4" />
			<rect x="300" y="40" width="2.2" height="2.4" />
			<rect x="318" y="37" width="2.2" height="2.4" />
			<rect x="340" y="36" width="2.2" height="2.4" />
			<rect x="349" y="41" width="2.2" height="2.4" />
			<rect x="407" y="46" width="2.2" height="2.4" />
			<rect x="425" y="42" width="2.2" height="2.4" />
			<rect x="564" y="50" width="2.2" height="2.4" />
			<rect x="580" y="51" width="2.2" height="2.4" />
		</g>
	</svg>

	<!-- Precipitation (falls in front of the city) -->
	{#if hasRain}
		{#each drops as d, i (i)}
			<div
				class="weather-drop"
				style="left:{d.x}%; --top:{d.y}%; animation-duration:{d.dur}s; animation-delay:{d.delay}s;"
			></div>
		{/each}
	{/if}
	{#if scene === 'snow'}
		{#each flakes as f, i (i)}
			<div
				class="weather-flake"
				style="left:{f.x}%; --top:{f.y}%; width:{f.size}px; height:{f.size}px; animation-duration:{f.dur}s; animation-delay:{f.delay}s;"
			></div>
		{/each}
	{/if}

	<!-- Fog banks (veil the skyline) -->
	{#if scene === 'mist'}
		<div class="weather-mist weather-mist-1"></div>
		<div class="weather-mist weather-mist-2"></div>
		<div class="weather-mist weather-mist-3"></div>
	{/if}

	<!-- Lightning flash veil -->
	{#if scene === 'storm'}
		<div class="weather-lightning"></div>
	{/if}
</div>

<style>
	/* ═══════════════ SCENE ROOT + PALETTE (dark theme = base) ═══════════════ */
	.weather-scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;

		/* Calm defaults (offline) — every scene block re-tunes these. */
		--wx-sky-a: #1f2836;
		--wx-sky-b: #171e2a;
		--wx-ink: rgb(7 11 20 / 0.55);
		--wx-cloud: #c4cee2;
		--wx-cloud-o: 0.14;
		--wx-drop: rgb(138 172 230 / 0.55);
		--wx-flake: rgb(232 240 252 / 0.85);
		--wx-fog: #c4cee2;
		--wx-fog-o: 0.13;
		--wx-star: #e8eefc;
		--wx-moon: #efe9d2;
		--wx-moon-glow: rgb(220 228 255 / 0.3);
		--wx-sun-core: var(--accent);
		--wx-sun-halo: color-mix(in srgb, var(--accent) 32%, transparent);
		--wx-flash: rgb(255 240 205 / 0.16);
	}

	.weather-scene[data-scene='clear'] { --wx-sky-a: #233852; --wx-sky-b: #182740; }
	.weather-scene[data-scene='clear'].night { --wx-sky-a: #0d1730; --wx-sky-b: #111b30; }

	.weather-scene[data-scene='clouds'] { --wx-sky-a: #2a3445; --wx-sky-b: #1b2433; }
	.weather-scene[data-scene='clouds'].night { --wx-sky-a: #111a2c; --wx-sky-b: #151d2c; }

	.weather-scene[data-scene='rain'] {
		--wx-sky-a: #232f41;
		--wx-sky-b: #18202e;
		--wx-cloud: #8aa0c0;
		--wx-cloud-o: 0.22;
	}
	.weather-scene[data-scene='rain'].night { --wx-sky-a: #0e1626; --wx-sky-b: #121a28; }

	.weather-scene[data-scene='snow'] {
		--wx-sky-a: #2b3850;
		--wx-sky-b: #1d2638;
		--wx-cloud-o: 0.18;
	}
	.weather-scene[data-scene='snow'].night { --wx-sky-a: #131d33; --wx-sky-b: #161f30; }

	.weather-scene[data-scene='storm'] {
		--wx-sky-a: #1b2334;
		--wx-sky-b: #121826;
		--wx-cloud: #5d6e8c;
		--wx-cloud-o: 0.4;
		--wx-drop: rgb(150 180 232 / 0.5);
	}
	.weather-scene[data-scene='storm'].night { --wx-sky-a: #0b1220; --wx-sky-b: #0f1522; }

	.weather-scene[data-scene='mist'] { --wx-sky-a: #262e3c; --wx-sky-b: #1b222e; }
	.weather-scene[data-scene='mist'].night { --wx-sky-a: #121a28; --wx-sky-b: #161d29; }

	.weather-scene[data-scene='offline'].night { --wx-sky-a: #101724; --wx-sky-b: #141a26; }

	.weather-scene.night { --wx-ink: rgb(4 7 14 / 0.72); }

	/* ═══════════════ LIGHT THEME — soft daylight palettes ═══════════════ */
	:global([data-theme='light']) .weather-scene {
		--wx-sky-a: #cbd4dd;
		--wx-sky-b: #ebeef2;
		--wx-ink: rgb(73 88 110 / 0.5);
		--wx-cloud: #ffffff;
		--wx-cloud-o: 0.92;
		--wx-drop: rgb(86 124 166 / 0.65);
		--wx-flake: #ffffff;
		--wx-fog: #ffffff;
		--wx-fog-o: 0.8;
		--wx-star: #fdf6e3;
		--wx-moon: #f7f1dc;
		--wx-moon-glow: rgb(255 244 200 / 0.6);
		--wx-sun-core: color-mix(in srgb, var(--accent) 82%, #fff);
		--wx-sun-halo: color-mix(in srgb, var(--accent) 50%, transparent);
		--wx-flash: rgb(255 248 226 / 0.55);
	}
	:global([data-theme='light']) .weather-scene.night { --wx-ink: rgb(54 66 88 / 0.62); }

	:global([data-theme='light']) .weather-scene[data-scene='clear'] { --wx-sky-a: #bfdcf2; --wx-sky-b: #e9f3fa; }
	:global([data-theme='light']) .weather-scene[data-scene='clear'].night { --wx-sky-a: #c2cbe6; --wx-sky-b: #e7e7f1; }

	:global([data-theme='light']) .weather-scene[data-scene='clouds'] { --wx-sky-a: #c5d2de; --wx-sky-b: #e6ebf0; }
	:global([data-theme='light']) .weather-scene[data-scene='clouds'].night { --wx-sky-a: #bdc4d8; --wx-sky-b: #e1e2ea; }

	:global([data-theme='light']) .weather-scene[data-scene='rain'] {
		--wx-sky-a: #aebfce;
		--wx-sky-b: #d6dfe7;
		--wx-cloud: #e9eef4;
		--wx-cloud-o: 0.95;
	}
	:global([data-theme='light']) .weather-scene[data-scene='rain'].night { --wx-sky-a: #a3b0c8; --wx-sky-b: #cfd5e3; }

	:global([data-theme='light']) .weather-scene[data-scene='snow'] { --wx-sky-a: #c9d6e4; --wx-sky-b: #eef2f7; }
	:global([data-theme='light']) .weather-scene[data-scene='snow'].night { --wx-sky-a: #bfc8df; --wx-sky-b: #e7e9f1; }

	:global([data-theme='light']) .weather-scene[data-scene='storm'] {
		--wx-sky-a: #93a3b8;
		--wx-sky-b: #c6cfda;
		--wx-cloud: #6e8099;
		--wx-cloud-o: 0.55;
	}
	:global([data-theme='light']) .weather-scene[data-scene='storm'].night { --wx-sky-a: #8b98b2; --wx-sky-b: #bcc4d7; }

	:global([data-theme='light']) .weather-scene[data-scene='mist'] { --wx-sky-a: #ccd5dd; --wx-sky-b: #e9edf1; }
	:global([data-theme='light']) .weather-scene[data-scene='mist'].night { --wx-sky-a: #c0c8d7; --wx-sky-b: #e0e3eb; }

	:global([data-theme='light']) .weather-scene[data-scene='offline'].night { --wx-sky-a: #bac3d4; --wx-sky-b: #dfe2e9; }

	/* ═══════════════ SKY ═══════════════ */
	.weather-sky {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, var(--wx-sky-a) 0%, var(--wx-sky-b) 100%);
	}
	/* Offline: a calm warm horizon — the brand orange resting on the city. */
	.weather-scene[data-scene='offline'] .weather-sky::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			110% 55% at 50% 102%,
			color-mix(in srgb, var(--primary) 16%, transparent),
			transparent 70%
		);
	}
	/* Snow: ground glow rising from the rooftops. */
	.weather-scene[data-scene='snow'] .weather-sky::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(0deg, rgb(222 232 246 / 0.16), transparent 34%);
	}
	:global([data-theme='light']) .weather-scene[data-scene='snow'] .weather-sky::after {
		background: linear-gradient(0deg, rgb(255 255 255 / 0.72), transparent 34%);
	}

	/* ═══════════════ STARS ═══════════════ */
	.weather-star {
		position: absolute;
		border-radius: 50%;
		background: var(--wx-star);
		box-shadow: 0 0 4px 0.5px color-mix(in srgb, var(--wx-star) 60%, transparent);
		opacity: 0.7;
		animation: weather-twinkle 3.2s ease-in-out infinite alternate;
	}
	@keyframes weather-twinkle {
		0% { opacity: 0.3; }
		100% { opacity: 0.95; }
	}

	/* ═══════════════ SUN ═══════════════ */
	.weather-sun {
		position: absolute;
		top: -16%;
		right: -3%;
		height: 56%;
		aspect-ratio: 1;
		background:
			radial-gradient(circle, var(--wx-sun-core) 0 24%, transparent 26%),
			radial-gradient(circle, var(--wx-sun-halo) 0%, transparent 68%);
		animation: weather-glow 7s ease-in-out infinite alternate;
	}
	/* Partly cloudy: the sun tucks up and the clouds carry the scene. */
	.weather-scene[data-scene='clouds'] .weather-sun {
		top: -8%;
		right: 22%;
		height: 42%;
	}
	@keyframes weather-glow {
		0% { transform: scale(0.96); opacity: 0.85; }
		100% { transform: scale(1.06); opacity: 1; }
	}

	/* ═══════════════ MOON ═══════════════ */
	/* The moon rides low beside the city name — the top strip belongs to the
	   stop label + hook text, so the celestial keeps out of their way. */
	.weather-moon {
		position: absolute;
		top: 26%;
		right: 3%;
		height: 27%;
		aspect-ratio: 1;
		fill: var(--wx-moon);
		filter: drop-shadow(0 0 6px var(--wx-moon-glow));
		animation: weather-float 9s ease-in-out infinite alternate;
	}
	.weather-moon-crater {
		fill: rgb(0 0 0 / 0.08);
	}
	/* Broken-clouds night: the moon peeks from behind the cloud deck. */
	.weather-scene[data-scene='clouds'] .weather-moon {
		top: 30%;
		right: 2%;
		height: 22%;
	}
	@keyframes weather-float {
		0% { transform: translateY(0); }
		100% { transform: translateY(-3px); }
	}

	/* ═══════════════ CLOUDS ═══════════════ */
	.weather-cloud {
		position: absolute;
		fill: var(--wx-cloud);
		opacity: var(--wx-cloud-o);
		animation: weather-drift 18s ease-in-out infinite alternate;
	}
	.weather-cloud-1 {
		width: 46%;
		left: 6%;
		top: 8%;
	}
	.weather-cloud-2 {
		width: 36%;
		right: 8%;
		top: 26%;
		opacity: calc(var(--wx-cloud-o) * 0.75);
		animation-duration: 24s;
		animation-direction: alternate-reverse;
	}
	.weather-cloud-3 {
		width: 26%;
		left: 40%;
		top: 0%;
		opacity: calc(var(--wx-cloud-o) * 0.6);
		animation-duration: 21s;
	}
	/* Rain/storm/snow: the deck sits lower and heavier over the city. */
	.weather-scene[data-scene='rain'] .weather-cloud-1,
	.weather-scene[data-scene='storm'] .weather-cloud-1,
	.weather-scene[data-scene='snow'] .weather-cloud-1 {
		width: 52%;
		left: 10%;
		top: -6%;
	}
	.weather-scene[data-scene='rain'] .weather-cloud-2,
	.weather-scene[data-scene='storm'] .weather-cloud-2,
	.weather-scene[data-scene='snow'] .weather-cloud-2 {
		width: 44%;
		right: 2%;
		top: 2%;
	}
	/* Offline: one distant cloud, barely there. */
	.weather-scene[data-scene='offline'] .weather-cloud-1 {
		width: 30%;
		left: 14%;
		top: 14%;
		opacity: calc(var(--wx-cloud-o) * 0.7);
	}
	@keyframes weather-drift {
		0% { transform: translateX(-2.5%); }
		100% { transform: translateX(2.5%); }
	}

	/* ═══════════════ SKYLINE ═══════════════ */
	.weather-skyline {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 30%;
	}
	.weather-skyline-ink {
		fill: var(--wx-ink);
	}
	.weather-windows {
		fill: var(--accent);
		opacity: 0;
		transition: opacity var(--duration-slower) var(--ease-default);
	}
	.weather-scene.night .weather-windows {
		opacity: 0.9;
	}

	/* ═══════════════ RAIN ═══════════════ */
	.weather-drop {
		position: absolute;
		top: var(--top, 30%);
		width: 1.5px;
		height: 11px;
		border-radius: 1px;
		background: linear-gradient(180deg, transparent, var(--wx-drop));
		transform: rotate(13deg);
		opacity: 0.55;
		animation: weather-fall linear infinite;
	}
	.weather-scene[data-scene='storm'] .weather-drop {
		transform: rotate(19deg);
		height: 13px;
	}
	@keyframes weather-fall {
		0% { top: -12%; opacity: 0; }
		10% { opacity: 0.7; }
		88% { opacity: 0.5; }
		100% { top: 112%; opacity: 0; }
	}

	/* ═══════════════ SNOW ═══════════════ */
	.weather-flake {
		position: absolute;
		top: var(--top, 30%);
		border-radius: 50%;
		background: var(--wx-flake);
		opacity: 0.85;
		animation: weather-snow linear infinite;
	}
	:global([data-theme='light']) .weather-flake {
		box-shadow: 0 0 0 0.5px rgb(148 163 190 / 0.55);
	}
	@keyframes weather-snow {
		0% { top: -8%; transform: translateX(0) rotate(0deg); opacity: 0; }
		12% { opacity: 0.9; }
		50% { transform: translateX(7px) rotate(160deg); }
		88% { opacity: 0.7; }
		100% { top: 108%; transform: translateX(-5px) rotate(320deg); opacity: 0; }
	}

	/* ═══════════════ STORM ═══════════════ */
	.weather-bolt {
		position: absolute;
		top: 24%;
		right: 28%;
		width: 9%;
		min-width: 14px;
		fill: var(--accent);
		filter: drop-shadow(0 0 5px color-mix(in srgb, var(--accent) 70%, transparent));
		opacity: 0.9; /* static composition: the bolt stays lit under reduce */
		animation: weather-zap 7s linear infinite;
	}
	.weather-lightning {
		position: absolute;
		inset: 0;
		background: var(--wx-flash);
		opacity: 0; /* static composition: no veil under reduce */
		animation: weather-flash 7s linear infinite;
	}
	@keyframes weather-zap {
		0%, 54%, 65%, 78%, 88%, 100% { opacity: 0; }
		56% { opacity: 1; }
		60% { opacity: 0.9; }
		63% { opacity: 0.3; }
		81% { opacity: 1; }
		85% { opacity: 0.4; }
	}
	@keyframes weather-flash {
		0%, 55%, 64%, 79%, 87%, 100% { opacity: 0; }
		57% { opacity: 0.9; }
		59% { opacity: 0.2; }
		61% { opacity: 0.55; }
		82% { opacity: 0.75; }
		84% { opacity: 0.15; }
	}

	/* ═══════════════ MIST ═══════════════ */
	.weather-mist {
		position: absolute;
		left: -20%;
		width: 140%;
		height: 18%;
		border-radius: var(--radius-pill);
		background: var(--wx-fog);
		opacity: var(--wx-fog-o);
		filter: blur(5px);
		animation: weather-haze 13s ease-in-out infinite alternate;
	}
	.weather-mist-1 { top: 28%; }
	.weather-mist-2 {
		top: 46%;
		animation-duration: 17s;
		animation-direction: alternate-reverse;
		opacity: calc(var(--wx-fog-o) * 0.8);
	}
	.weather-mist-3 {
		top: 66%;
		height: 22%;
		animation-duration: 21s;
	}
	@keyframes weather-haze {
		0% { transform: translateX(-3.5%); }
		100% { transform: translateX(3.5%); }
	}

	/* ═══════════════ REDUCED MOTION — the gate (two-tier policy) ═══════════════
	   All loops above are infinite ambient motion → MOTION-GATED. Under
	   reduce every element rests at its designed base: sun fully lit, moon
	   parked, clouds at composed positions, precipitation scattered mid-sky
	   (a postcard still via the --top base), bolt visible, flash veil off,
	   fog banks layered. A complete static scene — never blank. */
	@media (prefers-reduced-motion: reduce) {
		.weather-sun,
		.weather-moon,
		.weather-star,
		.weather-cloud,
		.weather-drop,
		.weather-flake,
		.weather-bolt,
		.weather-lightning,
		.weather-mist {
			animation: none;
		}
	}
</style>
