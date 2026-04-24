#!/usr/bin/env bun
/**
 * archive-conversations.ts — archive old Claude Code conversation transcripts
 * for the current project to cloud, keeping only the current session.
 *
 * PURPOSE: Clean up the desktop app's conversation picker without losing
 * access to historical sessions. Moves old .jsonl transcripts + their
 * state folders from ~/.claude/projects/<project-hash>/ to
 * <cloud>/claude-config/user/<date>-<project>-conversation-archive/.
 *
 * Preserves:
 * - The CURRENT session (identified by freshest .jsonl mtime)
 * - memory/ subdirectory (auto-memory knowledge base — DO NOT MOVE)
 *
 * Usage:
 *   bun run conversations:archive                # move all but current + memory
 *   bun run conversations:archive --dry-run      # show what would move
 *   bun run conversations:archive --keep-last 5  # keep 5 most recent sessions
 *
 * OS-agnostic (Bun). Uses $YESITO_CLOUD_ROOT env var.
 *
 * Safety:
 * - Files are MOVED to cloud, not deleted. Reversible via `cp` back.
 * - Preserves `memory/` — your persistent auto-memory is never touched.
 * - --dry-run first is recommended on first use.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, renameSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { homedir } from 'node:os';

function die(msg: string, code: number): never {
  console.error(`[archive-conversations] ERROR: ${msg}`);
  process.exit(code);
}

function parseArgs(argv: string[]): { dryRun: boolean; keepLast: number } {
  const opts = { dryRun: false, keepLast: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--keep-last') {
      const v = argv[++i];
      if (!v) die('Missing value for --keep-last', 1);
      opts.keepLast = Number(v);
      if (!Number.isFinite(opts.keepLast) || opts.keepLast < 1) {
        die(`--keep-last must be a positive integer, got ${v}`, 1);
      }
    } else if (a.startsWith('--')) die(`Unknown flag: ${a}`, 1);
  }
  return opts;
}

function resolveCloudRoot(): string {
  const env = process.env.YESITO_CLOUD_ROOT;
  if (env && env.trim() !== '') return resolve(env);
  return join(homedir(), 'Yesito', 'cloud');
}

function projectHashFromCwd(cwd: string): string {
  // Claude Code hashes project dir paths by replacing colons, slashes, AND dots with dashes
  // Windows: C:\Users\otalo\Yesito\Projects\yesid.dev → C--Users-otalo-Yesito-Projects-yesid-dev
  // Unix:    /Users/otalo/Yesito/Projects/yesid.dev  → -Users-otalo-Yesito-Projects-yesid-dev
  return cwd.replace(/[:\\/.]/g, '-');
}

function projectNameFromCwd(cwd: string): string {
  return basename(cwd);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const cloudRoot = resolveCloudRoot();
  const projectHash = projectHashFromCwd(cwd);
  const projectName = projectNameFromCwd(cwd);

  const sessionsDir = join(homedir(), '.claude', 'projects', projectHash);

  if (!existsSync(sessionsDir)) {
    die(`No Claude Code sessions directory found at ${sessionsDir}. Is this a Claude Code project?`, 1);
  }

  console.log(`[archive-conversations] Project: ${projectName}`);
  console.log(`  Sessions dir: ${sessionsDir}`);
  console.log(`  Cloud root:   ${cloudRoot}`);
  console.log(`  Keep last:    ${args.keepLast} session(s)`);
  console.log(`  Dry-run:      ${args.dryRun}\n`);

  // Gather all .jsonl files with mtime
  const entries = readdirSync(sessionsDir, { withFileTypes: true });
  const jsonlFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
    .map((e) => ({
      name: e.name,
      uuid: e.name.replace(/\.jsonl$/, ''),
      mtime: statSync(join(sessionsDir, e.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime); // newest first

  if (jsonlFiles.length === 0) {
    console.log('No conversation transcripts found. Nothing to archive.');
    return;
  }

  const keepUuids = new Set(jsonlFiles.slice(0, args.keepLast).map((f) => f.uuid));
  const archiveUuids = new Set(jsonlFiles.slice(args.keepLast).map((f) => f.uuid));

  console.log(`Found ${jsonlFiles.length} transcript(s). Keeping ${keepUuids.size}, archiving ${archiveUuids.size}.\n`);

  if (archiveUuids.size === 0) {
    console.log('Nothing to archive.');
    return;
  }

  console.log('KEEP:');
  for (const f of jsonlFiles.slice(0, args.keepLast)) {
    const date = new Date(f.mtime).toISOString().slice(0, 16).replace('T', ' ');
    console.log(`  ${f.name.slice(0, 12)}… (modified ${date})`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const archiveDir = join(
    cloudRoot,
    'claude-config',
    'user',
    `${today}-${projectName}-conversation-archive`
  );

  if (args.dryRun) {
    console.log(`\n[dry-run] Would create archive at: ${archiveDir}`);
    console.log(`[dry-run] Would move ${archiveUuids.size} transcript(s) + associated state folders:`);
    for (const entry of entries) {
      if (entry.name === 'memory') continue;
      const uuid = entry.name.replace(/\.jsonl$/, '');
      if (archiveUuids.has(uuid)) {
        console.log(`  → ${entry.name}`);
      }
    }
    console.log('\nRun without --dry-run to execute.');
    return;
  }

  // Create archive dir
  mkdirSync(archiveDir, { recursive: true });

  // Move entries
  let moved = 0;
  for (const entry of entries) {
    if (entry.name === 'memory') continue; // always preserve
    const uuid = entry.name.replace(/\.jsonl$/, '');
    if (!archiveUuids.has(uuid)) continue;

    const src = join(sessionsDir, entry.name);
    const dest = join(archiveDir, entry.name);

    try {
      renameSync(src, dest);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'EXDEV' || code === 'EPERM' || code === 'EACCES') {
        // Cross-volume fallback: copy + delete
        const { cpSync } = await import('node:fs');
        cpSync(src, dest, { recursive: true });
        rmSync(src, { recursive: true, force: true });
      } else {
        throw err;
      }
    }
    moved++;
  }

  console.log(`\n✓ Archived ${moved} entries to ${archiveDir}`);
  console.log(`  memory/ preserved at ${sessionsDir}/memory/ (untouched)`);
  console.log('\nTo restore a specific conversation later:');
  console.log(`  cp "${archiveDir}/<uuid>.jsonl" "${sessionsDir}/"`);
  console.log(`  (then restart Claude Code to see it in the conversation picker)`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[archive-conversations] FATAL:', message);
  process.exit(2);
});
