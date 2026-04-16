import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuOverlay from './MenuOverlay.svelte';

describe('MenuOverlay', () => {
	it('renders all 6 navigation links when open', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByRole('link', { name: /Services/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Projects/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Stack/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Blog/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /About/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Contact/ })).toBeInTheDocument();
	});

	it('marks the active link as current', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/projects' } });
		const projectsLink = screen.getByRole('link', { name: /Projects/ });
		expect(projectsLink).toHaveAttribute('aria-current', 'page');
	});

	it('renders metro subtitles', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByText('what I build')).toBeInTheDocument();
		expect(screen.getByText('open channel')).toBeInTheDocument();
	});

	it('has dialog role and aria-modal', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('renders bottom navigation label', () => {
		render(MenuOverlay, { props: { open: true, pathname: '/' } });
		expect(screen.getByText(/NAVIGATION/)).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(MenuOverlay, { props: { open: false, pathname: '/' } });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
