import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ContactPage from './ContactPage.svelte';

describe('ContactPage', () => {
	it('renders with data-testid page-contact', () => {
		render(ContactPage);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage);
		expect(screen.getByText(/CONTACT.*NEXT STOP/)).toBeTruthy();
	});
});
