import { afterEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import { gotoPreservingScroll, resetFocusAfterNavigation } from '#lib/utils/navigation-focus.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

afterEach(() => {
	vi.restoreAllMocks();
	vi.mocked(goto).mockReset();
	vi.useRealTimers();
	document.body.removeAttribute('tabindex');
	document.body.replaceChildren();
	getSelection()?.removeAllRanges();
});

function focusedButton() {
	const button = document.createElement('button');
	document.body.append(button);
	button.focus();
	return button;
}

describe('scroll-preserving navigation focus parity', () => {
	it('waits for navigation and resets body focus without scrolling', async () => {
		const button = focusedButton();
		const focus = vi.spyOn(document.body, 'focus');
		const scroll = vi.spyOn(window, 'scrollTo');
		let complete!: () => void;
		vi.mocked(goto).mockReturnValue(new Promise<void>((resolve) => { complete = resolve; }));
		const navigation = gotoPreservingScroll('/projects?tag=sql', { replaceState: true });
		expect(document.activeElement).toBe(button);
		expect(goto).toHaveBeenCalledExactlyOnceWith('/projects?tag=sql', { replaceState: true, reset: false });
		complete();
		await navigation;
		expect(document.activeElement).toBe(document.body);
		expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true, focusVisible: false });
		expect(document.body).not.toHaveAttribute('tabindex');
		expect(scroll).not.toHaveBeenCalled();
	});

	it('preserves an existing body tabindex', () => {
		document.body.setAttribute('tabindex', '0');
		focusedButton();
		resetFocusAfterNavigation()();
		expect(document.body).toHaveAttribute('tabindex', '0');
	});

	it('focuses the destination autofocus control without scrolling', () => {
		focusedButton();
		const reset = resetFocusAfterNavigation();
		const input = document.createElement('input');
		input.setAttribute('autofocus', '');
		document.body.append(input);
		const focus = vi.spyOn(input, 'focus');
		reset();
		expect(document.activeElement).toBe(input);
		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
	});

	it('respects focus explicitly moved during navigation', () => {
		focusedButton();
		const reset = resetFocusAfterNavigation();
		const destination = focusedButton();
		reset();
		expect(document.activeElement).toBe(destination);
	});

	it('does not reset focus if navigation fails', async () => {
		const button = focusedButton();
		vi.mocked(goto).mockRejectedValue(new Error('navigation aborted'));
		await expect(gotoPreservingScroll('/projects')).rejects.toThrow('navigation aborted');
		expect(document.activeElement).toBe(button);
	});

	it.each([false, true])('clears selection only when unchanged (changed=%s)', async (changed) => {
		vi.useFakeTimers();
		focusedButton();
		const text = document.createTextNode('selection');
		document.body.append(text);
		const range = document.createRange();
		range.setStart(text, 0);
		range.setEnd(text, 4);
		const selection = getSelection()!;
		selection.addRange(range);
		resetFocusAfterNavigation()();
		if (changed) range.setEnd(text, 6);
		await vi.runOnlyPendingTimersAsync();
		expect(selection.rangeCount).toBe(changed ? 1 : 0);
	});
});
