/**
 * heroTypewriter — Typewriter text effect + cursor blink for hero scroll prompt.
 * Manages character-by-character reveal and blinking block cursor.
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
	let blinkInterval: ReturnType<typeof setInterval> | undefined;

	function startBlink() {
		if (blinkInterval) return;
		if (scrollPrompt) {
			scrollPrompt.style.opacity = '1';
			scrollText.textContent = text;
			scrollCursorEl.style.opacity = '1';
		}
		let cursorVisible = true;
		blinkInterval = setInterval(() => {
			cursorVisible = !cursorVisible;
			if (scrollCursorEl) {
				scrollCursorEl.style.opacity = cursorVisible ? '1' : '0';
			}
		}, 500);
	}

	function stopBlink() {
		if (blinkInterval) {
			clearInterval(blinkInterval);
			blinkInterval = undefined;
		}
	}

	function type(onComplete: () => void) {
		scrollText.textContent = '';
		scrollCursorEl.style.opacity = '1';
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
