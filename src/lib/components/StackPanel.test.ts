import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackPanel from './StackPanel.svelte';
import type { TechStackItem } from '$lib/data/types.js';

const mockItem: TechStackItem = {
	id: 'postgresql',
	name: 'PostgreSQL',
	layer: 'data',
	domains: ['data-engineering', 'web-development'],
	connectsTo: ['python', 'sveltekit'],
	relatedServices: ['sql-development'],
	relatedProjects: ['yesid-dev', 'transit-pipeline'],
	icon: 'postgresql',
	proficiency: 'expert',
};

describe('StackPanel', () => {
	describe('Orientation card (no item selected)', () => {
		it('shows orientation card when no item', () => {
			const { container } = render(StackPanel, { props: {} });
			expect(container.querySelector('[data-testid="panel-orientation"]')).toBeTruthy();
		});

		it('shows "THE CONTROL ROOM" label', () => {
			const { getByText } = render(StackPanel, { props: {} });
			expect(getByText('THE CONTROL ROOM')).toBeTruthy();
		});

		it('shows stats', () => {
			const { getByText } = render(StackPanel, { props: {} });
			expect(getByText('9')).toBeTruthy();
			expect(getByText('layers')).toBeTruthy();
		});

		it('does not show detail card', () => {
			const { container } = render(StackPanel, { props: {} });
			expect(container.querySelector('[data-testid="panel-detail"]')).toBeNull();
		});
	});

	describe('Detail card (item selected)', () => {
		it('shows detail card when item provided', () => {
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(container.querySelector('[data-testid="panel-detail"]')).toBeTruthy();
		});

		it('does not show orientation card', () => {
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(container.querySelector('[data-testid="panel-orientation"]')).toBeNull();
		});

		it('displays item name', () => {
			const { getByText } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(getByText('PostgreSQL')).toBeTruthy();
		});

		it('displays proficiency badge', () => {
			const { getByText } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(getByText('Expert')).toBeTruthy();
		});

		it('shows outgoing relations section', () => {
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(container.querySelector('[data-testid="relations-outgoing"]')).toBeTruthy();
		});

		it('renders relation names as clickable buttons', () => {
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			const links = container.querySelectorAll('.relation-link');
			expect(links.length).toBeGreaterThan(0);
		});

		it('calls onnavigate when relation clicked', async () => {
			const handler = vi.fn();
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn(), onnavigate: handler },
			});
			const firstLink = container.querySelector('.relation-link') as HTMLElement;
			if (firstLink) await fireEvent.click(firstLink);
			expect(handler).toHaveBeenCalled();
		});

		it('shows project badges', () => {
			const { getByText } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			expect(getByText('yesid.dev')).toBeTruthy();
		});

		it('shows CTA with item name', () => {
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: vi.fn() },
			});
			const cta = container.querySelector('[data-testid="panel-cta"]');
			expect(cta?.textContent).toContain('PostgreSQL');
		});

		it('calls onclose when close button clicked', async () => {
			const handler = vi.fn();
			const { container } = render(StackPanel, {
				props: { item: mockItem, onclose: handler },
			});
			const closeBtn = container.querySelector('[data-testid="panel-close"]') as HTMLElement;
			await fireEvent.click(closeBtn);
			expect(handler).toHaveBeenCalledOnce();
		});
	});
});
