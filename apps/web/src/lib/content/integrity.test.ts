import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

it('every walked content module belongs to the exporter registry', () => {
	// Bun loads the CMS registry without pulling CMS types into the web program.
	// No source fetches, authentication, image preparation or writes are performed.
	const registered: string[] = JSON.parse(
		execFileSync(
			'bun',
			[
				'--no-env-file',
				'--eval',
				`
		import { basename } from 'node:path';
		import { buildEmitConfigs } from './apps/cms/scripts/lib/emitters/configs.ts';
		import fixture from './packages/shared/fixtures/export-data.json';
		console.log(JSON.stringify(buildEmitConfigs({ ...fixture.data, mediaAssets: {}, mediaVariants: {} }, '.')
			.map(config => basename(config.filePath))));
	`,
			],
			{
				cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
				encoding: 'utf8',
			},
		),
	);
	const walked = Object.keys(
		import.meta.glob(['./*.ts', '!./*.test.ts', '!./index.ts']),
	).map((path) => path.slice(2));
	expect(walked.sort()).toEqual(registered.sort());
});
