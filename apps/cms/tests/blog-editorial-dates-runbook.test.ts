import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RUNBOOK_PATH = resolve(
	import.meta.dir,
	'../ops/blog/blog-editorial-dates.md',
);
const OP_MARKER = '__OP_STUB_CALLED__';

function extractCredentialWrapper(): string {
	const runbook = readFileSync(RUNBOOK_PATH, 'utf8');
	const wrapper = runbook.match(/^with_yesid_op\(\) \(\n[\s\S]*?^\)$/m)?.[0];
	if (!wrapper) throw new Error('with_yesid_op wrapper not found in runbook');
	return wrapper;
}

describe('blog editorial date runbook credential wrapper', () => {
	it('uses a configurable repository-local credential file', () => {
		const wrapper = extractCredentialWrapper();

		expect(wrapper).toContain('YESID_ENV_FILE');
		expect(wrapper).toContain('${YESID_ENV_FILE:-.env}');
		expect(wrapper).not.toContain('Yesito/projects');
	});

	it('fails closed before op when OP_TOKEN is missing', () => {
		const script = `${extractCredentialWrapper()}

sed() {
	return 0
}

op() {
	printf '%s\\n' '${OP_MARKER}'
	return 0
}

with_yesid_op true
`;
		const result = Bun.spawnSync({
			cmd: ['bash'],
			stdin: Buffer.from(script),
			stdout: 'pipe',
			stderr: 'pipe',
		});
		const stdout = new TextDecoder().decode(result.stdout);
		const stderr = new TextDecoder().decode(result.stderr);

		expect({
			exitCode: result.exitCode,
			opCalled: stdout.includes(OP_MARKER),
			actionableError: stderr.includes(
				'[blog-editorial-dates] missing OP_TOKEN',
			),
		}).toEqual({
			exitCode: 1,
			opCalled: false,
			actionableError: true,
		});
	});
});
