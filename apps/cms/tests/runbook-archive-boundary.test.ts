import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';

const repoRoot = join(import.meta.dir, '..', '..', '..');
const archiveRoot = 'archive/cms-runbooks/2026-07-21';
const manifestPath = join(repoRoot, archiveRoot, 'manifest.json');
const baseCommit = 'b64e51f0d578132265ca8e5a330a753c55043a8f';
const h1bArchiveRoot = 'archive/cms-runbooks/2026-07-21-h1b';
const h1bManifestPath = join(repoRoot, h1bArchiveRoot, 'manifest.json');
const h1bBaseCommit = '48c3f35454656c47c9a9eb6e510a0073df5e19e5';

const archivedSources = [
	'apps/cms/scripts/add-project-hero-media-fields.ts',
	'apps/cms/scripts/content-blog-page.ts',
	'apps/cms/scripts/content-blog-seo.ts',
	'apps/cms/scripts/content-terminus-routes.ts',
	'apps/cms/scripts/content-tiny-leaks.ts',
	'apps/cms/scripts/lib/flat-field-plan.ts',
	'apps/cms/scripts/migrate-block-json-to-flat.ts',
	'apps/cms/scripts/promote-content-services-prod.ts',
	'apps/cms/scripts/promote-launch-phase1-prod.ts',
	'apps/cms/scripts/reconcile-build-bot-tag-permissions.ts',
	'apps/cms/scripts/reconcile-reserved-person-titles.ts',
	'apps/cms/scripts/setup-about-languages.ts',
	'apps/cms/scripts/setup-block-flat-fields.ts',
	'apps/cms/scripts/setup-contact-channels.ts',
	'apps/cms/scripts/setup-legal-pages-schema.ts',
	'apps/cms/scripts/setup-route-seo-schema.ts',
	'apps/cms/scripts/setup-site-labels-and-chrome.ts',
	'apps/cms/scripts/setup-stack-archetypes-schema.ts',
	'apps/cms/tests/flat-field-plan.test.ts',
	'apps/cms/tests/migrate-block-json-to-flat.test.ts',
	'apps/cms/tests/reconcile-build-bot-tag-permissions.test.ts',
	'apps/cms/tests/reconcile-reserved-person-titles.test.ts',
	'apps/cms/tests/setup-about-languages-dry-run.test.ts',
	'apps/cms/tests/setup-block-flat-fields-dry-run.test.ts',
	'apps/cms/tests/setup-contact-channels-dry-run.test.ts',
	'apps/cms/tests/setup-route-seo-dry-run.test.ts',
	'apps/cms/tests/setup-site-labels-dry-run.test.ts',
	'apps/cms/tests/setup-stack-archetypes-dry-run.test.ts',
] as const;

const h1bArchivedSources = [
	'apps/cms/scripts/generate-tech-stack-fixture.ts',
	'apps/cms/scripts/migrate-markdown-to-blocks.ts',
	'apps/cms/scripts/replace-blog-posts.ts',
	'apps/cms/tests/migrate-markdown-to-blocks.test.ts',
	'apps/cms/tests/replace-blog-posts-dry-run.test.ts',
] as const;

type Manifest = {
	schema: number;
	source: { commit: string };
	files: Array<{ source: string; archive: string; sha256: string; restore: string }>;
};

function sha256(path: string): string {
	return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sourceFiles(directory: string): string[] {
	return readdirSync(directory).flatMap((name) => {
		const path = join(directory, name);
		return statSync(path).isDirectory()
			? sourceFiles(path)
			: path.endsWith('.ts') && !path.endsWith('.test.ts')
				? [path]
				: [];
	});
}

test('moves the frozen runbook set into a recoverable inert archive', () => {
	expect(existsSync(manifestPath), 'archive manifest must exist').toBe(true);
	if (!existsSync(manifestPath)) return;

	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
	expect(manifest.schema).toBe(1);
	expect(manifest.source.commit).toBe(baseCommit);
	expect(manifest.files.map(({ source }) => source).sort()).toEqual([...archivedSources].sort());

	for (const entry of manifest.files) {
		const expectedArchive = `${archiveRoot}/${entry.source}`;
		expect(entry.archive, entry.source).toBe(expectedArchive);
		expect(entry.restore, entry.source).toBe(`git mv ${entry.archive} ${entry.source}`);
		expect(existsSync(join(repoRoot, entry.source)), entry.source).toBe(false);
		expect(existsSync(join(repoRoot, entry.archive)), entry.archive).toBe(true);
		if (existsSync(join(repoRoot, entry.archive))) {
			expect(entry.sha256, entry.archive).toBe(sha256(join(repoRoot, entry.archive)));
		}
	}
});

test('removes stale aliases and active references without weakening live CMS jobs', () => {
	const cmsPackage = JSON.parse(readFileSync(join(repoRoot, 'apps/cms/package.json'), 'utf8'));
	const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
	for (const alias of [
		'setup:archetypes',
		'setup:flat-fields',
		'migrate:flat-fields',
		'setup:site-labels',
		'content:terminus-routes',
	]) {
		expect(cmsPackage.scripts[alias], alias).toBeUndefined();
	}
	expect(rootPackage.scripts['cms:setup:site-labels:op']).toBeUndefined();

	const activeSource = sourceFiles(join(repoRoot, 'apps/cms/scripts'))
		.map((path) => readFileSync(path, 'utf8'))
		.join('\n');
	for (const path of archivedSources.filter((path) => path.includes('/scripts/'))) {
		expect(activeSource, path).not.toContain(path.split('/').at(-1)!.replace(/\.ts$/u, ''));
	}

	const workflow = readFileSync(join(repoRoot, '.github/workflows/cms.yml'), 'utf8');
	for (const command of [
		'bun run verify:assets-audit',
		'bun run sync:diff',
		'bun run sync:push',
		'bun scripts/reconcile-legal-service-area.ts',
		'bun scripts/audit-permission-control-drift.ts',
		'bun scripts/diagnose-permission-policy-candidates.ts',
		'bun scripts/reconcile-permission-policy-quarantine-name.ts',
		'bun scripts/reconcile-public-blog-permission.ts',
		'bun scripts/promote-lean-high-intent-analytics.ts',
		'bun scripts/export-fallbacks.ts',
	]) {
		expect(workflow, command).toContain(command);
	}
});

test('moves the completed H1-B dependency closure into its own recoverable archive batch', () => {
	expect(existsSync(h1bManifestPath), 'H1-B archive manifest must exist').toBe(true);
	if (!existsSync(h1bManifestPath)) return;

	const manifest = JSON.parse(readFileSync(h1bManifestPath, 'utf8')) as Manifest;
	expect(manifest.schema).toBe(1);
	expect(manifest.source.commit).toBe(h1bBaseCommit);
	expect(manifest.files.map(({ source }) => source).sort()).toEqual([...h1bArchivedSources].sort());

	for (const entry of manifest.files) {
		const expectedArchive = `${h1bArchiveRoot}/${entry.source}`;
		expect(entry.archive, entry.source).toBe(expectedArchive);
		expect(entry.restore, entry.source).toBe(`git mv ${entry.archive} ${entry.source}`);
		expect(existsSync(join(repoRoot, entry.source)), entry.source).toBe(false);
		expect(existsSync(join(repoRoot, entry.archive)), entry.archive).toBe(true);
		if (existsSync(join(repoRoot, entry.archive))) {
			expect(entry.sha256, entry.archive).toBe(sha256(join(repoRoot, entry.archive)));
		}
	}
});

test('removes only the closed H1-B graph and its CMS-only dependency', () => {
	for (const path of h1bArchivedSources) {
		expect(existsSync(join(repoRoot, path)), path).toBe(false);
	}

	const cmsPackage = JSON.parse(readFileSync(join(repoRoot, 'apps/cms/package.json'), 'utf8'));
	expect(cmsPackage.devDependencies.marked).toBeUndefined();

	const activeSource = sourceFiles(join(repoRoot, 'apps/cms/scripts'))
		.map((path) => readFileSync(path, 'utf8'))
		.join('\n');
	for (const stem of [
		'generate-tech-stack-fixture',
		'migrate-markdown-to-blocks',
		'replace-blog-posts',
	]) {
		expect(activeSource, stem).not.toContain(stem);
	}
});
