import { fileURLToPath } from 'node:url';
import profile from './e2e-durations.json';

type Shard = { files: string[]; durationMs: number };
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function assignFiles(files: string[], durations: Record<string, number>, count = 4): Shard[] {
	if (!Number.isInteger(count) || count < 1 || count > files.length) throw new Error('Invalid shard count');
	if (new Set(files).size !== files.length) throw new Error('Duplicate test file');
	if (files.some(file => !/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\\0]+\.spec\.ts$/.test(file))) {
		throw new Error('Expected relative POSIX spec paths');
	}
	const measured = Object.values(durations).sort((a, b) => a - b);
	if (!measured.length || measured.some(value => !Number.isFinite(value) || value <= 0)) {
		throw new Error('Expected positive finite measured durations');
	}
	// Include new files using the measured median until a fresh profile records them.
	const fallback = measured[Math.floor(measured.length / 2)]!;
	const weight = (file: string) => durations[file] ?? fallback;
	const shards: Shard[] = Array.from({ length: count }, () => ({ files: [], durationMs: 0 }));
	for (const file of [...files].sort((a, b) => weight(b) - weight(a) || compare(a, b))) {
		const target = shards.reduce((best, shard) => shard.durationMs < best.durationMs ? shard : best);
		target.files.push(file);
		target.durationMs += weight(file);
	}
	return shards;
}

export function filePattern(file: string): string {
	// Playwright positional arguments are regexes, not literal filenames.
	const path = file.split('/').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[/\\\\]');
	return `(?:^|[/\\\\])${path}$`;
}

if (import.meta.main) {
	const index = Number(process.argv[2]);
	if (!Number.isInteger(index) || index < 1 || index > 4) throw new Error('Expected shard 1, 2, 3 or 4');
	const web = fileURLToPath(new URL('../../apps/web/', import.meta.url));
	const files = Array.from(new Bun.Glob('**/*.spec.ts').scanSync({ cwd: `${web}/tests` }), file => file.replaceAll('\\', '/'));
	const shards = assignFiles(files, profile.durationMs);
	const selected = shards[index - 1]!;
	process.stderr.write(`Shard ${index}/4: ${selected.files.length} files, ${(selected.durationMs / 1000).toFixed(1)} measured serial seconds\n`);
	const child = Bun.spawn(['bun', 'x', 'playwright', 'test', ...selected.files.map(filePattern), ...process.argv.slice(3)], {
		cwd: web, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
	});
	process.exitCode = await child.exited;
}
