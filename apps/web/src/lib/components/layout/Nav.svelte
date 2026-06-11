<!--
  Floating pill navigation. Centered at top: 16px, full-capsule shape.
  Three primary links. Menu toggle for overlay (Task 4).
  Wordmark letters animated via GSAP SplitText on hover (4 rotating effects).
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { wordmarkHover, magnetic } from '$lib/motion/actions';
	import { sharedChromeContent, navLinks as staticNavLinks } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';
	import MenuOverlay from './MenuOverlay.svelte';
	import type { NavLink } from '$lib/content/nav';

	const openMenuAria = resolveLocale(sharedChromeContent.openMenuAria, 'en');
	const closeMenuAria = resolveLocale(sharedChromeContent.closeMenuAria, 'en');

	let {
		pathname = '/',
		headerLinks = staticNavLinks as readonly NavLink[],
		menuItems = [] as readonly NavLink[],
	}: {
		pathname?: string;
		headerLinks?: readonly NavLink[];
		menuItems?: readonly NavLink[];
	} = $props();

	let menuOpen = $state(false);
	// True while overlay is visible (including during close animation).
	// Pill visual state (compact, z-index, toggle icon) follows this, not menuOpen.
	let overlayActive = $state(false);

	function toggleMenu() {
		if (menuOpen) {
			menuOpen = false;
		} else if (!overlayActive) {
			menuOpen = true;
			overlayActive = true;
		}
	}

	function handleOverlayClose() {
		menuOpen = false;
	}

	function handleOverlayDone() {
		overlayActive = false;
	}

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;
	let wordmarkAction: ReturnType<typeof wordmarkHover> | undefined;

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}

	onMount(() => {
		wordmarkAction = wordmarkHover(wordmarkEl, {
			dotEl,
			autoPlay: true,
			autoPlayDelay: 500
		});
	});

	onDestroy(() => {
		wordmarkAction?.destroy();
	});
</script>

<svelte:window onkeydown={onKeydown} />

<nav
	data-testid="nav"
	class="fixed left-0 right-0 flex flex-col items-center pointer-events-none nav-root"
	style:z-index={overlayActive ? 70 : 50}
>
	<!-- Pill -->
	<div
		data-testid="nav-pill"
		class="nav-pill pointer-events-auto flex items-center gap-0 {overlayActive ? 'nav-pill-compact' : ''}"
	>
		<!-- Wordmark -->
		<a
			href="/"
			data-testid="nav-wordmark"
			class="inline-flex min-h-11 items-center font-heading text-lg font-bold text-[var(--foreground)]"
		>
			<span data-testid="nav-wordmark-letters" bind:this={wordmarkEl}>yesid</span><span
				data-testid="nav-period"
				bind:this={dotEl}
				class="text-primary">.</span
			>
		</a>

		<!-- Divider + links: collapse when menu open -->
		<span class="nav-divider nav-collapsible {overlayActive ? 'nav-collapsed' : ''}" aria-hidden="true"></span>

		<div class="nav-links nav-collapsible {overlayActive ? 'nav-collapsed' : ''}">
			{#each headerLinks as link}
				<span
					class={link.priority === 2 ? 'hidden min-[480px]:block' : undefined}
					use:magnetic={{ strength: 6, radius: 50 }}
				>
					<a
						href={link.href}
						class="nav-pill-link inline-flex min-h-11 items-center px-1 transition-all {isActive(link.href)
							? 'text-primary nav-link-active'
							: 'text-secondary-foreground hover:text-primary hover:nav-link-glow active:text-primary'}"
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
			class="menu-toggle {overlayActive ? 'menu-toggle-open' : ''}"
			aria-label={overlayActive ? closeMenuAria : openMenuAria}
			onclick={toggleMenu}
		>
			<span class="menu-toggle-line menu-toggle-top"></span>
			<span class="menu-toggle-line menu-toggle-bottom"></span>
		</button>
	</div>

</nav>

<MenuOverlay open={menuOpen} {pathname} {menuItems} onclose={handleOverlayClose} onanimationdone={handleOverlayDone} />

<style>
	.nav-root {
		top: calc(1rem + env(safe-area-inset-top, 0px));
	}
	.nav-pill {
		background: color-mix(in srgb, var(--background) 92%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid color-mix(in srgb, var(--primary) 10%, transparent);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-nav);
		padding: 12px 28px;
		transition: padding var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default);
	}
	.nav-pill-compact {
		padding: 12px 20px;
		box-shadow: none;
		border-color: color-mix(in srgb, var(--primary) 15%, transparent);
	}

	.nav-divider {
		display: inline-block;
		width: 1px;
		height: 18px;
		background: color-mix(in srgb, var(--foreground) 8%, transparent);
		margin-inline: 20px;
		flex-shrink: 0;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 28px;
	}

	/* Collapse links + divider when menu opens, grow back on close */
	.nav-collapsible {
		overflow: hidden;
		transition: max-width var(--duration-slow) var(--ease-default), opacity var(--duration-normal) var(--ease-default), margin var(--duration-slow) var(--ease-default);
		max-width: 300px;
		opacity: 1;
	}
	.nav-collapsed {
		max-width: 0;
		opacity: 0;
		margin-inline: 0;
	}

	.nav-pill-link {
		font-size: 13.5px;
		font-weight: 500;
		white-space: nowrap;
	}

	:global(.nav-link-glow) {
		text-shadow: 0 0 8px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 20px color-mix(in srgb, var(--primary) 30%, transparent);
	}
	:global(.nav-link-active) {
		text-shadow: 0 0 8px color-mix(in srgb, var(--primary) 50%, transparent), 0 0 16px color-mix(in srgb, var(--primary) 20%, transparent);
	}

	/* Hamburger → ✕ morph */
	.menu-toggle {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		gap: 5px;
		padding: 4px;
		min-height: 44px;
		min-width: 44px;
		cursor: pointer;
		background: none;
		border: none;
	}
	.menu-toggle-line {
		display: block;
		height: 1.5px;
		border-radius: var(--radius-pill);
		background: var(--secondary-foreground);
		transition: transform var(--duration-normal) var(--ease-default), width var(--duration-normal) var(--ease-default), background var(--duration-fast);
		transform-origin: center;
	}
	.menu-toggle-top {
		width: 16px;
	}
	.menu-toggle-bottom {
		width: 11px;
	}
	.menu-toggle:hover .menu-toggle-line {
		background: var(--foreground);
	}

	/* Open state: morph to ✕ */
	.menu-toggle-open {
		z-index: var(--z-nav);
		position: relative;
	}
	.menu-toggle-open .menu-toggle-top {
		width: 16px;
		transform: translateY(3.25px) rotate(45deg);
	}
	.menu-toggle-open .menu-toggle-bottom {
		width: 16px;
		transform: translateY(-3.25px) rotate(-45deg);
	}
</style>
