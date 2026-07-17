import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TerminalCursor from './TerminalCursor.svelte';

describe('TerminalCursor compatibility wrapper', () => {
	it('forwards the yesid.dev parity class onto the package cursor without adding DOM', () => {
		const { container } = render(TerminalCursor);
		const cursor = container.querySelector('[aria-hidden="true"]');

		expect(container.children).toHaveLength(1);
		expect(cursor?.classList.contains('terminal-cursor')).toBe(true);
		expect(cursor?.classList.contains('yesid-terminal-cursor')).toBe(true);
	});
});
