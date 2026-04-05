<!--
  Site navigation. Desktop: horizontal links. Mobile: fullscreen metro-themed overlay.
  The mobile menu evokes a metro station — black bg, yellow/black hazard stripes,
  numbered stops for each nav link, staggered reveal animation.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';

	let { pathname = '/' }: { pathname?: string } = $props();

	let menuOpen = $state(false);

	// Refs for the wordmark elements — bound in the desktop anchor only.
	// The mobile menu copy stays static (no animation, no bind).
	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let splitInstance: InstanceType<typeof SplitText> | undefined;

	// effectIndex cycles through the pool so each hover feels different.
	let effectIndex = 0;
	// Guard: prevents overlapping animations when hovering rapidly.
	let isAnimating = false;

	const links = [
		{ label: 'Work', href: '/work' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'About', href: '/about' },
		{ label: 'Contact', href: '/contact' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
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
	class="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-sm"
>
	<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
		<!-- Wordmark — each letter is split by SplitText for per-char animation on hover.
		     inline-flex items-baseline keeps the orange dot visually aligned after SplitText
		     wraps every char in its own <div>. -->
		<a
			href="/"
			data-testid="nav-wordmark"
			class="font-heading text-xl font-bold text-[var(--text-primary)] inline-flex items-baseline"
			onmouseenter={handleWordmarkHover}
			onclick={handleWordmarkHover}
		>
			<span data-testid="nav-wordmark-letters" bind:this={wordmarkEl}>yesid</span><span
				data-testid="nav-period"
				bind:this={dotEl}
				class="text-brand-primary">.</span
			>
		</a>

		<!-- Desktop links -->
		<ul class="hidden items-center gap-8 md:flex">
			{#each links as link}
				<li>
					<a
						href={link.href}
						class="nav-link text-sm font-medium transition-all {isActive(link.href)
							? 'text-brand-primary nav-glow-active'
							: 'text-[var(--text-secondary)] hover:text-brand-primary hover:nav-glow'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Hamburger (mobile) -->
		<button
			data-testid="nav-hamburger"
			class="flex flex-col gap-1.5 md:hidden"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="block h-0.5 w-5 bg-[var(--text-primary)] transition-transform {menuOpen ? 'translate-y-2 rotate-45' : ''}"></span>
			<span class="block h-0.5 w-5 bg-[var(--text-primary)] transition-opacity {menuOpen ? 'opacity-0' : ''}"></span>
			<span class="block h-0.5 w-5 bg-[var(--text-primary)] transition-transform {menuOpen ? '-translate-y-2 -rotate-45' : ''}"></span>
		</button>
	</div>
</nav>

<!-- Fullscreen mobile menu overlay -->
{#if menuOpen}
	<div
		class="fixed inset-0 z-[60] flex flex-col bg-[#141414] md:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		data-testid="nav-fullscreen-menu"
	>
		<!-- Header bar: wordmark + close button -->
		<div class="flex items-center justify-between px-6 py-4">
			<span class="font-heading text-xl font-bold text-[var(--text-primary)]">
				yesid<span class="text-brand-primary">.</span>
			</span>
			<button
				class="flex h-10 w-10 items-center justify-center text-2xl text-[var(--text-primary)]"
				aria-label="Close menu"
				onclick={() => (menuOpen = false)}
			>
				&times;
			</button>
		</div>

		<!-- Hazard stripe accent -->
		<div
			class="h-1"
			style="background: repeating-linear-gradient(-45deg, #FFB627 0px, #FFB627 8px, #141414 8px, #141414 16px);"
			aria-hidden="true"
		></div>

		<!-- Navigation links — metro-numbered, large, centered -->
		<nav class="flex flex-1 flex-col items-center justify-center gap-10">
			{#each links as link, i}
				<a
					href={link.href}
					class="menu-link group flex items-center gap-4 font-heading text-3xl font-bold transition-all
						{isActive(link.href)
							? 'text-brand-primary menu-glow-active'
							: 'text-[var(--text-primary)] hover:text-brand-primary'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
					onclick={() => (menuOpen = false)}
					style="animation: menu-link-in 300ms ease-out {i * 80}ms both;"
				>
					<span class="font-mono text-sm text-[#E07800] opacity-60 group-hover:opacity-100">
						{String(i + 1).padStart(2, '0')}
					</span>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Bottom station label -->
		<div class="px-6 py-6 text-center">
			<div
				class="h-0.5 mb-4"
				style="background: repeating-linear-gradient(-45deg, #FFB627 0px, #FFB627 8px, #141414 8px, #141414 16px);"
				aria-hidden="true"
			></div>
			<div class="font-mono text-[10px] tracking-[3px] text-[#E07800]">
				TERMINAL — NAVIGATION
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes menu-link-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Desktop nav link glow */
	:global(.nav-link:hover) {
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.6), 0 0 20px rgba(224, 120, 0, 0.3);
	}
	:global(.nav-glow-active) {
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.5), 0 0 16px rgba(224, 120, 0, 0.2);
	}

	/* Mobile fullscreen menu link glow */
	.menu-link:hover {
		text-shadow: 0 0 12px rgba(224, 120, 0, 0.7), 0 0 30px rgba(224, 120, 0, 0.4);
	}
	.menu-link:active {
		text-shadow: 0 0 16px rgba(224, 120, 0, 0.9), 0 0 40px rgba(224, 120, 0, 0.5);
	}
	.menu-glow-active {
		text-shadow: 0 0 10px rgba(224, 120, 0, 0.6), 0 0 24px rgba(224, 120, 0, 0.3);
	}
</style>
