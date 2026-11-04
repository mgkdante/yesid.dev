import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import { projectFactory } from '../../../tests/factories';
import ServiceStackPanel from './ServiceStackPanel.svelte';

afterEach(() => cleanup());

const relatedProjects = [projectFactory.build({ slug: 'yesid-dev', title: { en: 'yesid.dev' } })];
const props = {
	stack: ['Postgres'],
	relatedProjects,
	locale: 'en',
	stackLabel: 'Stack',
	relatedProjectsHeading: 'Related projects',
	relatedProjectsAria: 'Related projects',
	seeAllProjectsLabel: 'See all projects',
} as const;

function stackTrigger({ container }: { container: HTMLElement }): HTMLElement {
	return within(container).getAllByRole('button')[0];
}

describe('ServiceStackPanel', () => {
	it('anchors only mobile roots and preserves the fragment contract', () => {
		const desktop = render(ServiceStackPanel, {
			props: { ...props, variant: 'desktop' },
		});
		const mobile = render(ServiceStackPanel, {
			props: { ...props, variant: 'mobile' },
		});

		expect(desktop.container.children).toHaveLength(2);
		expect(mobile.container.children).toHaveLength(2);
		expect(desktop.container.querySelector('[data-toc]')).toBeNull();
		expect(mobile.container.children[0]).toHaveAttribute('data-toc', 'svc-related');
		expect(mobile.container.children[1]).toHaveAttribute('data-toc', 'svc-stack');
	});

	it('resets collapsed cards to their declared defaults on remount', async () => {
		const first = render(ServiceStackPanel, {
			props: { ...props, variant: 'desktop' },
		});
		await fireEvent.click(stackTrigger(first));
		expect(stackTrigger(first)).toHaveAttribute('aria-expanded', 'false');
		first.unmount();

		const remounted = render(ServiceStackPanel, {
			props: { ...props, variant: 'desktop' },
		});
		const otherVariant = render(ServiceStackPanel, {
			props: { ...props, variant: 'mobile' },
		});

		expect(stackTrigger(remounted)).toHaveAttribute('aria-expanded', 'true');
		expect(stackTrigger(otherVariant)).toHaveAttribute('aria-expanded', 'true');
	});
});
