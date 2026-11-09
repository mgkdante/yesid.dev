import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

// Scan source manifests, excluding Git metadata and installed dependencies.
export function guard(root: string): string[] {
	const errors: string[] = [];
	function visit(directory: string): void {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.name === 'package.json') {
				const file = relative(root, path).replaceAll('\\', '/');
				try {
					const manifest = JSON.parse(readFileSync(path, 'utf8'));
					if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Expected manifest object');
					for (const field of dependencyFields) {
						const dependencies = manifest[field];
						if (dependencies === undefined) continue;
						if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) throw new Error(`Invalid ${field}`);
						for (const [name, candidate] of Object.entries(dependencies)) {
							if (!name.startsWith('@yesid/')) continue;
							if (typeof candidate !== 'string') throw new Error(`Invalid dependency ${name}`);
							// Match prereleases in version ranges, release tags and tarball filenames.
							if (/\d+\.\d+\.\d+-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*/.test(decodeURIComponent(candidate))) {
								errors.push(`${file}: ${name} points at ${candidate}. The PR may rehearse on a candidate but can merge only after switching to the stable release.`);
							}
						}
					}
				} catch (error) {
					errors.push(`${file}: Cannot read or parse manifest: ${error}`);
				}
			} else if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules') visit(path);
		}
	}
	visit(root);
	return errors;
}

if (import.meta.main) {
	try {
		const errors = guard(process.cwd());
		process.stdout.write(errors.length ? `${errors.join('\n')}\n` : 'Design dependencies use stable releases\n');
		process.exitCode = errors.length ? 1 : 0;
	} catch (error) {
		process.stderr.write(`Cannot scan repository manifests: ${error}\n`);
		process.exitCode = 1;
	}
}
