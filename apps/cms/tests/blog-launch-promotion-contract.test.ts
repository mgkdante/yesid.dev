import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';

const PACKAGE_PATH = new URL(
	'../ops/blog/blog-launch-promotion-en-fr-es.md',
	import.meta.url,
);

const directLinks = [
	'https://yesid.dev/blog/the-two-hour-internet-slot',
	'https://yesid.dev/fr/blog/le-creneau-internet-de-deux-heures',
	'https://yesid.dev/es/blog/el-turno-de-dos-horas-para-usar-internet',
	'https://yesid.dev/blog/how-i-learn-orbiting-a-system-until-it-clicks',
	'https://yesid.dev/fr/blog/comment-japprends-graviter-autour-dun-systeme-jusquau-declic',
	'https://yesid.dev/es/blog/como-aprendo-orbitar-un-sistema-hasta-que-encaja',
	'https://yesid.dev/blog/thinking-in-matrices',
	'https://yesid.dev/fr/blog/penser-en-matrices',
	'https://yesid.dev/es/blog/pensar-en-matrices',
	'https://yesid.dev/blog/ai-accelerated-human-owned-my-actual-workflow',
	'https://yesid.dev/fr/blog/accelere-par-lia-pilote-par-lhumain-mon-vrai-flux-de-travail',
	'https://yesid.dev/es/blog/acelerado-por-ia-en-manos-humanas-mi-flujo-de-trabajo-real',
	'https://yesid.dev/blog/50-to-0-an-oracle-always-free-vm',
	'https://yesid.dev/fr/blog/de-50-a-0-une-vm-oracle-always-free',
	'https://yesid.dev/es/blog/de-50-a-0-una-vm-oracle-always-free',
	'https://yesid.dev/blog/does-your-website-need-instant-publishing',
	'https://yesid.dev/fr/blog/votre-site-web-a-t-il-besoin-dune-publication-instantanee',
	'https://yesid.dev/es/blog/tu-sitio-web-necesita-publicacion-instantanea',
];

async function readPackage(): Promise<string> {
	return readFile(PACKAGE_PATH, 'utf8');
}

describe('social promotion package contract', () => {
	it('uses the Business Social Media workspace and article/post vocabulary', async () => {
		const content = await readPackage();

		expect(content).toContain('Business → Social Media');
		expect(content).not.toMatch(/\bchapter(?:s)?\b/iu);
		expect(content).not.toMatch(/\bchapitre(?:s)?\b/iu);
		expect(content).not.toMatch(/\bcap[ií]tulo(?:s)?\b/iu);
		expect(content).not.toContain('chapter_<n>_<locale>');
		expect(content).toContain('utm_content=article_<n>_<locale>');
	});

	it('preserves the six-post, three-locale direct-link package', async () => {
		const content = await readPackage();
		const postHeadings = content.match(/^## Post [1-6]$/gm) ?? [];
		const localeHeadings = content.match(/^### LinkedIn, (English|French|Spanish)$/gm) ?? [];

		expect(postHeadings).toHaveLength(6);
		expect(localeHeadings).toHaveLength(18);
		for (const link of directLinks) expect(content).toContain(link);
		expect(content).toContain(
			'Post 1 led in English; Post 2 led in Spanish; Post 3 led in French; Post 4 led in English; Post 5 led in Spanish; Post 6 led in French.',
		);
	});

	it('keeps every LinkedIn draft platform-ready instead of publishing Markdown literals', async () => {
		const content = await readPackage();
		const sections = [
			...content.matchAll(
				/^### LinkedIn, (?:English|French|Spanish)\n\n([\s\S]*?)(?=^### LinkedIn, |^Short variants:)/gm,
			),
		].map((match) => match[1]);

		expect(sections).toHaveLength(18);
		for (const section of sections) {
			expect(section).not.toMatch(/\[[^\]]+\]\(https?:\/\/[^)]+\)/);
			expect(section).not.toContain('**');
		}
	});

	it('keeps publication dates truthful and the Transit lane excluded', async () => {
		const content = await readPackage();

		expect(content).toContain(
			'Never backdate a social post to an article editorial date.',
		);
		expect(content).toContain(
			'Do not expand this campaign into Transit public-release, case-study, repository, CMS-content, or implementation work.',
		);
		for (const date of [
			'2026-06-01',
			'2026-06-09',
			'2026-06-17',
			'2026-06-25',
			'2026-07-03',
			'2026-07-11',
		]) {
			expect(content).not.toContain(`Social publication date: ${date}`);
		}
	});
});
