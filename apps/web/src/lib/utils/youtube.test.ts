import { describe, expect, it } from 'vitest';
import type { BlockEditorDoc } from '@repo/shared';
import { collectProjectVideos, parseYouTubeParagraph } from './youtube';

describe('authored YouTube paragraphs', () => {
	it.each([
		'https://youtu.be/M7lc1UVf-VE?si=share',
		'https://www.youtube.com/watch?v=M7lc1UVf-VE&feature=shared',
		'https://m.youtube.com/shorts/M7lc1UVf-VE',
		'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
	])('accepts a real video URL form: %s', (url) => {
		expect(parseYouTubeParagraph(url)).toEqual({ id: 'M7lc1UVf-VE', caption: '' });
	});

	it('keeps a plain sole-anchor label without trying to sanitize markup into a caption', () => {
		expect(parseYouTubeParagraph('<a href="https://www.youtube.com/watch?v=M7lc1UVf-VE&amp;feature=shared">Package walkthrough</a>'))
			.toEqual({ id: 'M7lc1UVf-VE', caption: 'Package walkthrough' });
		for (const label of ['Demo <script', '<b>Package walkthrough</b>', '<scr<script>ipt>']) {
			expect(parseYouTubeParagraph(`<a href="https://youtu.be/M7lc1UVf-VE">${label}</a>`))
				.toEqual({ id: 'M7lc1UVf-VE', caption: '' });
		}
	});

	it('decodes stored entities in an anchor label', () => {
		expect(parseYouTubeParagraph('<a href="https://youtu.be/M7lc1UVf-VE">L&#39;atelier &amp; la démo</a>'))
			.toEqual({ id: 'M7lc1UVf-VE', caption: 'L\'atelier & la démo' });
	});

	it.each([
		'https://youtube.com.evil.example/watch?v=M7lc1UVf-VE',
		'https://www.youtube.com@evil.example/watch?v=M7lc1UVf-VE',
		'https://evil.example/https://youtu.be/M7lc1UVf-VE',
		'https://youtu.be/too-short',
		'https://youtu.be/M7lc1UVf-VE/extra',
		'https://www.youtube.com/playlist?list=M7lc1UVf-VE',
		'javascript:alert(1)',
		'Watch https://youtu.be/M7lc1UVf-VE for more.',
		'<a href="https://youtu.be/M7lc1UVf-VE">One</a> and <a href="https://youtu.be/M7lc1UVf-VE">two</a>',
	])('leaves nonstandalone or untrusted content as ordinary text: %s', (text) => {
		expect(parseYouTubeParagraph(text)).toBeNull();
	});

	it('deduplicates IDs across story documents, keeps actual captions, and never invents videos', () => {
		const doc: BlockEditorDoc = {
			time: 0, version: '2.31.2', blocks: [
				{ id: 'url', type: 'paragraph', data: { text: 'https://youtu.be/M7lc1UVf-VE' } },
				{ id: 'caption', type: 'paragraph', data: { text: '<a href="https://www.youtube.com/watch?v=M7lc1UVf-VE">Walkthrough</a>' } },
				{ id: 'code', type: 'code', data: { code: 'https://youtu.be/7lCDEYXw3mM' } },
			],
		};
		expect(collectProjectVideos([doc, doc])).toEqual([{ id: 'M7lc1UVf-VE', caption: 'Walkthrough' }]);
		expect(collectProjectVideos([])).toEqual([]);
	});
});
