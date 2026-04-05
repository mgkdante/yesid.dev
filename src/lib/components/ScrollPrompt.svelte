<!--
  Animated scroll-down prompt for the hero section.
  SVG chevron with CSS bounce animation.
  Clicks to smooth-scroll past the hero section.
  Respects prefers-reduced-motion via CSS media query (no bounce when reduced).
-->
<button
	class="scroll-prompt cursor-pointer border-none bg-transparent"
	aria-label="Scroll down"
	data-testid="scroll-prompt"
	onclick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
>
	<svg viewBox="0 0 24 24" class="h-6 w-6 text-brand-primary" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M7 10l5 5 5-5" />
	</svg>
</button>

<style>
	.scroll-prompt {
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(8px); }
	}

	@media (prefers-reduced-motion: reduce) {
		.scroll-prompt {
			animation: none;
		}
	}
</style>
