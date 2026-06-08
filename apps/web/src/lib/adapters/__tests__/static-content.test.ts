// Static adapter — content method shape tests (slice-27.1 FIX B).
//
// Network-free, CI-runnable companion to the parity harness. Asserts:
//   FIX B: techStack.content('airflow') joins the 3 HTML blocks with '\n'
//          (matches directus.ts:2822 .join('\n')).
//
// Runs in the "data" Vitest project (Node env, $env stubbed to {}). The static
// adapter never touches the network, so importing it directly is safe here.

import { describe, expect, it } from 'vitest';

import { staticAdapter } from '$lib/adapters/static';
import { techStackItems } from '$lib/content/tech-stack';
import { serializeBlocksToHtml } from '@repo/shared';

// ---------------------------------------------------------------------------
// FIX B — techStack.content joins blocks with '\n' (not '')
// ---------------------------------------------------------------------------

describe('staticAdapter.techStack.content — join separator (FIX B)', () => {
	it('returns empty string for unknown id', async () => {
		const result = await staticAdapter.techStack.content('__no_such_id__');
		expect(result).toBe('');
	});

	it('techStack.content uses \\n separator between the 3 HTML blocks', async () => {
		// Find a real item that has all 3 fields populated.
		const item = techStackItems.find(
			(it) =>
				it.what_it_is.en &&
				it.what_i_use_it_for.en &&
				it.why_i_use_it_instead.en,
		);
		if (!item) {
			// Skip gracefully if the snapshot happens to be empty (dry-run test run).
			return;
		}

		const result = await staticAdapter.techStack.content(item.id);

		// Build expected using the same serializer + \n join (mirrors directus.ts:2822).
		const expected = [
			serializeBlocksToHtml(item.what_it_is.en),
			serializeBlocksToHtml(item.what_i_use_it_for.en),
			serializeBlocksToHtml(item.why_i_use_it_instead.en),
		].join('\n');

		expect(result).toBe(expected);
	});

	it('joined result contains a newline character between HTML blocks when blocks are non-empty', async () => {
		const item = techStackItems.find(
			(it) =>
				it.what_it_is.en &&
				it.what_i_use_it_for.en &&
				it.why_i_use_it_instead.en,
		);
		if (!item) return;

		const result = await staticAdapter.techStack.content(item.id);

		// The result must contain at least one '\n' when all 3 blocks are non-empty.
		const b1 = serializeBlocksToHtml(item.what_it_is.en);
		const b2 = serializeBlocksToHtml(item.what_i_use_it_for.en);
		const b3 = serializeBlocksToHtml(item.why_i_use_it_instead.en);
		if (b1 && b2 && b3) {
			expect(result).toContain('\n');
		}
	});
});
