<!--
  Fullscreen metro dashboard menu overlay.
  Vertical metro line with stop dots for each nav item.
  CSS transition open/close. ESC/focus-trap via bits-ui Dialog.
-->
<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { menuItems as staticMenuItems, siteLabels } from '$lib/content';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { delocalizePath, localizeHref } from '$lib/utils/locale-routing';
	import type { NavLink } from '$lib/navigation/types';
	import type { Locale } from '$lib/types';

	let {
		open = false,
		pathname = '/',
		locale = DEFAULT_LOCALE,
		menuItems = staticMenuItems as readonly NavLink[],
		onclose,
		onanimationdone
	}: {
		open: boolean;
		pathname: string;
		locale?: Locale;
		menuItems?: readonly NavLink[];
		onclose?: () => void;
		onanimationdone?: () => void;
	} = $props();

	// $derived (not const): the overlay rides the persistent Nav — it never
	// remounts, and locale changes on /fr↔/ navigation.
	const sharedChrome = siteLabels.navChrome.shared;
	const dialogTitle = $derived(resolveLocale(sharedChrome.menuOverlayAria, locale));
	const footerLabel = $derived(resolveLocale(sharedChrome.menuOverlayFooterLabel, locale));
	const basePath = $derived(delocalizePath(pathname));

	let overlayEl: HTMLElement = $state(null!);

	// visible keeps the DOM alive during close animation.
	// Dialog uses visible (not open) so focus trap + scroll lock persist through close animation.
	let visible = $state(false);
	let entering = $state(false);
	let closing = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return basePath === '/';
		return basePath.startsWith(href);
	}

	// React to open/close from parent
	$effect(() => {
		if (open) {
			entering = true;
			visible = true;
			closing = false;
		} else if (visible && !closing) {
			closing = true;
			if (isPrefersReducedMotion()) {
				finishClose();
			}
		}
	});

	// After overlay DOM renders with entering class, remove it to trigger CSS transition
	$effect(() => {
		if (!entering || closing || !overlayEl) return;

		if (isPrefersReducedMotion()) {
			entering = false;
			return;
		}

		const timer = setTimeout(() => { entering = false; }, 30);
		return () => clearTimeout(timer);
	});

	// Safety timeout: if transitionend doesn't fire, close anyway
	$effect(() => {
		if (!closing) return;
		const timer = setTimeout(finishClose, 500);
		return () => clearTimeout(timer);
	});

	function handleTransitionEnd(e: TransitionEvent) {
		if (closing && e.target === overlayEl && e.propertyName === 'transform') {
			finishClose();
		}
	}

	function finishClose() {
		if (!visible) return;
		visible = false;
		closing = false;
		entering = false;
		onanimationdone?.();
	}

	// Dialog ESC / overlay click → notify parent to close
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) onclose?.();
	}
</script>

<!-- Dialog.Root bound to visible so focus trap + scroll lock persist through close animation -->
<DialogPrimitive.Root open={visible} onOpenChange={handleOpenChange}>
	{#if visible}
		<DialogPrimitive.Portal>
			<DialogPrimitive.Content>
				{#snippet child({ props })}
					<div
						{...props}
						class="menu-overlay {entering ? 'entering' : ''} {closing ? 'closing' : ''}"
						bind:this={overlayEl}
						ontransitionend={handleTransitionEnd}
					>
						<DialogPrimitive.Title class="sr-only">{dialogTitle}</DialogPrimitive.Title>

						<!-- Metro line with stops -->
						<nav class="menu-content">
					{#each menuItems as item, i}
						<a
							data-menu-item
							href={localizeHref(item.href, locale)}
							class="menu-item {isActive(item.href) ? 'menu-item-active' : ''}"
							aria-current={isActive(item.href) ? 'page' : undefined}
							onclick={() => onclose?.()}
							style="--item-index: {i}"
						>
							<!-- Metro stop dot -->
							<span class="menu-stop {isActive(item.href) ? 'menu-stop-active' : ''}">
								{#if isActive(item.href)}
									<span class="menu-stop-fill"></span>
								{/if}
							</span>

							<!-- Vertical connector line (not after last item) -->
							{#if i < menuItems.length - 1}
								<span class="menu-line {isActive(item.href) ? 'menu-line-active' : ''}"></span>
							{/if}

							<!-- Text -->
							<span class="menu-text">
								<span class="menu-label">{resolveLocale(item.label, locale)}</span>
								<span class="menu-subtitle">{item.subtitle ? resolveLocale(item.subtitle, locale) : ''}</span>
							</span>
						</a>
					{/each}
				</nav>

				<!-- Bottom label + locale switch (slice-28.6; hidden until 2+ published locales).
				     go2/w5: the duplicate theme toggle is gone — the nav pill (which stays
				     visible above the sheet) owns the only theme toggle. -->
				<div class="menu-footer">
					<span class="menu-footer-line"></span>
					<span class="menu-footer-label">{footerLabel}</span>
					<span class="menu-footer-line"></span>
				</div>
					</div>
				{/snippet}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	{/if}
</DialogPrimitive.Root>

<style>
	/* ── Overlay base ── */
	.menu-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-menu);
		background: var(--background);
		background-image: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--primary) 4%, transparent) 0%, transparent 60%);
		display: flex;
		flex-direction: column;
		align-items: center;
		/* Top-align (not center) so the menu options ALWAYS begin below the
		   floating nav pill. Centering let the top item ride up under the pill
		   on short screens. The top padding reserves the shared nav clearance;
		   overflow-y:auto + pan-y lets a tall list (large text / long locale)
		   scroll rather than collide with the pill. */
		justify-content: flex-start;
		padding: calc(var(--nav-clearance, 5.5rem) + env(safe-area-inset-top, 0px)) 24px calc(56px + env(safe-area-inset-bottom, 0px));
		overflow-y: auto;
		overscroll-behavior: contain;
		touch-action: pan-y;

		/* Open state (default when visible) */
		opacity: 1;
		transform: scaleY(1);
		transform-origin: top center;
		transition: opacity var(--duration-normal) var(--ease-default), transform var(--duration-slow) cubic-bezier(0.33, 1, 0.68, 1);
	}

	/* Entering: render invisible, no transition (painted first, then class removed → transitions in) */
	.menu-overlay.entering {
		opacity: 0;
		transform: scaleY(0);
		transition: none;
	}

	/* Closing: transition to invisible */
	.menu-overlay.closing {
		opacity: 0;
		transform: scaleY(0);
		transition: opacity var(--duration-normal) ease-in, transform var(--duration-normal) cubic-bezier(0.32, 0, 0.67, 0);
	}

	/* ── Menu items: stagger via CSS custom property ── */
	.menu-item {
		display: flex;
		align-items: flex-start;
		gap: 20px;
		padding-block: 14px;
		text-decoration: none;
		position: relative;

		opacity: 1;
		transform: translateY(0);
		transition:
			opacity var(--duration-normal) var(--ease-default) calc(var(--item-index) * 0.04s),
			transform var(--duration-normal) var(--ease-default) calc(var(--item-index) * 0.04s),
			color var(--duration-fast);
	}

	/* Items hidden during entrance */
	.menu-overlay.entering .menu-item {
		opacity: 0;
		transform: translateY(16px);
		transition: none;
	}

	/* Items hidden during close (reverse stagger not needed — overlay scales) */
	.menu-overlay.closing .menu-item {
		opacity: 0;
		transform: translateY(-8px);
		transition:
			opacity 0.12s ease-in calc(var(--item-index) * 0.02s),
			transform 0.12s ease-in calc(var(--item-index) * 0.02s);
	}

	.menu-content {
		display: flex;
		flex-direction: column;
		gap: 0;
		position: relative;
	}

	/* Stop dot container */
	.menu-stop {
		position: relative;
		flex-shrink: 0;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid var(--border-subtle);
		margin-top: 5px;
		transition: border-color var(--duration-fast);
	}
	.menu-stop-active {
		border-color: var(--primary);
		box-shadow: 0 0 12px color-mix(in srgb, var(--primary) 40%, transparent);
	}
	.menu-stop-fill {
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background: var(--primary);
	}

	/* Hover: fill the stop */
	.menu-item:hover .menu-stop {
		border-color: var(--primary);
	}

	/* Vertical metro line between stops */
	.menu-line {
		position: absolute;
		left: 6px;
		top: 33px;
		bottom: -14px;
		width: 2px;
		background: color-mix(in srgb, var(--foreground) 6%, transparent);
	}
	.menu-line-active {
		background: linear-gradient(to bottom, color-mix(in srgb, var(--primary) 40%, transparent), color-mix(in srgb, var(--foreground) 6%, transparent));
	}

	/* Text block */
	.menu-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.menu-label {
		font-family: var(--font-heading);
		font-size: var(--text-menu-label-mobile);
		font-weight: 600;
		color: var(--secondary-foreground);
		transition: color var(--duration-fast), text-shadow var(--duration-fast);
	}

	@media (min-width: 768px) {
		.menu-label {
			font-size: var(--text-menu-label-desktop);
		}
	}
	.menu-item-active .menu-label {
		color: var(--primary);
		text-shadow: 0 0 8px color-mix(in srgb, var(--primary) 50%, transparent);
	}
	.menu-item:hover .menu-label {
		color: var(--primary);
		text-shadow: 0 0 8px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 20px color-mix(in srgb, var(--primary) 30%, transparent);
	}

	.menu-subtitle {
		font-family: var(--font-mono);
		font-size: var(--text-menu-subtitle);
		color: var(--muted-foreground);
		letter-spacing: 0;
	}

	/* Footer */
	.menu-footer {
		/* In-flow (margin-top:auto pushes it to the bottom) instead of absolute,
		   so it can never overlap the last menu item now that the list is
		   top-aligned + scrollable. */
		margin-top: auto;
		padding-top: 24px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.menu-footer-line {
		width: 40px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.menu-footer-label {
		font-family: var(--font-mono);
		font-size: var(--text-menu-subtitle);
		letter-spacing: 0;
		color: color-mix(in srgb, var(--primary) 85%, transparent);
		white-space: nowrap;
	}

	/* Desktop: the flex-start top-align + nav-clearance padding is a small-screen
	   guard so the menu options never ride up under the floating nav pill. Desktop
	   has the vertical room, so center the links and pin the footer to the bottom
	   (restores the pre-mobile-sweep desktop layout). Placed after the base rules
	   so source order wins; the footer override cancels the mobile margin-top:auto
	   that would otherwise eat the free space and defeat justify-content. */
	@media (min-width: 768px) {
		.menu-overlay {
			justify-content: center;
		}
		.menu-footer {
			position: absolute;
			bottom: 32px;
			margin-top: 0;
			padding-top: 0;
		}
	}

</style>
