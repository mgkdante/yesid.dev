<!--
  CloserFloodlight — Ground-level floodlight fixture with upward light beam.
  Pure visual element, no JS. Centered under graffiti on desktop, centered on mobile.
-->
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
		<rect x="26" y="1" width="12" height="3" rx="1" fill="var(--accent)"/>
		<rect x="27.5" y="1.5" width="9" height="1.5" rx="0.5" fill="#FFD060" opacity="0.8"/>
		<!-- Glow halo around lens -->
		<rect x="24" y="0" width="16" height="5" rx="2" fill="var(--accent)" opacity="0.15"/>
	</svg>
</div>

<style>
	/* Floodlight wrapper — same right+width as graffiti so it stays centered */
	.closer-floodlight-wrap {
		position: absolute;
		bottom: 0;
		right: 4%;
		width: clamp(160px, 18vw, 260px);
		display: flex;
		justify-content: center;
		pointer-events: none;
		z-index: calc(var(--z-content) + 3);
		line-height: 0;
		overflow: visible;
	}
	.closer-floodlight {
		width: clamp(40px, 5vw, 64px);
		height: auto;
		display: block;
	}

	/* Light beam — originates from floodlight lens, widens upward to graffiti */
	.closer-beam {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		/* Bottom edge sits at top of floodlight wrapper = lens position */
		bottom: 100%;
		width: clamp(400px, 45vw, 650px);
		height: 42dvh;
		/* Narrow base matches floodlight lens (~12px), wide top covers graffiti */
		clip-path: polygon(49% 100%, 51% 100%, 100% 0%, 0% 0%);
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--accent) 8%, transparent) 0%,
			color-mix(in srgb, var(--accent) 4%, transparent) 35%,
			color-mix(in srgb, var(--accent) 1.5%, transparent) 65%,
			transparent 100%
		);
		filter: blur(8px);
		pointer-events: none;
	}
	:global([data-theme='light']) .closer-beam {
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--accent) 20%, transparent) 0%,
			color-mix(in srgb, var(--accent) 11%, transparent) 35%,
			color-mix(in srgb, var(--accent) 4%, transparent) 65%,
			transparent 100%
		);
	}

	@media (--tablet-max) {
		/* Floodlight on the ground, centered across full width */
		.closer-floodlight-wrap {
			position: absolute;
			bottom: 0;
			right: auto;
			left: 50%;
			transform: translateX(-50%);
			width: auto;
			z-index: calc(var(--z-content) + 3);
		}

		/* Beam from floodlight up to graffiti — wider spread on mobile */
		.closer-beam {
			display: block;
			width: clamp(280px, 80vw, 400px);
			height: 35dvh;
			clip-path: polygon(48.5% 100%, 51.5% 100%, 100% 0%, 0% 0%);
		}
	}
</style>
