import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('renders a footer element', () => {
		render(Footer);
		expect(screen.getByTestId('footer')).toBeInTheDocument();
	});

	it('renders the brand name', () => {
		render(Footer);
		expect(screen.getByText(/yesid/)).toBeInTheDocument();
	});

	it('renders the current year', () => {
		render(Footer);
		const year = new Date().getFullYear().toString();
		expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
	});

	it('renders a GitHub link with correct href', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /github/i });
		expect(link).toHaveAttribute('href', 'https://github.com/mgkdante');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});

	it('renders a LinkedIn link with correct href', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /linkedin/i });
		expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/otaloray/');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});
});
