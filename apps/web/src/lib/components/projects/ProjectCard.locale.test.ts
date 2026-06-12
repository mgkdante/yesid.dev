// slice-28.6 T9 — representative internal-link localization tests.
// The locale context is injected via render's `context` option: the
// locale-context module keys on Symbol.for('yesid.locale') and stores a
// read function (see $lib/utils/locale-context.ts).
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ProjectCard from './ProjectCard.svelte';
import { projectFactory } from '../../../tests/factories';

const frContext = new Map([[Symbol.for('yesid.locale'), () => 'fr']]);

describe('ProjectCard — localized href (slice-28.6)', () => {
	it('links to the canonical EN path without a provider', () => {
		const project = projectFactory.build({ slug: 'transit-data-pipeline' });
		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
		});
		expect(container.querySelector('a')?.getAttribute('href')).toBe(
			'/projects/transit-data-pipeline',
		);
	});

	it('links to the /fr-prefixed path inside a fr locale provider', () => {
		const project = projectFactory.build({ slug: 'transit-data-pipeline' });
		const { container } = render(ProjectCard, {
			props: { project, serviceSvgContents: {} },
			context: frContext,
		});
		expect(container.querySelector('a')?.getAttribute('href')).toBe(
			'/fr/projects/transit-data-pipeline',
		);
	});
});
