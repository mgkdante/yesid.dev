import { describe, expect, it } from 'vitest';
import { siteMeta } from '#lib/content/index.ts';
import { navigationEvents, profileClickNetwork } from './site-events';

const at = (path: string) => ({ url: new URL(path, 'https://yesid.dev') });

describe('navigationEvents', () => {
	it('reports a 404 render and a hop between locales', () => {
		expect(navigationEvents({ from: null, to: at('/nope') }, 404)).toEqual(['404']);
		expect(navigationEvents({ from: at('/projects'), to: at('/fr/projects') }, 200)).toEqual(['language_switch']);
	});

	it('stays quiet for same-locale navigation and the first load', () => {
		expect(navigationEvents({ from: at('/fr'), to: at('/fr/contact') }, 200)).toEqual([]);
		expect(navigationEvents({ from: null, to: at('/es') }, 200)).toEqual([]);
	});
});

describe('profileClickNetwork', () => {
	function clickOn(href: string): Pick<MouseEvent, 'target'> {
		const anchor = document.createElement('a');
		anchor.href = href;
		const label = document.createElement('span');
		anchor.append(label);
		return { target: label };
	}

	it('names the owner profile, ignoring a trailing slash', () => {
		const { github, linkedin } = siteMeta.links;
		if (!github || !linkedin) throw new Error('fixture needs GitHub and LinkedIn links');
		expect(profileClickNetwork(clickOn(github))).toBe('github');
		expect(profileClickNetwork(clickOn(`${linkedin.replace(/\/$/, '')}/`))).toBe('linkedin');
	});

	it('ignores other links and non-link targets', () => {
		expect(profileClickNetwork(clickOn('https://github.com/mgkdante/yesid.dev'))).toBeNull();
		expect(profileClickNetwork({ target: document.body })).toBeNull();
	});
});
