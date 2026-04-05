import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SectionHeader from './SectionHeader.svelte';

describe('SectionHeader', () => {
	it('renders the title as an h2', () => {
		render(SectionHeader, { props: { title: 'Projects' } });
		expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument();
	});

	it('renders subtitle when provided', () => {
		render(SectionHeader, { props: { title: 'Services', subtitle: 'What I offer' } });
		expect(screen.getByText('What I offer')).toBeInTheDocument();
	});

	it('does not render subtitle when omitted', () => {
		render(SectionHeader, { props: { title: 'About' } });
		// Only the heading — no extra paragraph element
		expect(screen.queryByTestId('section-header')?.querySelectorAll('p')).toHaveLength(0);
	});

	it('handles a very long title without error', () => {
		const longTitle = 'A '.repeat(50).trim();
		render(SectionHeader, { props: { title: longTitle } });
		expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
	});
});
