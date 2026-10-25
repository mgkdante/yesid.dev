import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MODULE_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs'];

function moduleSpecifiers(file: string): string[] {
	const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
	const specifiers: string[] = [];
	function visit(node: ts.Node) {
		if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
			specifiers.push(node.moduleSpecifier.text);
		} else if (ts.isCallExpression(node) &&
			(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
				(ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
			node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
			specifiers.push(node.arguments[0].text);
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
	return specifiers;
}

function resolveLocalImport(importer: string, specifier: string): string | undefined {
	const target = specifier.startsWith('#lib/')
		? resolve(WEB_ROOT, 'src/lib', specifier.slice('#lib/'.length))
		: specifier.startsWith('.') ? resolve(dirname(importer), specifier) : undefined;
	if (!target) return;
	const candidates = extname(target) ? [target] : [
		target,
		...MODULE_EXTENSIONS.map((extension) => target + extension),
		...MODULE_EXTENSIONS.map((extension) => resolve(target, 'index' + extension)),
	];
	const found = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
	if (!found) throw new Error(`Unresolved native-build import: ${importer} -> ${specifier}`);
	return found;
}

function virtualImports(entry: string): { visited: string[]; violations: string[] } {
	const visited = new Set<string>();
	const violations: string[] = [];
	function walk(file: string, chain: string[]) {
		if (visited.has(file)) return;
		visited.add(file);
		for (const specifier of moduleSpecifiers(file)) {
			if (/^(?:\$app\/|\$env\/|\$lib\/|virtual:)/.test(specifier)) {
				violations.push([...chain, relative(WEB_ROOT, file), specifier].join(' -> '));
				continue;
			}
			const dependency = resolveLocalImport(file, specifier);
			if (dependency) walk(dependency, [...chain, relative(WEB_ROOT, file)]);
		}
	}
	walk(resolve(WEB_ROOT, entry), []);
	return { visited: [...visited], violations };
}

describe('native build import boundaries', () => {
	it.each(['src/params.ts', 'vite.config.ts', 'src/env.ts'])(
		'%s and its local import graph do not depend on Vite virtual modules', (entry) => {
			const { visited, violations } = virtualImports(entry);
			expect(visited).toContain(resolve(WEB_ROOT, entry));
			expect(violations).toEqual([]);
		},
	);
});
