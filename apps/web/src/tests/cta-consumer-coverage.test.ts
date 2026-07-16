import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { projects } from '$lib/content/projects';
import { services } from '$lib/content/services';
import { SUPPORTED_LOCALES } from '$lib/utils/locale';

const SRC = resolve(process.cwd(), 'src');
const read = (path: string) => readFileSync(resolve(SRC, path), 'utf8');

const consumers = [
	['home', 'lib/components/home/HomePage.svelte', 'home-cta-band'],
	['service', 'lib/components/services/ServiceDetailPage.svelte', 'service-cta-band'],
	['project', 'lib/components/projects/ProjectDetailPage.svelte', 'project-cta-band'],
] as const;

function svelteFiles(dir: string, files: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) svelteFiles(path, files);
		else if (path.endsWith('.svelte')) files.push(path);
	}
	return files;
}

describe('shared CTA consumer coverage', () => {
	it.each(consumers)('%s mounts the same CtaBand component', (_, file, prefix) => {
		const source = read(file);
		expect(source).toContain("import CtaBand from '$lib/components/shared/CtaBand.svelte'");
		expect(source).toContain('<CtaBand');
		expect(source).toContain(`testidPrefix="${prefix}"`);
	});

	it('accounts for every Svelte importer of the shared CtaBand', () => {
		const importers = svelteFiles(SRC)
			.filter((file) =>
				readFileSync(file, 'utf8').includes(
					"import CtaBand from '$lib/components/shared/CtaBand.svelte'",
				),
			)
			.map((file) => relative(SRC, file))
			.sort();
		const auditedConsumers = consumers.map(([, file]) => file).sort();

		expect(importers).toEqual(auditedConsumers);
	});

	it('has one semantic CTA content source and no rendered copy duplication', () => {
		const content = read('lib/content/site-content.ts');
		expect(content.match(/export const ctaContent/g)).toHaveLength(1);

		const duplicateFiles = svelteFiles(SRC).filter((file) => {
			const source = readFileSync(file, 'utf8');
			return source.includes("Let's build something") || source.includes('that moves.');
		});
		expect(
			duplicateFiles.map((file) => relative(SRC, file)),
			'CTA copy belongs only to the generated content module',
		).toEqual([]);
	});

	it('expands the shared component to the audited 21 localized route pages', () => {
		const visibleServices = services.filter((service) => service.visible);
		const publicProjects = projects.filter((project) => project.status === 'public');

		expect(visibleServices).toHaveLength(4);
		expect(publicProjects).toHaveLength(2);
		expect((1 + visibleServices.length + publicProjects.length) * SUPPORTED_LOCALES.length).toBe(21);
	});

	it('requires one shared blueprint composition rather than per-route art', () => {
		const cta = read('lib/components/shared/CtaBand.svelte');
		expect(cta).toContain("import CtaBlueprintBackground from './CtaBlueprintBackground.svelte'");
		expect(cta.match(/<CtaBlueprintBackground/g)).toHaveLength(1);
		for (const [, file] of consumers) {
			expect(read(file)).not.toContain('CtaBlueprintBackground');
		}
	});
});
