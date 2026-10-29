<script lang="ts">import { ConstructionFloodlight } from '@yesid/ui/brand';</script>

<!--
  CloserFloodlight — Ground-level floodlight fixture with upward light beam.
  Pure visual element, no JS. Centered under the ending on desktop, centered on mobile.
-->
<div class="closer-floodlight-wrap" data-slot="closer-floodlight" aria-hidden="true">
	<!-- Beam emerges from the lens at top of floodlight, spreads upward -->
	<div class="closer-beam"></div>
	<div class="closer-floodlight"><ConstructionFloodlight lit /></div>
</div>

<style>
	/* Match the ending slot so the beam stays centered on its painted wordmark. */
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

	/* Light beam — originates from the lens and widens upward to the ending. */
	.closer-beam {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		/* Bottom edge sits at top of floodlight wrapper = lens position */
		bottom: 100%;
		width: clamp(400px, 45vw, 650px);
		height: calc(42dvh + var(--construction-extension, 0px));
		/* Narrow base matches the lens; the wide top covers the ending. */
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

		/* Beam up to the ending — wider spread on mobile. */
		.closer-beam {
			display: block;
			width: clamp(280px, 80vw, 400px);
			height: calc(35dvh + var(--construction-extension, 0px));
			clip-path: polygon(48.5% 100%, 51.5% 100%, 100% 0%, 0% 0%);
		}
	}
</style>
