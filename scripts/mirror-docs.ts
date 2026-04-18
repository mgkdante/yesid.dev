#!/usr/bin/env bun
/**
 * mirror-docs.ts — mirror the live repo's docs/ subtrees to cloud.
 *
 * PURPOSE: Yesid's off-device access to current project docs.
 * When Yesid is on a phone, another computer, or anywhere WITHOUT
 * Claude Code open, he can browse the cloud directory directly
 * (file manager, VS Code, Obsidian mobile, etc.) and read the
 * current state of the project.
 *
 * Keeps <cloud>/yesid.dev/docs/{reference,roadmap,slices,sessions}/
 * in lockstep with the repo's current state. Full-replace — source
 * is truth; cloud copies follow.
 *
 * Usage:
 *   bun run docs:mirror              # mirrors all live subtrees
 *   bun run docs:mirror --only reference
 *
 * When to run:
 * - End of every working session (recommended)
 * - At every slice close (added to WORKFLOW.md closing checklist)
 * - Manually when heading out and wanting fresh docs on phone
 *
 * Notes:
 * - Does NOT touch <cloud>/yesid.dev/docs/archive/ (historical, frozen)
 * - Does NOT touch COMPLETED-SLICES.md or INDEX.md (cloud-authored)
 * - Full-replace (delete + copy) so deletions in repo propagate to cloud
 * - Safe on Windows (no robocopy quirks), macOS, Linux
 */

import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_SUBTREES = ['reference', 'roadmap', 'slices', 'sessions'] as const;

function die(msg: string, code: number): never {
  console.error(`[docs:mirror] ERROR: ${msg}`);
  process.exit(code);
}

function parseArgs(argv: string[]): { only?: string } {
  const opts: { only?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') opts.only = argv[++i];
    else if (a.startsWith('--')) die(`Unknown flag: ${a}`, 1);
  }
  return opts;
}

function resolveCloudRoot(): string {
  const env = process.env.YESITO_CLOUD_ROOT;
  if (env && env.trim() !== '') return resolve(env);
  return join(homedir(), 'Yesito', 'cloud');
}

function resolveRepoRoot(): string {
  return resolve(import.meta.dir, '..');
}

function mirror(subtree: string, repoRoot: string, cloudDocs: string): void {
  const src = join(repoRoot, 'docs', subtree);
  const dest = join(cloudDocs, subtree);

  if (!existsSync(src)) {
    console.log(`  - ${subtree}/ (not in repo, skipping)`);
    return;
  }

  // Full replace: delete dest, copy src
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  cpSync(src, dest, { recursive: true });

  console.log(`  ✓ ${subtree}/`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cloudRoot = resolveCloudRoot();
  const repoRoot = resolveRepoRoot();
  const cloudDocs = join(cloudRoot, 'yesid.dev', 'docs');

  if (!existsSync(cloudDocs)) {
    mkdirSync(cloudDocs, { recursive: true });
  }

  console.log(`[docs:mirror] Mirroring live docs → cloud`);
  console.log(`  Source: ${repoRoot}/docs/`);
  console.log(`  Destination: ${cloudDocs}/`);
  console.log('');

  const subtrees = args.only ? [args.only] : DEFAULT_SUBTREES;

  for (const subtree of subtrees) {
    mirror(subtree, repoRoot, cloudDocs);
  }

  // Also mirror root-level md files that belong with docs (ARCHIVE.md, README.md)
  for (const file of ['ARCHIVE.md', 'README.md']) {
    const src = join(repoRoot, 'docs', file);
    const dest = join(cloudDocs, file);
    if (existsSync(src)) {
      cpSync(src, dest);
      console.log(`  ✓ ${file}`);
    }
  }

  console.log('\n✓ Live docs mirrored to cloud.');
  console.log('  Archive subtree (<cloud>/.../docs/archive/) untouched — historical is preserved.');
  console.log('  Tier 3 indexes (COMPLETED-SLICES.md, INDEX.md) untouched.');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[docs:mirror] FATAL:', message);
  process.exit(2);
});
