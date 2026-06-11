<!--
  Fullscreen metro dashboard menu overlay.
  Vertical metro line with stop dots for each nav item.
  CSS transition open/close. ESC/focus-trap via bits-ui Dialog.
-->
<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { menuItems as staticMenuItems, sharedChromeContent } from '$lib/content';
	import { resolveLocale } from '$lib/utils/locale';
	import type { NavLink } from '$lib/content/nav';

	const dialogTitle = resolveLocale(sharedChromeContent.menuOverlayAria, 'en');
	const footerLabel = resolveLocale(sharedChromeContent.menuOverlayFooterLabel, 'en');
	let {
		open = false,
		pathname = '/',
		menuItems = staticMenuItems as readonly NavLink[],
		onclose,
		onanimationdone
	}: {
		open: boolean;
		pathname: string;
		menuItems?: readonly NavLink[];
		onclose?: () => void;
		onanimationdone?: () => void;
	} = $props();

	let overlayEl: HTMLElement = $state(null!);

	// visible keeps the DOM alive during close animation.
	// Dialog uses visible (not open) so focus trap + scroll lock persist through close animation.
	let visible = $state(false);
	let entering = $state(false);
	let closing = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
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
							href={item.href}
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
								<span class="menu-label">{item.label.en}</span>
								<span class="menu-subtitle">{item.subtitle?.en ?? ''}</span>
							</span>
						</a>
					{/each}
				</nav>

				<!-- Bottom label -->
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
		justify-content: center;
		padding: calc(80px + env(safe-area-inset-top, 0px)) 24px calc(40px + env(safe-area-inset-bottom, 0px));
		overscroll-behavior: contain;
		touch-action: none;

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
		font-size: 24px;
		font-weight: 600;
		color: var(--secondary-foreground);
		transition: color var(--duration-fast), text-shadow var(--duration-fast);
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
		font-size: 11px;
		color: var(--muted-foreground);
		letter-spacing: 0.3px;
	}

	/* Footer */
	.menu-footer {
		position: absolute;
		bottom: 32px;
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
		font-size: 10px;
		letter-spacing: 3px;
		color: color-mix(in srgb, var(--primary) 85%, transparent);
		white-space: nowrap;
	}
</style>
