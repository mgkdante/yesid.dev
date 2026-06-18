import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BlogEntryRail from './BlogEntryRail.svelte';
import type { BlogPageContent } from '@repo/shared';

const rail = {
	workWithMe: {
		title: { en: 'Work With Me' },
		prompt: { en: 'Need a system that stays editable?' },
		primary: { label: { en: 'View Services' }, href: '/services' },
		secondary: { label: { en: 'Start a Project' }, href: '/contact' },
	},
	routes: {
		title: { en: 'Pick A Route' },
		links: [
			{ label: { en: 'About the author' }, href: '/about' },
			{ label: { en: 'Case studies' }, href: '/projects' },
			{ label: { en: 'Services' }, href: '/services' },
			{ label: { en: 'Stack' }, href: '/tech-stack' },
			{ label: { en: 'Contact' }, href: '/contact' },
		],
	},
} satisfies BlogPageContent['entryRail'];

describe('BlogEntryRail', () => {
	it('renders CMS-backed Work With Me copy and CTA links', () => {
		render(BlogEntryRail, { props: { rail } });

		expect(screen.getByText('Work With Me')).toBeInTheDocument();
		expect(screen.getByText('Need a system that stays editable?')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'View Services' })).toHaveAttribute('href', '/services');
		expect(screen.getByRole('link', { name: 'Start a Project' })).toHaveAttribute('href', '/contact');
	});

	it('renders guided route links from CMS data without cloning the full nav', () => {
		render(BlogEntryRail, { props: { rail } });

		expect(screen.getByText('Pick A Route')).toBeInTheDocument();
		const routeLinks = screen.getAllByTestId('blog-entry-route');
		expect(routeLinks[0]).toHaveTextContent('About the author');
		expect(routeLinks[0]).toHaveAttribute('href', '/about');
		expect(screen.getByRole('link', { name: 'Case studies' })).toHaveAttribute('href', '/projects');
		expect(screen.getByRole('link', { name: 'Stack' })).toHaveAttribute('href', '/tech-stack');
		expect(routeLinks).toHaveLength(5);
	});
});
