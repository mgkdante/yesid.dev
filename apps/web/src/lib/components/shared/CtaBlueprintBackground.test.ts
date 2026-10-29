import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CtaBlueprintBackground from './CtaBlueprintBackground.svelte';

describe('CtaBlueprintBackground', () => {
	it('composes one decorative, unfocusable shell of uniquely named sheets', () => {
		render(CtaBlueprintBackground);
		const background = screen.getByTestId('cta-blueprint-background');
		const names = [...background.querySelectorAll('[data-cta-sheet]')].map((sheet) => sheet.getAttribute('data-cta-sheet'));
		expect(background).toHaveAttribute('aria-hidden', 'true');
		expect(background.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
		expect(names.length).toBeGreaterThan(0);
		expect(new Set(names).size).toBe(names.length);
	});

});
