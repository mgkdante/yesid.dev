import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../../..');
const e164NanpPhone = /(?<![A-Za-z0-9])[+]?1\d{10}(?![A-Za-z0-9])/g;
const reservedFictionalPhone = /^[+]?1\d{3}55501\d{2}$/;

describe('public repository contact privacy', () => {
	test('contains no non-fictional NANP phone values', () => {
		const grep = spawnSync(
			'git',
			[
				'grep',
				'-Il',
				'-E',
				'(^|[^[:alnum:]])[+]?1[0-9]{10}([^[:alnum:]]|$)',
				'--',
				'.',
			],
			{
				cwd: repoRoot,
				encoding: 'utf8',
			},
		);
		expect([0, 1]).toContain(grep.status);
		const trackedFiles = grep.stdout.trim().split('\n').filter(Boolean);
		const violatingFiles = new Set<string>();

		for (const path of trackedFiles) {
			const matches = readFileSync(resolve(repoRoot, path), 'utf8').match(e164NanpPhone) ?? [];
			if (matches.some((phone) => !reservedFictionalPhone.test(phone))) {
				violatingFiles.add(path);
			}
		}

		expect([...violatingFiles].sort()).toEqual([]);
	});
});
