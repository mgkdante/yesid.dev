import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TableOfContents from './TableOfContents.svelte';

const sampleHtml = `
<h1>Introduction</h1>
<p>Some text here.</p>
<h2>Getting Started</h2>
<p>More text.</p>
<h3>Prerequisites</h3>
<p>Even more text.</p>
<h2>Usage</h2>
<p>Usage details.</p>
<h4>Advanced Config</h4>
<p>Config info.</p>
`;

// HTML with pre-existing id attributes — ToC should preserve them
const htmlWithIds = `
<h2 id="existing-id">Has ID</h2>
<p>Text.</p>
<h3>No ID Here</h3>
`;

describe('TableOfContents', () => {
	it('renders desktop ToC with correct headings', () => {
		render(TableOfContents, { props: { html: sampleHtml } });
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
		render(TableOfContents, { props: { html: sampleHtml } });
		const mobile = screen.getByTestId('toc-mobile');
		expect(mobile).toBeInTheDocument();
		expect(mobile).toHaveTextContent('Table of Contents');
	});

	it('expands mobile ToC on click', async () => {
		render(TableOfContents, { props: { html: sampleHtml } });
		const toggle = screen.getByText('Table of Contents');
		// Initially items should not be in the mobile section
		const mobile = screen.getByTestId('toc-mobile');
		// Before click, the list within mobile should not exist
		expect(mobile.querySelectorAll('ul').length).toBe(0);

		await fireEvent.click(toggle);

		// After click, the list should appear
		expect(mobile.querySelectorAll('ul').length).toBe(1);
		expect(mobile).toHaveTextContent('Introduction');
	});

	it('exports getProcessedHtml that injects ids', () => {
		const { component } = render(TableOfContents, { props: { html: sampleHtml } });
		const processed = component.getProcessedHtml();
		// Verify heading ids are injected
		expect(processed).toContain('id="introduction"');
		expect(processed).toContain('id="getting-started"');
		expect(processed).toContain('id="prerequisites"');
		expect(processed).toContain('id="usage"');
		expect(processed).toContain('id="advanced-config"');
	});

	it('preserves existing heading ids', () => {
		const { component } = render(TableOfContents, { props: { html: htmlWithIds } });
		const processed = component.getProcessedHtml();
		// Existing id should be preserved
		expect(processed).toContain('id="existing-id"');
		// New id should be added for heading without one
		expect(processed).toContain('id="no-id-here"');
	});

	it('handles empty HTML without crashing', () => {
		render(TableOfContents, { props: { html: '' } });
		// Desktop nav should render with "On this page" title but no entries
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop).toBeInTheDocument();
		expect(desktop.querySelectorAll('li').length).toBe(0);
	});

	it('handles HTML with no headings', () => {
		render(TableOfContents, { props: { html: '<p>No headings here.</p>' } });
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop.querySelectorAll('li').length).toBe(0);
		// Mobile toggle should not render when no entries
		expect(screen.queryByTestId('toc-mobile')).not.toBeInTheDocument();
	});

	it('calls scrollIntoView when a ToC link is clicked', async () => {
		render(TableOfContents, { props: { html: sampleHtml } });
		// Create a mock element with the expected id in the DOM
		const mockEl = document.createElement('div');
		mockEl.id = 'introduction';
		mockEl.scrollIntoView = vi.fn();
		document.body.appendChild(mockEl);

		// Click the first ToC link (desktop)
		const desktopNav = screen.getByTestId('toc-desktop');
		const firstButton = desktopNav.querySelector('button');
		expect(firstButton).not.toBeNull();
		await fireEvent.click(firstButton!);

		expect(mockEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

		// Cleanup
		document.body.removeChild(mockEl);
	});

	it('deduplicates identical heading texts', () => {
		const duplicateHtml = `
			<h2>Setup</h2>
			<h2>Setup</h2>
		`;
		const { component } = render(TableOfContents, { props: { html: duplicateHtml } });
		const processed = component.getProcessedHtml();
		expect(processed).toContain('id="setup"');
		expect(processed).toContain('id="setup-1"');
	});

	it('applies custom class via class prop', () => {
		render(TableOfContents, { props: { html: sampleHtml, class: 'my-custom-class' } });
		const desktop = screen.getByTestId('toc-desktop');
		expect(desktop.className).toContain('my-custom-class');
	});
});
