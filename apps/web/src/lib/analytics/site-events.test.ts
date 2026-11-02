import { describe, expect, it } from 'vitest';
import { siteMeta } from '#lib/content/index.ts';
import { isProfileClick, navigationEvents } from './site-events';

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

describe('isProfileClick', () => {
	function clickOn(href: string): Pick<MouseEvent, 'target'> {
		const anchor = document.createElement('a');
		anchor.href = href;
		const label = document.createElement('span');
		anchor.append(label);
		return { target: label };
	}

	it('matches the owner profiles, ignoring a trailing slash', () => {
		const { github, linkedin } = siteMeta.links;
		if (!github || !linkedin) throw new Error('fixture needs GitHub and LinkedIn links');
		expect(isProfileClick(clickOn(github))).toBe(true);
		expect(isProfileClick(clickOn(`${linkedin.replace(/\/$/, '')}/`))).toBe(true);
	});

	it('ignores other links and non-link targets', () => {
		expect(isProfileClick(clickOn('https://github.com/mgkdante/yesid.dev'))).toBe(false);
		expect(isProfileClick({ target: document.body })).toBe(false);
	});
});
