import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StackBottomSheet from './StackBottomSheet.svelte';
import type { TechStackItem } from '$lib/data/types.js';

const mockItems: TechStackItem[] = [
	{
		id: 'postgresql',
		name: 'PostgreSQL',
		layer: 'data',
		domains: ['data-engineering'],
		connectsTo: ['python'],
		relatedServices: [],
		relatedProjects: ['yesid-dev'],
		icon: 'postgresql',
		proficiency: 'expert',
	},
	{
		id: 'python',
		name: 'Python',
		layer: 'backend',
		domains: ['data-engineering'],
		connectsTo: [],
		relatedServices: [],
		relatedProjects: [],
		icon: 'python',
		proficiency: 'expert',
	},
	{
		id: 'sveltekit',
		name: 'SvelteKit',
		layer: 'frontend',
		domains: ['web-development'],
		connectsTo: [],
		relatedServices: [],
		relatedProjects: [],
		icon: 'sveltekit',
		proficiency: 'proficient',
	},
];

describe('StackBottomSheet', () => {
	// Drawer renders content in a portal — use document/screen queries, not container

	it('renders the bottom sheet', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(document.querySelector('[data-testid="stack-bottomsheet"]')).toBeTruthy();
	});

	it('displays item name', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(screen.getByText('PostgreSQL')).toBeTruthy();
	});

	it('displays proficiency badge', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(screen.getByText('Expert')).toBeTruthy();
	});

	it('renders markdown content', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const body = document.querySelector('[data-testid="bottomsheet-content"]');
		expect(body?.querySelector('h2')).toBeTruthy();
	});

	it('calls onclose when close button clicked', async () => {
		const handler = vi.fn();
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: handler,
				onnavigate: vi.fn(),
			},
		});
		const closeBtn = document.querySelector('[data-testid="bottomsheet-close"]') as HTMLElement;
		await fireEvent.click(closeBtn);
		expect(handler).toHaveBeenCalledOnce();
	});

	it('shows next item name in nav button', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const navBtns = document.querySelectorAll('.nav-btn');
		// First item — prev should be disabled, next should show "Python"
		expect((navBtns[0] as HTMLButtonElement).disabled).toBe(true);
		expect(navBtns[1]?.textContent).toContain('Python');
	});

	it('disables prev button for first item', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const prevBtn = document.querySelector('.nav-btn') as HTMLButtonElement;
		expect(prevBtn.disabled).toBe(true);
	});

	it('disables next button for last item', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[2],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const navBtns = document.querySelectorAll('.nav-btn');
		expect((navBtns[1] as HTMLButtonElement).disabled).toBe(true);
	});

	it('shows project badges when available', () => {
		render(StackBottomSheet, {
			props: {
				item: mockItems[0],
				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(screen.getByText('yesid.dev')).toBeTruthy();
	});
});
