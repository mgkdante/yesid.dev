import { describe, expect, it } from 'vitest';
import { aboutPageContent } from '$lib/content/about-page';
import { blogBodies } from '$lib/content/blog-bodies';
import { mirroredMediaAssets } from '$lib/content/media-assets';
import { projects } from '$lib/content/projects';
import { routeSeoOverrides } from '$lib/content/route-seo';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import { techStackItems } from '$lib/content/tech-stack';

describe('generated media asset mirror coverage', () => {
	it('mirrors every CMS media UUID currently emitted into visitor-rendered content', () => {
		const ids = collectRenderedMediaIds();
		const missing = [...ids].filter((id) => !mirroredMediaAssets[id]).sort();

		expect(missing).toEqual([]);
	});

	it('uses site-local URLs for mirrored media', () => {
		for (const url of Object.values(mirroredMediaAssets)) {
			expect(url).toMatch(/^\/(images|og|svg)\//);
			expect(url).not.toContain('/assets/');
			expect(url).not.toContain('cms.');
		}
	});
});

function collectRenderedMediaIds(): Set<string> {
	const ids = new Set<string>();
	const add = (value: string | null | undefined) => {
		if (value) ids.add(value);
	};

	add(STATIC_SITE_SEO_DEFAULTS.defaultOgImage);
	for (const entry of routeSeoOverrides) add(entry.ogImage);

	for (const project of projects) {
		add(project.image);
		add(project.imageLight);
		add(project.imageSecondary);
		add(project.imageSecondaryLight);
		collectImageBlockIds(project, ids);
	}

	collectImageBlockIds(blogBodies, ids);

	for (const language of aboutPageContent.languages) add(language.image);
	for (const item of techStackItems) add(item.icon?.svg_override);

	return ids;
}

function collectImageBlockIds(value: unknown, ids: Set<string>): void {
	if (!value || typeof value !== 'object') return;

	if (Array.isArray(value)) {
		for (const item of value) collectImageBlockIds(item, ids);
		return;
	}

	const record = value as Record<string, unknown>;
	if (record.type === 'image' && record.data && typeof record.data === 'object') {
		const data = record.data as {
			file?: { fileId?: string | null };
			variants?: { light?: { fileId?: string | null } };
		};
		if (data.file?.fileId) ids.add(data.file.fileId);
		if (data.variants?.light?.fileId) ids.add(data.variants.light.fileId);
	}

	for (const child of Object.values(record)) collectImageBlockIds(child, ids);
}
