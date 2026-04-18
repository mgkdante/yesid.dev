#!/usr/bin/env bun
/**
 * slice-close.ts — bun script that moves an active sub-slice bundle
 * from the repo to the cloud archive, then updates COMPLETED-SLICES.md.
 *
 * Invocation:
 *   bun run slice:close <sub-slice-id> [--name "<name>"] [--pr <pr-number>]
 *   bun run slice:close 17j --name "Workflow Efficiency" --pr 23
 *
 * Behavior:
 *   1. Parses <sub-slice-id> → parent slice ID + sub-slice id
 *   2. Validates the bundle at docs/slices/slice-<parent>/slice-<sub>/
 *      has spec.md + plan.md + log.md + handoff.md (all non-empty)
 *   3. Moves the folder to
 *      $YESITO_CLOUD_ROOT/yesid.dev/docs/archive/slices/slice-<parent>/slice-<sub>/
 *      (rename-if-same-volume, else cp+rm)
 *   4. Appends one row to $YESITO_CLOUD_ROOT/yesid.dev/docs/COMPLETED-SLICES.md
 *   5. Regenerates tree.txt (Windows-specific; skipped on other OS with message)
 *   6. Prints summary
 *
 * Env vars:
 *   YESITO_CLOUD_ROOT — local cloud directory root
 *     Windows default: C:\Users\<user>\Yesito\cloud
 *     Unix default:    ~/Yesito/cloud
 *     Falls back to path.join(os.homedir(), 'Yesito', 'cloud')
 *
 * Exit codes:
 *   0 success
 *   1 validation failure (missing file, empty file, bad args)
 *   2 filesystem error (dest exists, move failed, etc.)
 */

import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { appendFile, cp, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

type CloseArgs = {
  subsliceId: string;
  parentId: string;
  name?: string;
  pr?: string;
};

function parseArgs(argv: string[]): CloseArgs {
  const positional: string[] = [];
  const opts: Record<string, string> = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--name' || a === '--pr') {
      const value = argv[++i];
      if (!value) die(`Missing value for ${a}`, 1);
      opts[a.slice(2)] = value;
    } else if (a.startsWith('--')) {
      die(`Unknown flag: ${a}`, 1);
    } else {
      positional.push(a);
    }
  }

  if (positional.length === 0) {
    die(
      'Usage: bun run slice:close <sub-slice-id> [--name "<name>"] [--pr <pr-number>]\nExample: bun run slice:close 17j --name "Workflow Efficiency" --pr 23',
      1
    );
  }

  const subsliceId = positional[0];
  // Parse parent slice ID: leading digits (e.g., "17j" → "17", "09c-1" → "09")
  const parentMatch = subsliceId.match(/^(\d+)/);
  if (!parentMatch) {
    die(
      `Cannot determine parent slice from sub-slice id "${subsliceId}" (expected leading digits like "17j" or "09c-1")`,
      1
    );
  }
  const parentId = parentMatch[1];

  return { subsliceId, parentId, name: opts.name, pr: opts.pr };
}

function resolveCloudRoot(): string {
  const envRoot = process.env.YESITO_CLOUD_ROOT;
  if (envRoot && envRoot.trim() !== '') {
    return resolve(envRoot);
  }
  return join(homedir(), 'Yesito', 'cloud');
}

function resolveRepoRoot(): string {
  // This script lives at <repo>/scripts/slice-close.ts
  return resolve(import.meta.dir, '..');
}

function validateBundle(srcDir: string): void {
  if (!existsSync(srcDir)) {
    die(`Bundle not found at ${srcDir}`, 2);
  }
  const stat = statSync(srcDir);
  if (!stat.isDirectory()) {
    die(`Expected a directory at ${srcDir}`, 2);
  }

  const required = ['spec.md', 'plan.md', 'log.md', 'handoff.md'];
  for (const f of required) {
    const p = join(srcDir, f);
    if (!existsSync(p)) {
      die(`Missing required file: ${p}`, 1);
    }
    const fileStat = statSync(p);
    if (fileStat.size === 0) {
      die(`Required file is empty: ${p}`, 1);
    }
  }
}

async function moveBundle(srcDir: string, destDir: string): Promise<void> {
  if (existsSync(destDir)) {
    die(
      `Destination already exists: ${destDir}\nIf this sub-slice was previously closed, resolve manually before re-running.`,
      2
    );
  }

  mkdirSync(dirname(destDir), { recursive: true });

  try {
    await rename(srcDir, destDir);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    // Cross-volume or permission: fall back to recursive copy + remove
    if (code === 'EXDEV' || code === 'EACCES' || code === 'EPERM') {
      console.log(`[slice-close] rename failed (${code}); copying recursively`);
      await cp(srcDir, destDir, { recursive: true });
      rmSync(srcDir, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

async function appendToCompletedSlices(
  indexPath: string,
  args: CloseArgs
): Promise<void> {
  if (!existsSync(indexPath)) {
    console.warn(
      `[slice-close] WARNING: COMPLETED-SLICES.md not found at ${indexPath}\n  Skipping index append — add the entry manually after verifying the file exists.`
    );
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const name = args.name ?? '<TODO: fill name>';
  const pr = args.pr ? `#${args.pr}` : '<TODO: fill PR>';
  const line = `\n| slice-${args.subsliceId} | ${name} | ${today} | ${pr} | archive/slices/slice-${args.parentId}/slice-${args.subsliceId}/ |`;

  await appendFile(indexPath, line);
  console.log(`[slice-close] appended index line: ${line.trim()}`);
}

function regenTree(repoRoot: string): void {
  if (process.platform !== 'win32') {
    console.log(
      '[slice-close] tree.txt regen skipped (non-Windows). See <cloud>/claude-knowledge/os-quirks/<os>.md for the equivalent command.'
    );
    return;
  }
  try {
    const cmd =
      'cmd /c "tree /F /A | findstr /V /C:\\"node_modules\\" /C:\\".git\\" /C:\\".remember\\" /C:\\"bun.lockb\\" /C:\\".svelte-kit\\" /C:\\".vercel\\" /C:\\".DS_Store\\" > tree.txt"';
    execSync(cmd, { cwd: repoRoot, stdio: 'inherit' });
    console.log('[slice-close] tree.txt regenerated');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[slice-close] WARNING: tree.txt regen failed: ${message}`);
  }
}

function die(msg: string, code: number): never {
  console.error(`[slice-close] ERROR: ${msg}`);
  process.exit(code);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cloudRoot = resolveCloudRoot();
  const repoRoot = resolveRepoRoot();

  const srcDir = join(
    repoRoot,
    'docs',
    'slices',
    `slice-${args.parentId}`,
    `slice-${args.subsliceId}`
  );
  const destDir = join(
    cloudRoot,
    'yesid.dev',
    'docs',
    'archive',
    'slices',
    `slice-${args.parentId}`,
    `slice-${args.subsliceId}`
  );
  const indexPath = join(cloudRoot, 'yesid.dev', 'docs', 'COMPLETED-SLICES.md');

  console.log(`[slice-close] Closing sub-slice ${args.subsliceId}`);
  console.log(`  Parent slice: ${args.parentId}`);
  console.log(`  Cloud root:   ${cloudRoot}`);
  console.log(`  Source:       ${srcDir}`);
  console.log(`  Destination:  ${destDir}`);

  validateBundle(srcDir);
  await moveBundle(srcDir, destDir);
  await appendToCompletedSlices(indexPath, args);
  regenTree(repoRoot);

  console.log('');
  console.log('✓ Sub-slice closed successfully');
  console.log(`  Bundle moved: ${srcDir} → ${destDir}`);
  console.log(`  Index:        ${indexPath}`);
  console.log('');
  console.log('Next steps:');
  if (!args.name || !args.pr) {
    console.log(`  - Edit ${indexPath} to fill in TODO placeholders`);
  }
  console.log('  - Commit tree.txt if it changed');
  console.log(
    `  - Update docs/slices/slice-${args.parentId}/README.md sub-slice table + docs/slices/slice-${args.parentId}/CHECKPOINT.md if more sub-slices remain`
  );
  console.log(
    `  - If Slice ${args.parentId} is fully complete, delete docs/slices/slice-${args.parentId}/CHECKPOINT.md`
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[slice-close] FATAL:', message);
  process.exit(2);
});
