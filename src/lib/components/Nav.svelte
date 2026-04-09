<!--
  Floating pill navigation. Centered at top: 16px, full-capsule shape.
  Three primary links + progress rail below. Menu toggle for overlay (Task 4).
  Wordmark letters animated via GSAP SplitText on hover (4 rotating effects).
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';
	import { navLinks } from '$lib/data';

	let { pathname = '/' }: { pathname?: string } = $props();

	let menuOpen = $state(false);

	// Refs for the wordmark elements
	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let splitInstance: InstanceType<typeof SplitText> | undefined;

	// effectIndex cycles through the pool so each hover feels different.
	let effectIndex = 0;
	// Guard: prevents overlapping animations when hovering rapidly.
	let isAnimating = false;

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	/** Which progress rail segment is active based on current route. -1 = none. */
	function activeSegment(): number {
		if (pathname === '/services' || pathname.startsWith('/services/')) return 0;
		if (pathname === '/work' || pathname.startsWith('/work/')) return 1;
		if (pathname === '/tech-stack') return 2;
		return -1;
	}

	// Lock body scroll when menu is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = menuOpen ? 'hidden' : '';
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}

	// --- Wordmark hover animation pool ---
	// Four distinct effects rotate on each hover so the interaction stays fresh.

	// Bounce: letters jump up with elastic ease then return.
	const effectBounce = (chars: Element[]) =>
		gsap
			.timeline()
			.fromTo(chars, { y: 0 }, { y: -15, stagger: 0.04, duration: 0.3, ease: 'back.out(1.7)' })
			.to(chars, { y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' }, '>-0.15');

	// Wiggle: letters rotate left then right then snap back with elastic ease.
	const effectWiggle = (chars: Element[]) =>
		gsap
			.timeline()
			.to(chars, { rotation: 12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
			.to(chars, { rotation: -12, stagger: 0.03, duration: 0.15, ease: 'power1.out' })
			.to(chars, { rotation: 0, stagger: 0.03, duration: 0.3, ease: 'elastic.out(1, 0.3)' });

	// Wave: sine-wave y-offset ripple across letters.
	const effectWave = (chars: Element[]) =>
		gsap.timeline().to(chars, {
			y: -10,
			stagger: { each: 0.05, from: 'start' },
			duration: 0.25,
			ease: 'sine.out',
			yoyo: true,
			repeat: 1
		});

	// Spin: each letter does a full 360 rotation then resets to 0.
	const effectSpin = (chars: Element[]) =>
		gsap
			.timeline()
			.to(chars, { rotation: 360, stagger: 0.05, duration: 0.5, ease: 'power2.inOut' })
			.set(chars, { rotation: 0 });

	const effects = [effectBounce, effectWiggle, effectWave, effectSpin];

	function handleWordmarkHover() {
		// Skip if already animating, user prefers reduced motion, or SplitText not ready.
		if (isAnimating || isPrefersReducedMotion() || !splitInstance) return;
		isAnimating = true;

		const tl = effects[effectIndex](splitInstance.chars);

		// The orange dot always pulses on every hover regardless of which effect is active.
		tl.fromTo(
			dotEl,
			{ scale: 1 },
			{ scale: 1.4, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 },
			0
		);

		// Release the guard when the full timeline finishes.
		tl.then(() => {
			isAnimating = false;
		});

		// Advance to the next effect; wrap around after the last one.
		effectIndex = (effectIndex + 1) % effects.length;
	}

	onMount(() => {
		// SplitText manipulates the DOM, so it must run client-side only.
		// Guard against SSR and reduced-motion preference.
		if (isPrefersReducedMotion() || typeof window === 'undefined') return;
		registerGsapPlugins();
		splitInstance = new SplitText(wordmarkEl, { type: 'chars' });

		// Play the first effect on page load so the site feels alive immediately.
		// Short delay lets the page paint first so the animation isn't clipped.
		setTimeout(() => {
			handleWordmarkHover();
		}, 500);
	});

	onDestroy(() => {
		// Restore the original text nodes so the DOM is clean after unmount.
		splitInstance?.revert();
	});
</script>

<svelte:window onkeydown={onKeydown} />

<nav
	data-testid="nav"
	class="fixed top-4 left-0 right-0 z-50 flex flex-col items-center pointer-events-none"
>
	<!-- Pill -->
	<div
		data-testid="nav-pill"
		class="nav-pill pointer-events-auto flex items-center gap-0"
	>
		<!-- Wordmark -->
		<a
			href="/"
			data-testid="nav-wordmark"
			class="inline-flex items-baseline font-heading text-lg font-bold text-[var(--text-primary)]"
			onmouseenter={handleWordmarkHover}
			onclick={handleWordmarkHover}
		>
			<span data-testid="nav-wordmark-letters" bind:this={wordmarkEl}>yesid</span><span
				data-testid="nav-period"
				bind:this={dotEl}
				class="text-brand-primary">.</span
			>
		</a>

		<!-- Divider -->
		<span class="nav-divider" aria-hidden="true"></span>

		<!-- Nav links -->
		<div class="flex items-center gap-7">
			{#each navLinks as link}
				<span class={link.priority === 2 ? 'hidden min-[480px]:block' : undefined}>
					<a
						href={link.href}
						class="nav-pill-link transition-all {isActive(link.href)
							? 'text-[#E07800] nav-link-active'
							: 'text-[#aaa] hover:text-[#E07800] hover:nav-link-glow'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label.en}
					</a>
				</span>
			{/each}
		</div>

		<!-- Divider -->
		<span class="nav-divider" aria-hidden="true"></span>

		<!-- Menu toggle -->
		<button
			data-testid="nav-menu-toggle"
			class="flex flex-col items-end gap-[5px] p-1"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="block h-[1.5px] w-4 rounded-full bg-[#aaa] transition-transform"></span>
			<span class="block h-[1.5px] w-[11px] rounded-full bg-[#aaa] transition-transform"></span>
		</button>
	</div>

	<!-- Progress rail -->
	<div
		data-testid="nav-progress-rail"
		class="nav-progress-rail pointer-events-none mt-2 flex gap-[3px]"
	>
		{#each [0, 1, 2] as idx}
			<div
				class="h-[2px] flex-1 rounded-sm transition-colors duration-300
					{idx === 2 ? 'hidden min-[480px]:block' : ''}
					{activeSegment() === idx ? 'bg-[#E07800]' : 'bg-[rgba(255,255,255,0.05)]'}"
			></div>
		{/each}
	</div>
</nav>

<style>
	.nav-pill {
		background: rgba(20, 20, 20, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(224, 120, 0, 0.1);
		border-radius: 9999px;
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03);
		padding: 12px 28px;
	}

	.nav-divider {
		display: inline-block;
		width: 1px;
		height: 18px;
		background: rgba(255, 255, 255, 0.08);
		margin-inline: 20px;
		flex-shrink: 0;
	}

	.nav-pill-link {
		font-size: 13.5px;
		font-weight: 500;
		white-space: nowrap;
	}

	.nav-progress-rail {
		width: 280px;
	}

	:global(.nav-link-glow) {
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.6), 0 0 20px rgba(224, 120, 0, 0.3);
	}
	:global(.nav-link-active) {
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.5), 0 0 16px rgba(224, 120, 0, 0.2);
	}
</style>
