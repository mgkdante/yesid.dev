<!--
  Train ↔ rocket morph — pure delight card (operator: "transit + space,
  cute af"). Every train path morphs into a structurally identical rocket
  path (see train-rocket-shapes.ts) so the tween loses nothing: the smoke
  puff BECOMES the flame, the wheels become fins, the headlight becomes a
  star. Morphs on hover (desktop), tap (mobile), and keyboard focus.
  Reduced motion: instant state flip, no travel (the cue stays, the motion
  goes) and the idle bob is gated off.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { gsap } from '$lib/motion/utils/gsap.js';
	import { Card } from '$lib/components/ui/card';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import {
		TRAIN_ROCKET_SHAPES,
		TRAIN_ROCKET_VIEWBOX,
	} from './train-rocket-shapes.js';

	const locale = getLocale();

	// Accessible name for the morph toy. No localized CMS source feeds it
	// (about-page.ts is CMS-generated), so the QC/EN copy lives inline here.
	const TRAIN_ARIA = {
		rocket: {
			en: 'Rocket · tap to land it back into a train',
			fr: 'Fusée · clique pour la reposer en train',
			es: 'Cohete · toca para aterrizarlo de vuelta en tren',
		},
		train: {
			en: 'Train · tap to launch it into a rocket',
			fr: 'Train · clique pour le lancer en fusée',
			es: 'Tren · toca para lanzarlo como cohete',
		},
	} as const;

	// ── Pre-parse each shape into a number-stripped skeleton + the train and
	//    rocket number vectors. Structural parity (verified at authoring time)
	//    guarantees equal-length vectors; a mismatch falls back to a snap at
	//    t≥0.5 instead of producing a garbled path. ──
	const NUM = /-?\d+\.?\d*/g;
	const nums = (d: string): number[] => (d.match(NUM) ?? []).map(Number);
	const skeleton = (d: string): string[] => d.split(NUM);
	const rgb = (hex: string): [number, number, number] => {
		const h = hex.replace('#', '');
		return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
	};

	const parsed = TRAIN_ROCKET_SHAPES.map((s) => {
		const tN = nums(s.train.d);
		const rN = nums(s.rocket.d);
		return {
			id: s.id,
			parts: skeleton(s.train.d),
			parity: tN.length === rN.length,
			trainN: tN,
			rocketN: rN,
			trainRGB: rgb(s.train.fill),
			rocketRGB: rgb(s.rocket.fill),
			trainD: s.train.d,
			rocketD: s.rocket.d,
		};
	});

	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	// progress: 0 = train, 1 = rocket. Driven by GSAP; read reactively.
	let progress = $state(0);

	const shapes = $derived(
		parsed.map((p) => {
			const t = progress;
			let d: string;
			if (p.parity) {
				let out = '';
				for (let i = 0; i < p.parts.length; i++) {
					out += p.parts[i];
					if (i < p.trainN.length) out += lerp(p.trainN[i], p.rocketN[i], t).toFixed(2);
				}
				d = out;
			} else {
				d = t >= 0.5 ? p.rocketD : p.trainD;
			}
			const r = Math.round(lerp(p.trainRGB[0], p.rocketRGB[0], t));
			const g = Math.round(lerp(p.trainRGB[1], p.rocketRGB[1], t));
			const b = Math.round(lerp(p.trainRGB[2], p.rocketRGB[2], t));
			return { id: p.id, d, fill: `rgb(${r},${g},${b})` };
		}),
	);

	let reduced = $state(false);
	let hovered = $state(false);
	let tapped = $state(false);
	let launched = $derived(hovered || tapped);

	const tweenState = { p: 0 };
	let activeTween: gsap.core.Tween | null = null;

	function morphTo(target: 0 | 1) {
		if (reduced) {
			progress = target;
			return;
		}
		activeTween?.kill();
		activeTween = gsap.to(tweenState, {
			p: target,
			duration: 0.7,
			// back.inOut → a little anticipatory crouch, then an overshoot on launch.
			ease: 'back.inOut(1.6)',
			onUpdate: () => {
				progress = tweenState.p;
			},
		});
	}

	$effect(() => {
		morphTo(launched ? 1 : 0);
	});

	function onEnter(e: PointerEvent) {
		// Mouse hover only — touch fires pointerenter on tap, which the click
		// toggle already owns; double-driving it makes the morph stutter.
		if (e.pointerType === 'mouse') hovered = true;
	}
	function onLeave(e: PointerEvent) {
		if (e.pointerType === 'mouse') hovered = false;
	}
	function onClick() {
		tapped = !tapped;
	}

	onMount(() => {
		reduced = isPrefersReducedMotion();
	});
	onDestroy(() => {
		activeTween?.kill();
	});
</script>

<Card class="flex h-full items-center justify-center" data-testid="about-train">
	<button
		type="button"
		class="train-rocket"
		class:is-launched={launched}
		class:no-bob={reduced}
		data-testid="about-train-button"
		aria-pressed={tapped}
		aria-label={launched
			? resolveLocale(TRAIN_ARIA.rocket, locale)
			: resolveLocale(TRAIN_ARIA.train, locale)}
		onpointerenter={onEnter}
		onpointerleave={onLeave}
		onclick={onClick}
	>
		<svg viewBox={TRAIN_ROCKET_VIEWBOX} width="120" height="120" aria-hidden="true">
			{#each shapes as shape (shape.id)}
				<path
					d={shape.d}
					fill={shape.fill}
					stroke="#FFFFFF"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>
			{/each}
		</svg>
	</button>
</Card>

<style>
	.train-rocket {
		appearance: none;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		display: grid;
		place-items: center;
		border-radius: var(--radius-md);
		/* Idle bob — a tiny ceaseless float so the resting train feels alive.
		   Gated off under reduced motion via .no-bob. */
		animation: train-bob 3.2s ease-in-out infinite;
	}

	.train-rocket.no-bob {
		animation: none;
	}

	/* Belt to the JS suspenders: gate the idle bob at the CSS layer too, so a
	   reduced-motion visitor never sees it even before hydration (SSR-correct,
	   and deterministic for the motion-policy e2e). */
	@media (prefers-reduced-motion: reduce) {
		.train-rocket {
			animation: none;
		}
	}

	.train-rocket:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 4px;
	}

	.train-rocket svg {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--glow) 22%, transparent));
		transition: filter var(--duration-normal) var(--ease-default);
	}

	/* Launched: a warmer, taller glow as it lifts off. */
	.train-rocket.is-launched svg {
		filter: drop-shadow(0 8px 16px color-mix(in srgb, var(--accent) 38%, transparent));
	}

	:global([data-theme='light']) .train-rocket.is-launched svg {
		filter: drop-shadow(0 8px 16px color-mix(in srgb, var(--accent) 60%, transparent));
	}

	@keyframes train-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}
</style>
