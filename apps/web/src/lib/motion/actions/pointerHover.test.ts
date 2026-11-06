import { describe, expect, it, vi } from 'vitest';
import { pointerHover } from './pointerHover.js';

const pointer = (type: string, pointerType: string) => new PointerEvent(type, { pointerType });

describe('pointerHover', () => {
	it('reports mouse and pen hover', () => {
		const node = document.createElement('div');
		const onChange = vi.fn();
		const action = pointerHover(node, onChange);

		node.dispatchEvent(pointer('pointerenter', 'mouse'));
		expect(onChange).toHaveBeenLastCalledWith(true);
		node.dispatchEvent(pointer('pointerleave', 'mouse'));
		expect(onChange).toHaveBeenLastCalledWith(false);
		node.dispatchEvent(pointer('pointerenter', 'pen'));
		expect(onChange).toHaveBeenLastCalledWith(true);

		action.destroy();
	});

	it('ignores touch, whose synthetic hover would double-drive a tap', () => {
		const node = document.createElement('div');
		const onChange = vi.fn();
		const action = pointerHover(node, onChange);

		node.dispatchEvent(pointer('pointerenter', 'touch'));
		node.dispatchEvent(pointer('pointerleave', 'touch'));

		expect(onChange).not.toHaveBeenCalled();
		action.destroy();
	});

	it('uses the latest callback after update and stops after destroy', () => {
		const node = document.createElement('div');
		const first = vi.fn();
		const second = vi.fn();
		const action = pointerHover(node, first);

		action.update(second);
		node.dispatchEvent(pointer('pointerenter', 'mouse'));
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);

		action.destroy();
		node.dispatchEvent(pointer('pointerleave', 'mouse'));
		expect(second).toHaveBeenCalledTimes(1);
	});
});
