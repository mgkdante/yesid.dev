import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Fixture from './_persisted-bind-fixture.svelte';

describe('persisted().value bindability', () => {
	it('is two-way bindable via bind:value (no closure shim needed)', async () => {
		render(Fixture);
		const input = screen.getByTestId('bind-input') as HTMLInputElement;

		// write through the binding → the rune updates
		await fireEvent.input(input, { target: { value: 'svelte' } });
		expect(screen.getByTestId('bind-echo').textContent).toBe('svelte');
		expect(input.value).toBe('svelte');
	});
});
