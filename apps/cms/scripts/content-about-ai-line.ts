#!/usr/bin/env bun
/**
 * content-about-ai-line.ts
 *
 * Launch Phase 1, item 27 (S2: AI positioning = tool mention only): add the
 * one honest AI line to the About page terminal CTA, right after the
 * "> Ready for new projects" line and before the contact lines.
 *
 *   > AI-accelerated, human-owned
 *
 * cta_lines is a locale-invariant JSON repeater on the block_about_content
 * parent row; every existing line is EN terminal output by design.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

const log = createLogger('about-ai-line');

const AI_LINE = { color: 'muted', text: '> AI-accelerated, human-owned' } as const;
/** Insert after "> Ready for new projects" (index 0). */
const INSERT_AT = 1;

interface CtaLine {
	color: string;
	text: string;
}

/** Idempotent insert. Exported for guarded orchestration; the caller owns the URL guard. */
export async function apply(ctx: ApplyContext): Promise<void> {
	const res = await rest(ctx, 'GET', '/items/block_about_content?fields=cta_lines');
	if (res.status >= 400) {
		throw new Error(`GET block_about_content failed (${res.status}): ${JSON.stringify(res.json)}`);
	}
	const lines = (res.json?.data?.cta_lines ?? []) as CtaLine[];
	if (lines.some((l) => l.text.includes('AI-accelerated'))) {
		log.info('  skip: the AI line is already present');
		return;
	}
	const next = [...lines.slice(0, INSERT_AT), { ...AI_LINE }, ...lines.slice(INSERT_AT)];
	const patch = await rest(ctx, 'PATCH', '/items/block_about_content', { cta_lines: next });
	if (patch.status >= 400) {
		throw new Error(`PATCH block_about_content failed (${patch.status}): ${JSON.stringify(patch.json)}`);
	}
	log.info(`  ok cta_lines ${lines.length} -> ${next.length} lines`);
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: insert cta_lines[${INSERT_AT}] = "${AI_LINE.text}" (${AI_LINE.color}) on block_about_content`);
	if (!apply_) {
		log.info('dry-run complete. Pass --apply to write.');
		return;
	}
	const token = await getAdminToken(url);
	await apply({ directusUrl: url, token });
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[about-ai-line] FAILED:', error);
		process.exit(1);
	});
}
