#!/usr/bin/env bun
import { generateDesignMd } from '@yesid/tokens/generators/design-md';
import {
	generateThemeBlock,
	replaceThemeRegion,
} from '@yesid/tokens/generators/theme-block';
import { parseTokens } from '@yesid/tokens/parse';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const tokenSourcePath = 'apps/web/vendor/design/tokens/tokens.json' as const;
export const artifactPaths = ['apps/web/src/app.css', 'DESIGN.md'] as const;

type ArtifactPath = (typeof artifactPaths)[number];
type ProductBuild = Record<ArtifactPath, string>;

const uiBrandIndexPath = 'apps/web/vendor/design/ui/src/brand/index.ts';
const uiPackagePath = 'apps/web/vendor/design/ui/package.json';
const upstreamSource = 'packages/tokens/tokens.json';
const defaultRoot = fileURLToPath(new URL('../../../', import.meta.url));

function read(root: string, path: string): string {
	try {
		return readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n');
	} catch (error) {
		const code =
			typeof error === 'object' && error !== null && 'code' in error
				? String(error.code)
				: 'READ_FAILED';
		throw new Error(`cannot read ${path} (${code})`);
	}
}

function parseJson(root: string, path: string): unknown {
	try {
		return JSON.parse(read(root, path));
	} catch (error) {
		if (error instanceof SyntaxError) throw new Error(`invalid JSON in ${path}`);
		throw error;
	}
}

function readUiInventory(root: string): {
	brandComponents: string[];
	primitiveSubpaths: string[];
} {
	const brandIndex = read(root, uiBrandIndexPath);
	const brandComponents = [...brandIndex.matchAll(/^export \{ default as (\w+) \}/gm)].map(
		([, name]) => name!,
	);
	const manifest = parseJson(root, uiPackagePath) as {
		exports?: Record<string, unknown>;
	};
	const primitiveSubpaths = Object.entries(manifest.exports ?? {})
		.filter(([, conditions]) => {
			const targets =
				typeof conditions === 'string'
					? [conditions]
					: conditions && typeof conditions === 'object'
						? Object.values(conditions)
						: [];
			return targets.some(
				(target) => typeof target === 'string' && target.includes('/primitives/'),
			);
		})
		.map(([path]) => path.replace(/^\.\//, ''));

	if (brandComponents.length === 0 || primitiveSubpaths.length === 0) {
		throw new Error('vendored @yesid/ui public inventory is empty');
	}
	return { brandComponents, primitiveSubpaths };
}

function restamp(content: string, artifact: ArtifactPath): string {
	const matches = content.split(upstreamSource).length - 1;
	if (matches !== 1) {
		throw new Error(
			`${artifact} generator emitted ${matches} provenance markers; expected exactly one`,
		);
	}
	return content.replace(upstreamSource, tokenSourcePath);
}

export function createProductBuild(root = defaultRoot): ProductBuild {
	const tokens = parseTokens(parseJson(root, tokenSourcePath));
	const inventory = readUiInventory(root);
	const theme = restamp(generateThemeBlock(tokens), 'apps/web/src/app.css');
	const appCss = replaceThemeRegion(read(root, 'apps/web/src/app.css'), theme);
	const design = restamp(generateDesignMd(tokens, inventory), 'DESIGN.md');

	return {
		'apps/web/src/app.css': appCss,
		'DESIGN.md': design,
	};
}

export function staleProductArtifacts(root = defaultRoot): ArtifactPath[] {
	const build = createProductBuild(root);
	return artifactPaths.filter((path) => {
		const absolute = resolve(root, path);
		return !existsSync(absolute) || readFileSync(absolute, 'utf8') !== build[path];
	});
}

export function writeProductBuild(root = defaultRoot): ArtifactPath[] {
	const build = createProductBuild(root);
	const changed: ArtifactPath[] = [];
	for (const path of artifactPaths) {
		const absolute = resolve(root, path);
		if (existsSync(absolute) && readFileSync(absolute, 'utf8') === build[path]) continue;
		mkdirSync(dirname(absolute), { recursive: true });
		writeFileSync(absolute, build[path], 'utf8');
		changed.push(path);
	}
	return changed;
}

function parseArgs(args: string[]): { check: boolean; root: string } {
	let check = false;
	let rootSeen = false;
	let root = defaultRoot;
	for (let index = 0; index < args.length; index++) {
		const argument = args[index];
		if (argument === '--check') {
			if (check) throw new Error('duplicate argument: --check');
			check = true;
		} else if (argument === '--root') {
			if (rootSeen) throw new Error('duplicate argument: --root');
			const value = args[++index];
			if (!value || value.startsWith('--')) throw new Error('--root requires a path');
			root = resolve(value);
			rootSeen = true;
		} else {
			throw new Error(`unknown argument: ${argument}`);
		}
	}
	return { check, root };
}

function main(args = process.argv.slice(2)): number {
	try {
		const options = parseArgs(args);
		if (!options.check) {
			const changed = writeProductBuild(options.root);
			for (const path of changed) console.log(`  wrote ${path}`);
			console.log(
				changed.length === 0
					? '✓ build idempotent (no changes)'
					: `✓ token build wrote ${changed.length} generated artifacts`,
			);
			return 0;
		}
		const stale = staleProductArtifacts(options.root);
		if (stale.length > 0) {
			for (const path of stale) console.error(`  stale ${path}`);
			console.error(`✗ build-tokens: ${stale.length} generated token artifacts are stale`);
			return 1;
		}
		console.log('✓ generated token artifacts are current');
		return 0;
	} catch (error) {
		console.error(`✗ build-tokens: ${error instanceof Error ? error.message : String(error)}`);
		return 1;
	}
}

if (import.meta.main) process.exitCode = main();
