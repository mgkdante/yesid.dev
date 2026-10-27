// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { YESID_TOC_SELECTOR } from './toc-selector';

afterEach(() => {
	document.body.innerHTML = '';
});

it('observes the package targets plus README and blog-body headings, and nothing else', () => {
	document.body.innerHTML = `
		<div data-section-index="0" id="section"></div>
		<div data-toc="card" id="card"></div>
		<h3 id="readme-h-2"></h3>
		<div data-testid="blog-section-body"><h3 id="blog-h3"></h3><h4 id="blog-h4"></h4><h2 id="blog-h2"></h2><h3>no id</h3></div>
		<h3 id="unrelated"></h3>`;

	const ids = [...document.querySelectorAll(YESID_TOC_SELECTOR)].map((el) => el.id);

	expect(ids).toEqual(['section', 'card', 'readme-h-2', 'blog-h3', 'blog-h4']);
});
