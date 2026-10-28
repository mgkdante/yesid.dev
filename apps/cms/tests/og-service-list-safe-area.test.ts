import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
// The cards draw the service list in the token palette's muted text.
const tokens = JSON.parse(readFileSync(join(REPO_ROOT, 'apps/web/vendor/design/tokens/tokens.json'), 'utf8'));
const muted: string = tokens.color.dark['muted-foreground'].$value;
const MUTED = { r: parseInt(muted.slice(1, 3), 16), g: parseInt(muted.slice(3, 5), 16), b: parseInt(muted.slice(5, 7), 16) };

function closeToMuted(r: number, g: number, b: number): boolean {
	return Math.abs(r - MUTED.r) <= 8 && Math.abs(g - MUTED.g) <= 8 && Math.abs(b - MUTED.b) <= 8;
}

function filesUnder(root: string, relative = ''): string[] {
	return readdirSync(join(root, relative), { withFileTypes: true }).flatMap((entry) => {
		const path = join(relative, entry.name);
		return entry.isDirectory() ? filesUnder(root, path) : [path];
	});
}

describe('OG card generation contract', () => {
	test('generates every committed card as a card-size PNG and keeps service rows inside the 80px margin', async () => {
		const output = mkdtempSync(join(tmpdir(), 'yesid-og-safe-area-'));
		try {
			const child = Bun.spawn(
				[process.execPath, 'apps/web/scripts/generate-og-cards.ts', '--out', output],
				{ cwd: REPO_ROOT, stdout: 'pipe', stderr: 'pipe' },
			);
			const exitCode = await child.exited;
			const stderr = await new Response(child.stderr).text();
			expect(exitCode, stderr).toBe(0);

			for (const locale of ['en', 'fr', 'es'] as const) {
				const suffix = locale === 'en' ? '' : `.${locale}`;
				const { data, info } = await sharp(join(output, `routes/services${suffix}.png`))
					.raw()
					.toBuffer({ resolveWithObject: true });

				let rightmost = -1;
				for (let y = 250; y < 460; y += 1) {
					for (let x = 776; x < info.width; x += 1) {
						const offset = (y * info.width + x) * info.channels;
						if (closeToMuted(data[offset]!, data[offset + 1]!, data[offset + 2]!)) {
							rightmost = Math.max(rightmost, x);
						}
					}
				}
				expect(rightmost, `${locale} rightmost muted pixel`).toBeGreaterThan(776);
				expect(rightmost, `${locale} rightmost muted pixel`).toBeLessThan(1120);
			}

			// The generator owns every committed card: the same set, each a card-size PNG within budget.
			const generatedFiles = filesUnder(output).sort();
			expect(generatedFiles).toEqual(filesUnder(join(REPO_ROOT, 'apps/web/static/og')).sort());
			for (const relativePath of generatedFiles) {
				const generatedPath = join(output, relativePath);
				expect(statSync(generatedPath).size, `${relativePath} byte budget`).toBeLessThan(
					150_000,
				);
				const metadata = await sharp(generatedPath).metadata();
				expect([metadata.format, metadata.width, metadata.height], relativePath).toEqual([
					'png',
					1200,
					630,
				]);
			}
		} finally {
			rmSync(output, { recursive: true, force: true });
		}
	}, 30_000);
});
