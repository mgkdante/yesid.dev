<!--
  Floating pill navigation. Centered at top: 16px, full-capsule shape.
  Three primary links. Menu toggle for overlay (Task 4).
  Wordmark letters animated via GSAP SplitText on hover (4 rotating effects).
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { wordmarkHover, magnetic } from '$lib/motion/actions';
	import { sharedChromeContent, navLinks as staticNavLinks } from '$lib/content';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { delocalizePath, localizeHref } from '$lib/utils/locale-routing';
	import MenuOverlay from './MenuOverlay.svelte';
	import type { NavLink } from '$lib/content/nav';
	import type { Locale } from '$lib/types';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguageToggle from './LanguageToggle.svelte';

	let {
		pathname = '/',
		url = new URL('https://yesid.dev/'),
		locale = DEFAULT_LOCALE,
		headerLinks = staticNavLinks as readonly NavLink[],
		menuItems = [] as readonly NavLink[],
	}: {
		pathname?: string;
		/** Full current URL — threaded to LanguageToggle so the switch keeps query + hash. */
		url?: URL;
		locale?: Locale;
		headerLinks?: readonly NavLink[];
		menuItems?: readonly NavLink[];
	} = $props();

	// $derived (not const): Nav never remounts; locale changes on /fr↔/ navigation.
	const openMenuAria = $derived(resolveLocale(sharedChromeContent.openMenuAria, locale));
	const closeMenuAria = $derived(resolveLocale(sharedChromeContent.closeMenuAria, locale));
	// isActive compares the canonical (delocalized) pathname so /fr/projects
	// activates the same link as /projects.
	const basePath = $derived(delocalizePath(pathname));

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
		if (href === '/') return basePath === '/';
		return basePath.startsWith(href);
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
		<!-- Wordmark — .nav-wordmark guarantees "yesid." never wraps (go2/w5) -->
		<a
			href={localizeHref('/', locale)}
			data-testid="nav-wordmark"
			class="nav-wordmark inline-flex min-h-11 items-center font-heading font-bold text-[var(--foreground)]"
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
						href={localizeHref(link.href, locale)}
						class="nav-pill-link inline-flex min-h-11 items-center px-1 transition-all {isActive(link.href)
							? 'text-primary nav-link-active'
							: 'text-secondary-foreground hover:text-primary hover:nav-link-glow active:text-primary'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{resolveLocale(link.label, locale)}
					</a>
				</span>
			{/each}
		</div>

		<!-- Divider -->
		<span class="nav-divider" aria-hidden="true"></span>

		<!-- Language toggle — métro DIRECTION blind; renders only when ≥2 locales are published.
		     Persistent (stays visible above the open menu sheet) — it is the SINGLE locale switcher;
		     the sheet's own EN|FR switch was removed to kill the double. -->
		<LanguageToggle {locale} {url} />

		<!-- Theme toggle (GO-W2.2) -->
		<ThemeToggle {locale} />

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

<MenuOverlay open={menuOpen} {pathname} {locale} {menuItems} onclose={handleOverlayClose} onanimationdone={handleOverlayDone} />

<style>
	.nav-root {
		top: calc(1rem + env(safe-area-inset-top, 0px));
	}
	/* Taste round 2: the wayfinding chrome joins the brand grid — the pill
	   border speaks the same bold brand-border as cards (was a 10% ghost) and
	   the internal dividers are orange delimitations, not foreground smudges.
	   Round 3: the grid draws at 2px (pill + divider step up with cards). */
	.nav-pill {
		background: color-mix(in srgb, var(--background) 92%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-nav);
		padding: 12px 28px;
		transition: padding var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default);
	}
	.nav-pill-compact {
		padding: 12px 20px;
		box-shadow: none;
		border-color: var(--border-brand-active);
	}

	/* Wordmark sizing lives here (not a Tailwind text-* utility) so the
	   mobile compaction tiers below can shrink it. nowrap + flex-shrink: 0
	   guarantee "yesid." NEVER wraps — the SplitText letter spans inherit
	   the anchor's content-box width, so they stay on one line too. */
	.nav-wordmark {
		font-size: 18px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.nav-divider {
		display: inline-block;
		width: 2px;
		height: 18px;
		background: var(--border-brand);
		margin-inline: 20px;
		flex-shrink: 0;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 28px;
	}

	/* go2/w5 mobile compaction — the pill previously kept its desktop paddings
	   (12/28) + 20px divider margins + 28px link gaps at every width, which
	   overflowed below ~450px and let the wordmark wrap. Two tiers: phones
	   get a visibly smaller pill, sub-480 (where the priority-2 link is
	   already hidden) tightens further. Interactive hit areas stay 44px. */
	/* Mobile compaction tiers — squeeze decorative spacing (padding, divider
	   margins, link gaps), NEVER the 44px tap targets. Retightened in slice-30
	   after the LanguageToggle became a 3rd pill control (was overflowing the
	   floating pill at 320–480px). */
	@media (max-width: 767px) {
		.nav-pill {
			padding: 8px 16px;
		}
		.nav-pill-compact {
			padding: 8px 14px;
		}
		.nav-wordmark {
			font-size: 17px;
		}
		.nav-divider {
			margin-inline: 10px;
		}
		.nav-links {
			gap: 18px;
		}
		.nav-pill-link {
			font-size: 13px;
		}
	}

	@media (max-width: 479px) {
		.nav-pill {
			padding: 6px 8px;
		}
		.nav-pill-compact {
			padding: 6px 8px;
		}
		.nav-wordmark {
			font-size: 16px;
		}
		.nav-divider {
			margin-inline: 4px;
		}
		.nav-links {
			gap: 7px;
		}
		.nav-pill-link {
			font-size: 12.5px;
		}
	}

	/* Tightest tier (320–359px): the three 44px toggles + two links leave very
	   little room — squeeze the decorative spacing, never the hit areas. */
	@media (max-width: 359px) {
		.nav-pill {
			padding: 6px 6px;
		}
		.nav-pill-compact {
			padding: 6px 6px;
		}
		.nav-wordmark {
			font-size: 15px;
		}
		.nav-divider {
			margin-inline: 2px;
		}
		/* Drop the second (links↔toggles) divider entirely at the tightest tier —
		   reclaims a few more px so the pill clears 320px with margin to spare
		   even under CI's slightly wider font metrics. The wordmark↔links divider
		   stays for wayfinding. */
		.nav-divider:not(.nav-collapsible) {
			display: none;
		}
		.nav-links {
			gap: 4px;
		}
		.nav-pill-link {
			font-size: 12px;
		}
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

	/* GO-w2t5 retier: the menu-open link collapse is a width/opacity slide —
	   MOTION-GATED; snap instead of sliding under reduce. */
	@media (prefers-reduced-motion: reduce) {
		.nav-collapsible {
			transition: none;
		}
	}

	.nav-pill-link {
		font-size: 13.5px;
		font-weight: 500;
		white-space: nowrap;
		position: relative;
	}

	/* GO2-W5 "you are here" lamp: the active link gets an amber wayfinding
	   dot (absolute — zero layout shift). Underline/hover voice stays
	   primary; the dot is indicator-only, never the interactive hue. */
	.nav-pill-link[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 4px;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		transform: translateX(-50%);
		background: var(--accent);
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
