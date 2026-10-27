import { TOC_TARGET_SELECTOR } from '@yesid/ui/brand';

/** The package targets plus yesid.dev's README and blog-body headings. */
export const YESID_TOC_SELECTOR = [
	TOC_TARGET_SELECTOR,
	'[id^="readme-h-"]',
	'[data-testid="blog-section-body"] h3[id]',
	'[data-testid="blog-section-body"] h4[id]',
].join(', ');
