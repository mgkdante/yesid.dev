import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackConfigurator from './StackConfigurator.svelte';
import type { DomainCluster } from '$lib/types';

describe('StackConfigurator', () => {
	it('renders all 7 domain options', () => {
		const { getByTestId } = render(StackConfigurator);

		expect(getByTestId('configurator-data-engineering')).toBeTruthy();
		expect(getByTestId('configurator-web-development')).toBeTruthy();
		expect(getByTestId('configurator-mobile-development')).toBeTruthy();
		expect(getByTestId('configurator-analytics-bi')).toBeTruthy();
		expect(getByTestId('configurator-systems-programming')).toBeTruthy();
		expect(getByTestId('configurator-devops-infra')).toBeTruthy();
		expect(getByTestId('configurator-internal-tooling')).toBeTruthy();
	});

	it('shows "What do you need?" heading', () => {
		const { container } = render(StackConfigurator);
		expect(container.textContent).toContain('What do you need?');
	});

	it('shows selection counter', () => {
		const { container } = render(StackConfigurator, {
			props: { selectedDomains: ['data-engineering'] as DomainCluster[] },
		});
		expect(container.textContent).toContain('1/3');
	});

	it('marks selected domain with aria-pressed', () => {
		const { getByTestId } = render(StackConfigurator, {
			props: { selectedDomains: ['data-engineering'] as DomainCluster[] },
		});
		expect(getByTestId('configurator-data-engineering').getAttribute('aria-pressed')).toBe('true');
		expect(getByTestId('configurator-web-development').getAttribute('aria-pressed')).toBe('false');
	});

	it('emits onchange when toggling a domain', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(StackConfigurator, {
			props: { selectedDomains: [], onchange: handler },
		});

		await fireEvent.click(getByTestId('configurator-data-engineering'));
		expect(handler).toHaveBeenCalledWith(['data-engineering']);
	});

	it('emits onchange removing a selected domain', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(StackConfigurator, {
			props: { selectedDomains: ['data-engineering', 'web-development'] as DomainCluster[], onchange: handler },
		});

		await fireEvent.click(getByTestId('configurator-data-engineering'));
		expect(handler).toHaveBeenCalledWith(['web-development']);
	});

	it('disables unselected domains at 3 selections', () => {
		const selected: DomainCluster[] = ['data-engineering', 'web-development', 'analytics-bi'];
		const { getByTestId } = render(StackConfigurator, {
			props: { selectedDomains: selected },
		});

		// Unselected domains should be disabled
		expect(getByTestId('configurator-mobile-development').hasAttribute('disabled')).toBe(true);
		expect(getByTestId('configurator-systems-programming').hasAttribute('disabled')).toBe(true);

		// Selected domains remain enabled (for deselection)
		expect(getByTestId('configurator-data-engineering').hasAttribute('disabled')).toBe(false);
	});

	it('does not emit for disabled domains', async () => {
		const handler = vi.fn();
		const selected: DomainCluster[] = ['data-engineering', 'web-development', 'analytics-bi'];
		const { getByTestId } = render(StackConfigurator, {
			props: { selectedDomains: selected, onchange: handler },
		});

		await fireEvent.click(getByTestId('configurator-mobile-development'));
		expect(handler).not.toHaveBeenCalled();
	});

	it('has group role with descriptive label', () => {
		const { getByTestId } = render(StackConfigurator);
		expect(getByTestId('stack-configurator').getAttribute('role')).toBe('group');
	});
});
