// Report real hover from mouse and pen. Touch fires enter/leave around a tap, which
// the surface's click handler already owns; counting both would double-drive a morph.

export type PointerHoverCallback = (hovering: boolean) => void;

export function pointerHover(node: HTMLElement, onChange: PointerHoverCallback) {
	let callback = onChange;

	function handleEnter(event: PointerEvent) {
		if (event.pointerType !== 'touch') callback(true);
	}

	function handleLeave(event: PointerEvent) {
		if (event.pointerType !== 'touch') callback(false);
	}

	node.addEventListener('pointerenter', handleEnter);
	node.addEventListener('pointerleave', handleLeave);

	return {
		update(next: PointerHoverCallback) {
			callback = next;
		},
		destroy() {
			node.removeEventListener('pointerenter', handleEnter);
			node.removeEventListener('pointerleave', handleLeave);
		},
	};
}
