<!--
  Inline SVG construction illustration for the 404 error page.
  Elements: platform, scaffolding, station sign, barriers, cones, blinking lights.
  Respects prefers-reduced-motion (lights static instead of blinking).
  Brand colors run through tokens (var(--primary)/--accent/--hazard-b via CSS
  classes — SVG presentation attributes can't read custom properties) so the
  illustration tracks the light/dark theme swap instead of pinning dark-mode hex.
-->
<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="construction-scene {className}" data-testid="construction-scene">
	<svg
		viewBox="0 0 400 220"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		class="w-full h-auto max-w-sm mx-auto"
	>
		<!-- Platform line -->
		<line class="scene-ground" x1="20" y1="200" x2="380" y2="200" stroke-width="2" />

		<!-- Left scaffolding (taller) -->
		<g class="scaffolding">
			<!-- Verticals -->
			<line class="scaffold-vert" x1="50" y1="60" x2="50" y2="200" stroke-width="2" />
			<line class="scaffold-vert" x1="80" y1="60" x2="80" y2="200" stroke-width="2" />
			<!-- Horizontals -->
			<line class="scaffold-rung" x1="46" y1="80" x2="84" y2="80" stroke-width="1.5" />
			<line class="scaffold-rung" x1="46" y1="120" x2="84" y2="120" stroke-width="1.5" />
			<line class="scaffold-rung" x1="46" y1="160" x2="84" y2="160" stroke-width="1.5" />
			<!-- Cross braces -->
			<line class="scaffold-brace" x1="50" y1="80" x2="80" y2="120" stroke-width="1" />
			<line class="scaffold-brace" x1="80" y1="80" x2="50" y2="120" stroke-width="1" />
		</g>

		<!-- Right scaffolding (shorter) -->
		<g class="scaffolding">
			<line class="scaffold-vert" x1="320" y1="110" x2="320" y2="200" stroke-width="2" />
			<line class="scaffold-vert" x1="350" y1="110" x2="350" y2="200" stroke-width="2" />
			<line class="scaffold-rung" x1="316" y1="130" x2="354" y2="130" stroke-width="1.5" />
			<line class="scaffold-rung" x1="316" y1="165" x2="354" y2="165" stroke-width="1.5" />
			<line class="scaffold-brace" x1="320" y1="130" x2="350" y2="165" stroke-width="1" />
		</g>

		<!-- Station sign -->
		<g class="station-sign">
			<!-- Sign background -->
			<rect
				class="sign-bg"
				x="130" y="70" width="140" height="80"
				rx="4"
				stroke-width="1.5"
			/>
			<!-- "STATION" label -->
			<text
				class="sign-label"
				x="200" y="95"
				text-anchor="middle"
				font-family="'JetBrains Mono', monospace"
				font-size="10"
				letter-spacing="3"
			>STATION</text>
			<!-- "404" large text -->
			<text
				class="sign-404"
				x="200" y="138"
				text-anchor="middle"
				font-family="Inter, sans-serif"
				font-size="40"
				font-weight="800"
			>404</text>
			<!-- Sign post -->
			<line class="scene-post" x1="200" y1="150" x2="200" y2="200" stroke-width="2" />
		</g>

		<!-- Left barrier -->
		<g class="barrier">
			<!-- Legs -->
			<line class="scene-leg" x1="105" y1="185" x2="100" y2="200" stroke-width="1.5" />
			<line class="scene-leg" x1="135" y1="185" x2="140" y2="200" stroke-width="1.5" />
			<!-- Bar with hazard chevrons -->
			<rect x="98" y="178" width="44" height="8" rx="1" fill="url(#hazard-pattern)" />
		</g>

		<!-- Right barrier -->
		<g class="barrier">
			<line class="scene-leg" x1="265" y1="185" x2="260" y2="200" stroke-width="1.5" />
			<line class="scene-leg" x1="295" y1="185" x2="300" y2="200" stroke-width="1.5" />
			<rect x="258" y="178" width="44" height="8" rx="1" fill="url(#hazard-pattern)" />
		</g>

		<!-- Left cone -->
		<g class="cone">
			<polygon class="cone-body" points="115,200 120,183 125,200" opacity="0.7" />
			<rect class="cone-base" x="112" y="200" width="16" height="3" rx="1" />
		</g>

		<!-- Right cone -->
		<g class="cone">
			<polygon class="cone-body" points="275,200 280,183 285,200" opacity="0.7" />
			<rect class="cone-base" x="272" y="200" width="16" height="3" rx="1" />
		</g>

		<!-- Construction lights -->
		<!-- Light 1 (left barrier) -->
		<circle class="light light-a" cx="120" cy="174" r="5" />
		<circle class="light-glow light-a" cx="120" cy="174" r="10" />

		<!-- Light 2 (right barrier) -->
		<circle class="light light-b" cx="280" cy="174" r="5" />
		<circle class="light-glow light-b" cx="280" cy="174" r="10" />

		<!-- Hazard stripe pattern definition -->
		<defs>
			<pattern id="hazard-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
				<rect class="hazard-stripe-a" width="4" height="8" />
				<rect class="hazard-stripe-b" x="4" width="4" height="8" />
			</pattern>
		</defs>
	</svg>
</div>

<style>
	.construction-scene {
		display: flex;
		justify-content: center;
	}

	/* GO-W2.2: structural strokes follow the theme (white-alpha was invisible
	   on paper). Orange/yellow brand elements and the dark station sign are
	   theme-invariant on purpose. */
	.scene-ground { stroke: color-mix(in srgb, var(--foreground) 8%, transparent); }
	.scene-post { stroke: color-mix(in srgb, var(--foreground) 10%, transparent); }
	.scene-leg { stroke: color-mix(in srgb, var(--foreground) 15%, transparent); }

	/* Scaffolding = yellow wayfinding voice at descending weights. */
	.scaffold-vert { stroke: color-mix(in srgb, var(--accent) 30%, transparent); }
	.scaffold-rung { stroke: color-mix(in srgb, var(--accent) 25%, transparent); }
	.scaffold-brace { stroke: color-mix(in srgb, var(--accent) 15%, transparent); }

	/* Station sign = dark signage ground + orange signage type. */
	.sign-bg {
		fill: color-mix(in srgb, var(--signage-bg) 90%, transparent);
		stroke: color-mix(in srgb, var(--primary) 30%, transparent);
	}
	.sign-label { fill: color-mix(in srgb, var(--primary) 50%, transparent); }
	.sign-404 { fill: var(--primary); }

	/* Cones = orange signage. */
	.cone-body { fill: var(--primary); }
	.cone-base { fill: color-mix(in srgb, var(--primary) 40%, transparent); }

	/* Hazard chevrons = yellow + structural black. */
	.hazard-stripe-a { fill: var(--accent); }
	.hazard-stripe-b { fill: var(--hazard-b); }

	/* Construction lights = yellow lamps + soft halo. */
	.light { fill: var(--accent); }
	.light-glow { fill: color-mix(in srgb, var(--accent) 20%, transparent); }

	/* Alternating blink for construction lights */
	.light-a, .light-glow.light-a {
		animation: blink-light 1.2s step-end infinite;
	}

	.light-b, .light-glow.light-b {
		animation: blink-light 1.2s step-end infinite;
		animation-delay: 0.6s;
	}

	@keyframes blink-light {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.15; }
	}

	@media (prefers-reduced-motion: reduce) {
		.light-a, .light-glow.light-a {
			animation: none;
			opacity: 1;
		}

		.light-b, .light-glow.light-b {
			animation: none;
			opacity: var(--opacity-subtle);
		}
	}
</style>
