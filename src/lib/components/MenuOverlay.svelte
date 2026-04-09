<!--
  Fullscreen metro dashboard menu overlay.
  Vertical metro line with stop dots for each nav item.
  CSS transition open/close. Escape key closes.
-->
<script lang="ts">
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { menuItems } from '$lib/data';

	let {
		open = false,
		pathname = '/',
		onclose,
		onanimationdone
	}: {
		open: boolean;
		pathname: string;
		onclose?: () => void;
		onanimationdone?: () => void;
	} = $props();

	let overlayEl: HTMLElement = $state(null!);

	// visible keeps the DOM alive during close animation
	let visible = $state(false);
	// entering = true while overlay renders invisible (scaleY 0), removed next frame to trigger transition
	let entering = $state(false);
	let closing = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function handleClose() {
		onclose?.();
	}

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') handleClose();
	}

	// Scroll lock — no position:fixed on body (breaks nested fixed on mobile)
	let savedScrollY = 0;

	function lockScroll() {
		if (typeof document === 'undefined') return;
		savedScrollY = window.scrollY;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
	}

	function unlockScroll() {
		if (typeof document === 'undefined') return;
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
	}

	// React to open/close
	$effect(() => {
		if (open) {
			entering = true; // Set before visible so overlay renders hidden
			visible = true;
			closing = false;
			lockScroll();
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
		// Only react to the overlay's own transitions, not children bubbling up
		if (closing && e.target === overlayEl && e.propertyName === 'transform') {
			finishClose();
		}
	}

	function finishClose() {
		if (!visible) return; // Already closed
		visible = false;
		closing = false;
		entering = false;
		unlockScroll();
		onanimationdone?.();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if visible}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		class="menu-overlay"
		class:entering
		class:closing
		bind:this={overlayEl}
		ontransitionend={handleTransitionEnd}
	>
		<!-- Metro line with stops -->
		<nav class="menu-content">
			{#each menuItems as item, i}
				<a
					data-menu-item
					href={item.href}
					class="menu-item {isActive(item.href) ? 'menu-item-active' : ''}"
					aria-current={isActive(item.href) ? 'page' : undefined}
					onclick={handleClose}
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
						<span class="menu-subtitle">{item.subtitle.en}</span>
					</span>
				</a>
			{/each}
		</nav>

		<!-- Bottom label -->
		<div class="menu-footer">
			<span class="menu-footer-line"></span>
			<span class="menu-footer-label">NAVIGATION &mdash; ALL ROUTES</span>
			<span class="menu-footer-line"></span>
		</div>
	</div>
{/if}

<style>
	/* ── Overlay base ── */
	.menu-overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--bg-primary);
		background-image: radial-gradient(ellipse at 50% 0%, rgba(224, 120, 0, 0.04) 0%, transparent 60%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 24px 40px;
		overscroll-behavior: contain;
		touch-action: none;

		/* Open state (default when visible) */
		opacity: 1;
		transform: scaleY(1);
		transform-origin: top center;
		transition: opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
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
		transition: opacity 0.2s ease-in, transform 0.25s cubic-bezier(0.32, 0, 0.67, 0);
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
			opacity 0.2s ease-out calc(var(--item-index) * 0.04s),
			transform 0.2s ease-out calc(var(--item-index) * 0.04s),
			color 0.15s;
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
		border: 2px solid rgba(255, 255, 255, 0.2);
		margin-top: 5px;
		transition: border-color 0.15s;
	}
	.menu-stop-active {
		border-color: #E07800;
		box-shadow: 0 0 12px rgba(224, 120, 0, 0.4);
	}
	.menu-stop-fill {
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background: #E07800;
	}

	/* Hover: fill the stop */
	.menu-item:hover .menu-stop {
		border-color: #E07800;
	}

	/* Vertical metro line between stops */
	.menu-line {
		position: absolute;
		left: 6px;
		top: 33px;
		bottom: -14px;
		width: 2px;
		background: rgba(255, 255, 255, 0.06);
	}
	.menu-line-active {
		background: linear-gradient(to bottom, rgba(224, 120, 0, 0.4), rgba(255, 255, 255, 0.06));
	}

	/* Text block */
	.menu-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.menu-label {
		font-family: 'Inter', sans-serif;
		font-size: 24px;
		font-weight: 600;
		color: #ccc;
		transition: color 0.15s, text-shadow 0.15s;
	}
	.menu-item-active .menu-label {
		color: #E07800;
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.5);
	}
	.menu-item:hover .menu-label {
		color: #E07800;
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.6), 0 0 20px rgba(224, 120, 0, 0.3);
	}

	.menu-subtitle {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: #666;
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
		background: rgba(224, 120, 0, 0.2);
	}
	.menu-footer-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 3px;
		color: rgba(224, 120, 0, 0.5);
		white-space: nowrap;
	}
</style>
