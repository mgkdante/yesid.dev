/**
 * heroTypewriter — Typewriter text effect for the hero scroll prompt.
 * Character-by-character reveal. Cursor blink is CSS-driven via the
 * .typewriter-cursor class + @keyframes typewriter-blink (see app.css).
 * scrollPrompt opacity is owned by the hero timeline scrub.
 *
 * Character advance runs through the shared gsap.ticker (17e-5) so the
 * whole site ticks from a single RAF callback. A deltaTime accumulator
 * advances one character every ~80ms of wall-clock time.
 */

import { subscribe, unsubscribe } from './ticker.js';

const CHAR_INTERVAL_SEC = 0.08; // seconds between characters (was 80ms setInterval)
let typewriterIdCounter = 0;

export interface TypewriterControls {
	startBlink: () => void;
	stopBlink: () => void;
	type: (onComplete: () => void) => void;
	showImmediate: () => void;
	destroy: () => void;
}

export function createTypewriter(
	scrollPrompt: HTMLParagraphElement,
	scrollText: HTMLSpanElement,
	scrollCursorEl: HTMLSpanElement,
	text: string,
): TypewriterControls {
	// Unique per instance so multiple typewriters on the same page (should
	// never happen today, but cheap insurance) don't collide on the ticker.
	const subscriptionId = `typewriter-${++typewriterIdCounter}`;

	function startBlink() {
		scrollText.textContent = text;
		scrollCursorEl.classList.add('typewriter-cursor');
	}

	function stopBlink() {
		scrollCursorEl.classList.remove('typewriter-cursor');
	}

	function type(onComplete: () => void) {
		scrollText.textContent = '';
		scrollCursorEl.classList.add('typewriter-cursor');
		let charIndex = 0;
		let accum = 0;

		subscribe(subscriptionId, (_time, deltaTime) => {
			accum += deltaTime;
			// While-loop handles frame spikes (backgrounded tabs) — catches the
			// animation up to where wall-clock time says it should be.
			while (accum >= CHAR_INTERVAL_SEC && charIndex < text.length) {
				accum -= CHAR_INTERVAL_SEC;
				charIndex++;
				scrollText.textContent = text.substring(0, charIndex);
			}
			if (charIndex >= text.length) {
				unsubscribe(subscriptionId);
				startBlink();
				onComplete();
			}
		});
	}

	function showImmediate() {
		scrollText.textContent = text;
		startBlink();
	}

	function destroy() {
		unsubscribe(subscriptionId);
		stopBlink();
	}

	return { startBlink, stopBlink, type, showImmediate, destroy };
}
