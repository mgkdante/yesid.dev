import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Home page smoke test', () => {
	it('renders the app root', () => {
		render(Page);
		expect(screen.getByTestId('app-root')).toBeInTheDocument();
	});

	it('renders the heading', () => {
		render(Page);
		// h1 contains "yesid" + an orange <span> "." — use role query to avoid
		// exact text match fragility from child elements.
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('renders the tagline', () => {
		render(Page);
		expect(screen.getByText('Data infrastructure that moves.')).toBeInTheDocument();
	});
});
