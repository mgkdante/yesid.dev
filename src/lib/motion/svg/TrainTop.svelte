<!--
  Bird's-eye (top-down) view of two connected Montreal metro wagons.
  Sits centered on the vertical rail track. No animation props —
  all motion is handled by the parent TrainJourney wrapper.
-->
<svg
	viewBox="0 0 24 108"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	class="w-full h-full"
>
	<defs>
		<!-- Headlight glow at the front (bottom) of the lead wagon -->
		<radialGradient id="train-top-hl" cx="50%" cy="100%" r="60%">
			<stop offset="0%" stop-color="var(--brand-accent)" stop-opacity="0.5" />
			<stop offset="100%" stop-color="var(--brand-accent)" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- === REAR WAGON (top) === -->
	<!-- Roof body -->
	<rect x="3" y="2" width="18" height="46" rx="5" fill="#F5F5F0" />
	<!-- Edge shading -->
	<rect x="3" y="2" width="2" height="46" rx="1" fill="#D8D6D0" />
	<rect x="19" y="2" width="2" height="46" rx="1" fill="#D8D6D0" />
	<!-- Orange center stripe -->
	<rect x="10.5" y="4" width="3" height="42" rx="1.5" fill="var(--brand-primary)" />
	<!-- AC units -->
	<rect x="6" y="10" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="14" y="10" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="6" y="32" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="14" y="32" width="4" height="5" rx="1" fill="#C8C6C0" />
	<!-- Rear edge -->
	<rect x="7" y="2" width="10" height="2" rx="1" fill="#D8D6D0" />

	<!-- === COUPLER === -->
	<rect x="9" y="48" width="6" height="6" rx="1" fill="#333" />
	<rect x="10.5" y="49" width="3" height="4" rx="0.5" fill="#555" />

	<!-- === LEAD WAGON (bottom) === -->
	<!-- Headlight glow cone -->
	<ellipse cx="12" cy="104" rx="10" ry="6" fill="url(#train-top-hl)" />
	<!-- Roof body -->
	<rect x="3" y="54" width="18" height="48" rx="5" fill="#F5F5F0" />
	<!-- Edge shading -->
	<rect x="3" y="54" width="2" height="48" rx="1" fill="#D8D6D0" />
	<rect x="19" y="54" width="2" height="48" rx="1" fill="#D8D6D0" />
	<!-- Orange center stripe -->
	<rect x="10.5" y="56" width="3" height="44" rx="1.5" fill="var(--brand-primary)" />
	<!-- AC units -->
	<rect x="6" y="62" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="14" y="62" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="6" y="84" width="4" height="5" rx="1" fill="#C8C6C0" />
	<rect x="14" y="84" width="4" height="5" rx="1" fill="#C8C6C0" />
	<!-- Front windshield arc -->
	<path d="M6,98 Q12,106 18,98" fill="none" stroke="var(--brand-primary)" stroke-width="1.2" stroke-linecap="round" />
	<!-- Front headlights -->
	<circle cx="7" cy="100" r="1.2" fill="var(--brand-accent)" />
	<circle cx="17" cy="100" r="1.2" fill="var(--brand-accent)" />
</svg>
