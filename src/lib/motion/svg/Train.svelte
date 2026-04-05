<script lang="ts">
	// Geometric, stylized side-view train SVG for GSAP MotionPathPlugin animation.
	// All animation is wired externally via the named group ids — this file is pure markup.
	let { trainClass = '' }: { trainClass?: string } = $props();
</script>

<svg
	id="yesid-train"
	class={trainClass}
	viewBox="0 0 520 120"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<defs>
		<!-- Nose glow: orange fading to transparent -->
		<radialGradient id="train-ng" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#E07800" stop-opacity="0.6" />
			<stop offset="100%" stop-color="#E07800" stop-opacity="0" />
		</radialGradient>

		<!-- Wheel hub: orange center to darker orange edge -->
		<radialGradient id="train-wg" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#E07800" />
			<stop offset="100%" stop-color="#C96A00" />
		</radialGradient>

		<!-- Headlight glow: amber fading to transparent -->
		<radialGradient id="train-lg" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#FFB627" stop-opacity="0.5" />
			<stop offset="100%" stop-color="#FFB627" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- Soft radial glow behind the nose — GSAP pulses opacity when idle at station -->
	<g id="train-glow">
		<ellipse cx="498" cy="60" rx="90" ry="42" fill="url(#train-ng)" opacity="0.5" />
	</g>

	<!-- Main passenger car body -->
	<g id="train-body">
		<!-- Thin top-edge shading strip -->
		<rect x="22" y="33" width="398" height="4" rx="2" fill="#DDDBD5" />
		<!-- Primary body rectangle -->
		<rect x="22" y="33" width="398" height="53" rx="5" fill="#F5F5F0" />
		<!-- Left tail end-cap for a finished look -->
		<rect x="22" y="33" width="10" height="53" rx="5" fill="#D8D6D0" />
	</g>

	<!-- Nose / driver cab section (trapezoid on the right) -->
	<g id="train-cab">
		<polygon points="420,33 472,43 480,58 480,86 420,86" fill="#EDEAE3" />
		<!-- Vertical join line between cab and body -->
		<line x1="420" y1="33" x2="420" y2="86" stroke="#C8C6C0" stroke-width="1.2" />
	</g>

	<!-- Orange accent band spanning full train width — GSAP animates scaleX 0→1 on reveal -->
	<g id="train-stripe">
		<!-- Thin highlight above the main stripe -->
		<rect x="22" y="53" width="458" height="3" fill="#FFB627" opacity="0.55" />
		<!-- Primary orange stripe -->
		<rect x="22" y="56" width="458" height="10" fill="#E07800" />
	</g>

	<!-- Windows: 3 body + 1 cab — each has outer border, inner glass, tiny reflection -->
	<g id="train-windows">
		<!-- Body window 1 -->
		<rect x="54" y="38" width="62" height="29" rx="3" fill="#141414" />
		<rect x="56" y="40" width="58" height="25" rx="2" fill="#1C1C1C" />
		<rect x="58" y="42" width="12" height="6" rx="1" fill="#2A2A2A" />

		<!-- Body window 2 -->
		<rect x="146" y="38" width="62" height="29" rx="3" fill="#141414" />
		<rect x="148" y="40" width="58" height="25" rx="2" fill="#1C1C1C" />
		<rect x="150" y="42" width="12" height="6" rx="1" fill="#2A2A2A" />

		<!-- Body window 3 -->
		<rect x="238" y="38" width="62" height="29" rx="3" fill="#141414" />
		<rect x="240" y="40" width="58" height="25" rx="2" fill="#1C1C1C" />
		<rect x="242" y="42" width="12" height="6" rx="1" fill="#2A2A2A" />

		<!-- Cab window -->
		<rect x="428" y="38" width="38" height="27" rx="3" fill="#141414" />
		<rect x="430" y="40" width="34" height="23" rx="2" fill="#1C1C1C" />
		<rect x="432" y="42" width="8" height="5" rx="1" fill="#2A2A2A" />
		<!-- Faint orange interior lighting tint -->
		<rect x="430" y="40" width="34" height="23" rx="2" fill="#E07800" opacity="0.18" />
	</g>

	<!-- Undercarriage skirting (not animated, not a named group) -->
	<rect x="26" y="84" width="452" height="14" rx="3" fill="#1A1A1A" />
	<!-- Subtle lighter top edge on the skirting -->
	<rect x="26" y="84" width="452" height="2" rx="1" fill="#2E2E2E" />

	<!-- Wheels: 2 bogie groups × 2 wheels — GSAP rotates the middle ring on scroll -->
	<g id="train-wheels">
		<!-- Bogie 1, wheel 1 -->
		<circle cx="99" cy="100" r="14" fill="#141414" />
		<circle cx="99" cy="100" r="9" fill="#222222" />
		<circle cx="99" cy="100" r="4" fill="url(#train-wg)" />

		<!-- Bogie 1, wheel 2 -->
		<circle cx="147" cy="100" r="14" fill="#141414" />
		<circle cx="147" cy="100" r="9" fill="#222222" />
		<circle cx="147" cy="100" r="4" fill="url(#train-wg)" />

		<!-- Bogie 2, wheel 1 -->
		<circle cx="368" cy="100" r="14" fill="#141414" />
		<circle cx="368" cy="100" r="9" fill="#222222" />
		<circle cx="368" cy="100" r="4" fill="url(#train-wg)" />

		<!-- Bogie 2, wheel 2 -->
		<circle cx="416" cy="100" r="14" fill="#141414" />
		<circle cx="416" cy="100" r="9" fill="#222222" />
		<circle cx="416" cy="100" r="4" fill="url(#train-wg)" />
	</g>

	<!-- Headlights at the nose tip — amber upper, orange lower, each with a glow -->
	<g id="train-lights">
		<!-- Upper headlight glow + rect -->
		<ellipse cx="488" cy="49" rx="14" ry="10" fill="url(#train-lg)" />
		<rect x="479" y="46" width="8" height="7" rx="2" fill="#FFB627" />

		<!-- Lower headlight glow + rect -->
		<ellipse cx="488" cy="73" rx="14" ry="10" fill="url(#train-lg)" />
		<rect x="479" y="70" width="8" height="7" rx="2" fill="#E07800" />
	</g>
</svg>
