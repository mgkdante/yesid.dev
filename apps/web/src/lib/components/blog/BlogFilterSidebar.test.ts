import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import BlogFilterSidebar from './BlogFilterSidebar.svelte';

describe('blog date disclosure', () => {
	it('exposes its state and makes closed date fields inert without losing their values', async () => {
		render(BlogFilterSidebar, { props: {
			tags: [], activeTag: null, activeLang: null,
			onTagSelect: vi.fn(), onLangSelect: vi.fn(), dateFrom: '2026-01-01',
		} });
		const toggle = screen.getByRole('button', { name: /date range/i });
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		const panel = document.getElementById(toggle.getAttribute('aria-controls')!);
		expect(panel).not.toBeNull();
		expect(panel).not.toHaveAttribute('inert');
		await fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(panel).toHaveAttribute('inert');
		await fireEvent.click(toggle);
		expect(panel).not.toHaveAttribute('inert');
		expect(screen.getByLabelText(/^from$/i)).toHaveValue('2026-01-01');
	});
});
