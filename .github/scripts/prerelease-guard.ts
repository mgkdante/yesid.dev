import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'overrides', 'resolutions'];
const rehearsal = 'The PR may rehearse on a candidate but can merge only after switching to the stable release.';
const stableTarball = /^https:\/\/github\.com\/mgkdante\/yesid\.design\/releases\/download\/v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))\/yesid-([a-z0-9._-]+)-\1\.tgz$/;
const packageNames = (key: string) => [...key.matchAll(/@yesid\/([a-z0-9._-]+)/g)].map(match => match[1]).slice(-1);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function guard(root: string): string[] {
	const errors: string[] = [];
	let release: string | undefined;
	function entries(file: string, field: string, values: Record<string, unknown>, inherited: string[] = []): void {
		for (const [key, value] of Object.entries(values)) {
			const names = key === '.' ? inherited : packageNames(key);
			if (object(value)) {
				if (names.length && (!field.startsWith('overrides') || !Object.hasOwn(value, '.'))) {
					errors.push(`${file}: ${field}, key ${JSON.stringify(key)}, value ${JSON.stringify(value)}: expected an exact stable release tarball URL. ${rehearsal}`);
				}
				entries(file, `${field}[${JSON.stringify(key)}]`, value, names);
				continue;
			}
			const alias = typeof value === 'string' ? value.match(/^npm:@yesid\/([a-z0-9._-]+)/) : null;
			if (!names.length && !alias && !(typeof value === 'string' && value.includes('yesid.design/releases/download/'))) continue;
			const diagnostic = `${file}: ${field}, key ${JSON.stringify(key)}, value ${JSON.stringify(value)}`;
			const match = typeof value === 'string' ? stableTarball.exec(value) : null;
			const expected = alias ? [alias[1]] : names.length ? names : [key];
			if (!match || match[0] !== value || expected.some(name => name !== match[2])) {
				errors.push(`${diagnostic}: expected an exact stable release tarball URL matching the package. ${rehearsal}`);
			} else if (release && release !== match[1]) {
				errors.push(`${diagnostic}: expected lockstep release ${release}, received ${match[1]}. ${rehearsal}`);
			} else release = match[1];
		}
	}
	function manifest(path: string): void {
		const file = relative(root, path).replaceAll('\\', '/');
		try {
			const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
			if (!object(value)) throw new Error('Expected manifest object');
			for (const field of fields) {
				if (value[field] === undefined) continue;
				if (!object(value[field])) throw new Error(`Invalid ${field}`);
				entries(file, field, value[field]);
			}
		} catch (error) {
			errors.push(`${file}: Cannot read or parse manifest: ${error}`);
		}
	}
	function visit(directory: string): void {
		try {
			for (const entry of readdirSync(directory, { withFileTypes: true })) {
				const path = join(directory, entry.name);
				if (entry.name === 'package.json') manifest(path);
				else if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules') visit(path);
			}
		} catch (error) {
			errors.push(`${directory}: Cannot walk repository manifests: ${error}`);
		}
	}
	visit(root);
	return errors;
}

if (import.meta.main) {
	const errors = guard(process.cwd());
	process.stdout.write(errors.length ? `${errors.join('\n')}\n` : 'Design dependencies use one exact stable release\n');
	process.exitCode = errors.length ? 1 : 0;
}
