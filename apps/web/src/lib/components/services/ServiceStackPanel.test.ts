import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { captureEntries } from '$lib/state/locale-handoff.svelte';
import { projectFactory } from '../../../tests/factories';
import ServiceStackPanel from './ServiceStackPanel.svelte';

afterEach(() => cleanup());

describe('ServiceStackPanel', () => {
	it('keeps variant state distinct, anchors only mobile roots, and preserves the fragment contract', () => {
		const relatedProjects = [
			projectFactory.build({ slug: 'yesid-dev', title: { en: 'yesid.dev' } }),
		];
		const props = {
			stack: ['Postgres'],
			relatedProjects,
			locale: 'en',
			stackLabel: 'Stack',
			seeStackLabel: 'See the stack',
			relatedProjectsHeading: 'Related projects',
			relatedProjectsAria: 'Related projects',
			seeAllProjectsLabel: 'See all projects',
		} as const;

		const desktop = render(ServiceStackPanel, {
			props: { ...props, variant: 'desktop' },
		});
		const mobile = render(ServiceStackPanel, {
			props: { ...props, variant: 'mobile' },
		});
		flushSync();

		expect(captureEntries()).toEqual({
			'svc-stack-desktop': true,
			'svc-related-desktop': true,
			'svc-stack-mobile': true,
			'svc-related-mobile': true,
		});

		expect(desktop.container.children).toHaveLength(2);
		expect(mobile.container.children).toHaveLength(2);
		expect(desktop.container.querySelector('[data-toc]')).toBeNull();
		expect(mobile.container.children[0]).toHaveAttribute('data-toc', 'svc-stack');
		expect(mobile.container.children[1]).toHaveAttribute('data-toc', 'svc-related');
	});
});
