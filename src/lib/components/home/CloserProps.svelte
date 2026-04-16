<!--
  CloserProps — Construction prop SVGs fetched and injected with 3D lighting.
  Props are absolutely positioned at the bottom of the parent section.
  display:contents wrapper preserves absolute positioning relative to parent.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let wrapperEl: HTMLElement | undefined = $state(undefined);

	onMount(() => {
		if (!browser || !wrapperEl) return;

		const propFiles = ['cone', 'sign', 'helmet', 'barricade'] as const;
		propFiles.forEach((name, idx) => {
			const wrap = wrapperEl!.querySelector(`[data-prop="${name}"]`);
			if (!wrap) return;
			fetch(`/svg/graffiti/prop-${name}.svg`)
				.catch(() => null) // Tests run without a server
				.then((r) => r?.text())
				.then((text) => {
					if (!text) return;
					const parser = new DOMParser();
					const doc = parser.parseFromString(text, 'image/svg+xml');
					const svg = doc.querySelector('svg');
					if (!svg) return;
					svg.classList.add('prop-svg');

					// Add floodlight-style 3D lighting
					const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 100, 100];
					const cx = vb[2] / 2;
					const h = vb[3];
					const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
					if (!svg.querySelector('defs')) svg.prepend(defs);
					const filterId = `prop-light-${idx}`;
					const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
					filter.setAttribute('id', filterId);
					filter.setAttribute('x', '-50%');
					filter.setAttribute('y', '-50%');
					filter.setAttribute('width', '200%');
					filter.setAttribute('height', '200%');
					filter.innerHTML = `
						<feDiffuseLighting in="SourceGraphic" result="light" surfaceScale="4" diffuseConstant="1.3" lighting-color="var(--accent)">
							<feSpotLight x="${cx}" y="${h + 100}" z="50" pointsAtX="${cx}" pointsAtY="0" pointsAtZ="0" specularExponent="8" limitingConeAngle="45"/>
						</feDiffuseLighting>
						<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.3" k2="0.2" k3="0" k4="0"/>
					`;
					defs.appendChild(filter);
					const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
					contentGroup.setAttribute('filter', `url(#${filterId})`);
					const children = Array.from(svg.children).filter(c => c.tagName !== 'defs');
					children.forEach(c => contentGroup.appendChild(c));
					svg.appendChild(contentGroup);

					wrap.appendChild(svg);
				});
		});
	});
</script>

<!-- display:contents preserves absolute positioning relative to parent section -->
<div bind:this={wrapperEl} style:display="contents">
	<div class="prop prop-cone" data-prop="cone" aria-hidden="true"></div>
	<div class="prop prop-sign" data-prop="sign" aria-hidden="true"></div>
	<div class="prop prop-helmet" data-prop="helmet" aria-hidden="true"></div>
	<div class="prop prop-barricade" data-prop="barricade" aria-hidden="true"></div>
</div>

<style>
	/* Individual props — absolutely positioned on the ground */
	.prop {
		position: absolute;
		bottom: 0;
		pointer-events: none;
		z-index: calc(var(--z-content) + 2);
		line-height: 0;
	}
	:global(.prop-svg) {
		width: 100% !important;
		height: auto !important;
		display: block;
	}

	/* Desktop prop positions — left cluster, bigger */
	.prop-cone { left: 2%; width: 50px; }
	.prop-sign { left: 10%; width: 75px; }
	.prop-helmet { left: 22%; width: 60px; }
	.prop-barricade { left: 30%; width: 200px; }

	@media (max-width: 767px) {
		/* Props cluster around the centered floodlight */
		.prop-cone {
			left: calc(50% - 80px);
			width: 22px;
		}
		.prop-sign {
			left: calc(50% - 50px);
			width: 36px;
		}
		.prop-helmet {
			left: calc(50% + 24px);
			width: 28px;
		}
		.prop-barricade {
			left: calc(50% + 50px);
			width: 80px;
		}
	}
</style>
