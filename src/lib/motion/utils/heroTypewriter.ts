/**
 * heroTypewriter — Typewriter text effect for the hero scroll prompt.
 * Character-by-character reveal. Cursor blink is CSS-driven via the
 * .typewriter-cursor class + @keyframes typewriter-blink (see app.css).
 * scrollPrompt opacity is owned by the hero timeline scrub.
 */

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
		const typeInterval = setInterval(() => {
			charIndex++;
			if (charIndex <= text.length) {
				scrollText.textContent = text.substring(0, charIndex);
			} else {
				clearInterval(typeInterval);
				startBlink();
				onComplete();
			}
		}, 80);
	}

	function showImmediate() {
		scrollText.textContent = text;
		startBlink();
	}

	return { startBlink, stopBlink, type, showImmediate, destroy: stopBlink };
}
