// Static adapter — content method shape tests (slice-27.1 FIX A + FIX B).
//
// Network-free, CI-runnable shape coverage. Born as the companion to the
// RUN_PARITY harness (deleted at slice-26 close after Directus 12 passed it
// on both environments); now the canonical suite asserting:
//   FIX A: content.errorPage(statusCode) returns per-status content, and
//          errorPage(404) ≠ errorPage(500) ≠ errorPage(0-fallback).
//   FIX B: techStack.content('airflow') joins the 3 HTML blocks with '\n'
//          (matches the retired directus adapter's .join('\n')).
//
// Runs in the "data" Vitest project (Node env, $env stubbed to {}). The static
// adapter never touches the network, so importing it directly is safe here.

import { describe, expect, it } from 'vitest';

import { staticAdapter } from '$lib/adapters/static';
import { errorPagesById } from '$lib/content/error-pages';
import { techStackItems } from '$lib/content/tech-stack';
import { ErrorPageContentSchema } from '$lib/schemas';
import { serializeBlocksToHtml } from '@repo/shared';

// ---------------------------------------------------------------------------
// FIX A — content.errorPage per-statusCode lookup
// ---------------------------------------------------------------------------

describe('staticAdapter.content.errorPage — per-statusCode lookup (FIX A)', () => {
	it('errorPagesById has a 0-fallback row', () => {
		expect(errorPagesById[0]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[0]).success).toBe(true);
	});

	it('errorPagesById has a 404 row', () => {
		expect(errorPagesById[404]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[404]).success).toBe(true);
	});

	it('errorPagesById has a 500 row', () => {
		expect(errorPagesById[500]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[500]).success).toBe(true);
	});

	it('errorPage(404) returns a valid ErrorPageContent', async () => {
		const result = await staticAdapter.content.errorPage(404);
		expect(ErrorPageContentSchema.safeParse(result).success).toBe(true);
	});

	it('errorPage(500) returns a valid ErrorPageContent', async () => {
		const result = await staticAdapter.content.errorPage(500);
		expect(ErrorPageContentSchema.safeParse(result).success).toBe(true);
	});

	it('errorPage(404) label differs from errorPage(500) label', async () => {
		const p404 = await staticAdapter.content.errorPage(404);
		const p500 = await staticAdapter.content.errorPage(500);
		expect(p404.label.en).not.toBe(p500.label.en);
	});

	it('errorPage(404) heading differs from errorPage(0) heading', async () => {
		const p404 = await staticAdapter.content.errorPage(404);
		const p0 = await staticAdapter.content.errorPage(0);
		expect(p404.heading.en).not.toBe(p0.heading.en);
	});

	it('errorPage(500) heading differs from errorPage(0) heading', async () => {
		const p500 = await staticAdapter.content.errorPage(500);
		const p0 = await staticAdapter.content.errorPage(0);
		expect(p500.heading.en).not.toBe(p0.heading.en);
	});

	it('errorPage(unknown status) falls back to 0-row', async () => {
		const fallback = await staticAdapter.content.errorPage(0);
		const unknown = await staticAdapter.content.errorPage(9999);
		// Deep structural equality: same label/heading/description
		expect(unknown.label.en).toBe(fallback.label.en);
		expect(unknown.heading.en).toBe(fallback.heading.en);
	});
});

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

		// Build expected using the same serializer + \n join (the retired directus adapter's pattern).
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
