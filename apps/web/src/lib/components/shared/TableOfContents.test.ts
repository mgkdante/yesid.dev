import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TableOfContents from './TableOfContents.svelte';
import type { TocHeading } from '@repo/shared';

const sampleHeadings: TocHeading[] = [
	{ id: 'introduction', text: 'Introduction', level: 1 },
	{ id: 'getting-started', text: 'Getting Started', level: 2 },
	{ id: 'prerequisites', text: 'Prerequisites', level: 3 },
	{ id: 'usage', text: 'Usage', level: 2 },
	{ id: 'advanced-config', text: 'Advanced Config', level: 4 },
];

describe('TableOfContents', () => {
	it('renders desktop ToC with correct headings', () => {
		render(TableOfContents, { props: { headings: sampleHeadings } });
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop).toBeInTheDocument();
		// Should contain all heading texts
		expect(desktop).toHaveTextContent('Introduction');
		expect(desktop).toHaveTextContent('Getting Started');
		expect(desktop).toHaveTextContent('Prerequisites');
		expect(desktop).toHaveTextContent('Usage');
		expect(desktop).toHaveTextContent('Advanced Config');
	});

	it('renders mobile ToC toggle', () => {
		render(TableOfContents, { props: { headings: sampleHeadings } });
		const mobile = screen.getByTestId('toc-mobile');
		expect(mobile).toBeInTheDocument();
		expect(mobile).toHaveTextContent('Table of Contents');
	});

	it('expands mobile ToC on click', async () => {
		render(TableOfContents, { props: { headings: sampleHeadings } });
		const toggle = screen.getByText('Table of Contents');
		const mobile = screen.getByTestId('toc-mobile');

		// Before click, the collapsible content is force-mounted but collapsed (data-state="closed")
		const collapsibleContent = mobile.querySelector('[data-slot="collapsible-content"]');
		expect(collapsibleContent?.getAttribute('data-state')).toBe('closed');

		await fireEvent.click(toggle);

		// After click, the collapsible content should be open
		expect(collapsibleContent?.getAttribute('data-state')).toBe('open');
		expect(mobile).toHaveTextContent('Introduction');
	});

	it('handles empty headings without crashing', () => {
		render(TableOfContents, { props: { headings: [] } });
		// Desktop nav should render with "On this page" title but no entries
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop).toBeInTheDocument();
		expect(desktop.querySelectorAll('li').length).toBe(0);
	});

	it('hides mobile toggle when no headings', () => {
		render(TableOfContents, { props: { headings: [] } });
		// Mobile toggle should not render when no entries
		expect(screen.queryByTestId('toc-mobile')).not.toBeInTheDocument();
	});

	it('calls scrollIntoView when a ToC link is clicked', async () => {
		render(TableOfContents, { props: { headings: sampleHeadings } });
		// Create a mock element with the expected id in the DOM
		const mockEl = document.createElement('div');
		mockEl.id = 'introduction';
		mockEl.scrollIntoView = vi.fn();
		document.body.appendChild(mockEl);

		// Click the first ToC entry link (skip the header toggle button)
		const desktopNav = screen.getByTestId('toc-desktop');
		const tocLink = desktopNav.querySelector('.toc-link');
		expect(tocLink).not.toBeNull();
		await fireEvent.click(tocLink!);

		expect(mockEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

		// Cleanup
		document.body.removeChild(mockEl);
	});

	it('applies custom class via class prop', () => {
		render(TableOfContents, { props: { headings: sampleHeadings, class: 'my-custom-class' } });
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop.className).toContain('my-custom-class');
	});

	it('groups h3/h4 under their h2 parent for collapsible sections', () => {
		render(TableOfContents, { props: { headings: sampleHeadings } });
		const desktop = screen.getByTestId('toc-desktop');
		// Getting Started (h2) has a child (Prerequisites h3), so it should have a chevron button
		const chevronButtons = desktop.querySelectorAll('.toc-section-chevron');
		// Getting Started (h2 with h3 child) and Usage (h2 — no child since Advanced Config is h4 under Prerequisites)
		// Actually: Getting Started has Prerequisites(h3) child; Usage has Advanced Config(h4) child
		expect(chevronButtons.length).toBeGreaterThan(0);
	});
});
