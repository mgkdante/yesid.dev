import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackFilters from './StackFilters.svelte';
import type { DomainCluster } from '$lib/data/types.js';

describe('StackFilters', () => {
	it('renders All pill and all 7 domain pills', () => {
		const { getByTestId } = render(StackFilters);

		expect(getByTestId('filter-all')).toBeTruthy();
		expect(getByTestId('filter-data-engineering')).toBeTruthy();
		expect(getByTestId('filter-web-development')).toBeTruthy();
		expect(getByTestId('filter-mobile-development')).toBeTruthy();
		expect(getByTestId('filter-analytics-bi')).toBeTruthy();
		expect(getByTestId('filter-systems-programming')).toBeTruthy();
		expect(getByTestId('filter-devops-infra')).toBeTruthy();
		expect(getByTestId('filter-internal-tooling')).toBeTruthy();
	});

	it('marks All as active when no domains selected', () => {
		const { getByTestId } = render(StackFilters, { props: { activeDomains: [] } });
		expect(getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true');
		expect(getByTestId('filter-data-engineering').getAttribute('aria-pressed')).toBe('false');
	});

	it('marks selected domain as active', () => {
		const { getByTestId } = render(StackFilters, {
			props: { activeDomains: ['data-engineering'] as DomainCluster[] },
		});
		expect(getByTestId('filter-all').getAttribute('aria-pressed')).toBe('false');
		expect(getByTestId('filter-data-engineering').getAttribute('aria-pressed')).toBe('true');
	});

	it('supports multiple active domains', () => {
		const { getByTestId } = render(StackFilters, {
			props: { activeDomains: ['data-engineering', 'web-development'] as DomainCluster[] },
		});
		expect(getByTestId('filter-data-engineering').getAttribute('aria-pressed')).toBe('true');
		expect(getByTestId('filter-web-development').getAttribute('aria-pressed')).toBe('true');
		expect(getByTestId('filter-mobile-development').getAttribute('aria-pressed')).toBe('false');
	});

	it('emits onchange with toggled domain when clicking a pill', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(StackFilters, {
			props: { activeDomains: [], onchange: handler },
		});

		await fireEvent.click(getByTestId('filter-data-engineering'));
		expect(handler).toHaveBeenCalledWith(['data-engineering']);
	});

	it('emits onchange removing domain when clicking active pill', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(StackFilters, {
			props: { activeDomains: ['data-engineering', 'web-development'] as DomainCluster[], onchange: handler },
		});

		await fireEvent.click(getByTestId('filter-data-engineering'));
		expect(handler).toHaveBeenCalledWith(['web-development']);
	});

	it('emits empty array when clicking All', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(StackFilters, {
			props: { activeDomains: ['data-engineering'] as DomainCluster[], onchange: handler },
		});

		await fireEvent.click(getByTestId('filter-all'));
		expect(handler).toHaveBeenCalledWith([]);
	});

	it('has toolbar role for accessibility', () => {
		const { getByTestId } = render(StackFilters);
		expect(getByTestId('stack-filters').getAttribute('role')).toBe('toolbar');
	});
});
