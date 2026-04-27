#!/usr/bin/env bun
/**
 * mirror-brand.ts — mirror the repo's brand/ directory to cloud.
 *
 * PURPOSE: Off-device brand reference (guide, foundations, logos,
 * decisions, examples). For Yesid's reading on phone / another
 * computer / without Claude Code — same use case as mirror-docs.ts
 * but for the brand-owning subtree.
 *
 * OPTIONAL per project. Only projects that own a brand identity
 * (websites, client deliverables, portfolio sites) need this.
 * SQL-pipeline projects, data-ops projects, etc. — skip.
 *
 * Usage:
 *   bun run brand:mirror
 *
 * Output:
 *   $YESITO_CLOUD_ROOT/<project-name>/brand/ (full replace)
 *
 * Notes:
 * - Full-replace (delete + copy) so deletions in repo propagate
 * - Includes markdown (BRAND.md, foundations/, decisions/) AND
 *   assets (logos/*.svg, logos/exports/*.png) — so brand visuals
 *   are viewable on any device
 * - NOT run automatically at slice close — invoke manually when
 *   brand changes land or before heading out
 */

import { existsSync, rmSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

function die(msg: string, code: number): never {
  console.error(`[brand:mirror] ERROR: ${msg}`);
  process.exit(code);
}

function resolveCloudRoot(): string {
  const env = process.env.YESITO_CLOUD_ROOT;
  if (env && env.trim() !== '') return resolve(env);
  return join(homedir(), 'Yesito', 'cloud');
}

function resolveRepoRoot(): string {
  // import.meta.dir = apps/web/scripts; repo root is two levels up.
  return resolve(import.meta.dir, '../..');
}

async function main(): Promise<void> {
  const cloudRoot = resolveCloudRoot();
  const repoRoot = resolveRepoRoot();
  const projectName = 'yesid.dev'; // Update when porting to another project

  const brandSrc = join(repoRoot, 'brand');
  const brandDest = join(cloudRoot, projectName, 'brand');

  if (!existsSync(brandSrc)) {
    die(`No brand/ directory found at ${brandSrc}. If this project doesn't have a brand subtree, this script is not needed.`, 1);
  }

  console.log(`[brand:mirror] Mirroring brand → cloud`);
  console.log(`  Source: ${brandSrc}`);
  console.log(`  Destination: ${brandDest}\n`);

  if (existsSync(brandDest)) {
    rmSync(brandDest, { recursive: true, force: true });
  }
  cpSync(brandSrc, brandDest, { recursive: true });

  console.log(`  ✓ brand/ mirrored (full replace)`);
  console.log('\n✓ Brand mirrored to cloud.');
  console.log('  Includes: BRAND.md, foundations/, decisions/, components.md, logos/ (SVG + PNG exports), examples/, scripts/');
  console.log('  Available for off-device brand reference.');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[brand:mirror] FATAL:', message);
  process.exit(2);
});
