#!/usr/bin/env bun
/**
 * session-stop.ts — SessionStop hook: migrate completed .jsonl transcripts
 * to the Notion Conversations DB, then delete the source files on success.
 *
 * Invoked by Claude Code's SessionStop hook:
 *   bun C:\Users\otalo\Yesito\Projects\yesid.dev\apps\web\scripts\notion-hooks\session-stop.ts
 *
 * Requires: NOTION_INTEGRATION_TOKEN env var (see lib/notion-client.ts for setup).
 *
 * Behaviour:
 *   1. Scan PROJECT_DIR for *.jsonl files older than IN_FLIGHT_THRESHOLD_MS.
 *   2. For each: spawn `bun <MIGRATE_SCRIPT> <file>`.
 *   3. On exit code 0 → delete the .jsonl.
 *   4. On failure → log error and continue (do NOT delete).
 *
 * Safety: The in-flight threshold (60s) prevents deleting the CURRENT session's
 * .jsonl, which is still being written when the hook fires.
 *
 * Log: ~/.claude/logs/notion-hooks.log (append mode)
 */

import { readdir, stat, unlink, mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_HASH = 'C--Users-otalo-Yesito-Projects-yesid-dev';
const PROJECT_DIR = join(homedir(), '.claude', 'projects', PROJECT_HASH);
const LOG_DIR = join(homedir(), '.claude', 'logs');
const LOG_PATH = join(LOG_DIR, 'notion-hooks.log');
const MIGRATE_SCRIPT =
  'C:\\Users\\otalo\\Yesito\\Projects\\yesid.dev\\apps\\web\\scripts\\notion-hooks\\migrate-conversations.ts';
/** Files modified within this window are still in-flight (current session). */
const IN_FLIGHT_THRESHOLD_MS = 60_000;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

async function log(msg: string): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const line = `[${new Date().toISOString()}] session-stop: ${msg}\n`;
    await appendFile(LOG_PATH, line, 'utf-8');
  } catch {
    // Log failures are non-fatal
  }
}

// ---------------------------------------------------------------------------
// Spawn migrate-conversations.ts for one .jsonl file
// Returns exit code (0 = success)
// ---------------------------------------------------------------------------

function runMigrateScript(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('bun', [MIGRATE_SCRIPT, filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    child.on('close', async (code: number | null) => {
      const exitCode = code ?? 1;
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf-8').trim();

      if (stdout) await log(`  stdout: ${stdout}`);
      if (stderr) await log(`  stderr: ${stderr}`);

      resolve(exitCode);
    });

    child.on('error', async (err: Error) => {
      await log(`  spawn error: ${err.message}`);
      resolve(1);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await log('session-stop starting');

  let files: string[];
  try {
    const entries = await readdir(PROJECT_DIR);
    files = entries.filter((e) => e.endsWith('.jsonl'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await log(`ERROR reading project dir: ${msg}`);
    process.exit(0);
  }

  const now = Date.now();
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = join(PROJECT_DIR, filename);

    // Check modification time — skip in-flight files
    let mtime: number;
    try {
      const info = await stat(filePath);
      mtime = info.mtimeMs;
    } catch {
      // File may have disappeared — skip
      continue;
    }

    const ageMs = now - mtime;
    if (ageMs < IN_FLIGHT_THRESHOLD_MS) {
      await log(`skip in-flight: ${filename} (${Math.round(ageMs / 1000)}s old)`);
      skipped++;
      continue;
    }

    await log(`migrating: ${filename}`);
    const exitCode = await runMigrateScript(filePath);

    if (exitCode === 0) {
      try {
        await unlink(filePath);
        await log(`deleted: ${filename}`);
        migrated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await log(`ERROR deleting ${filename}: ${msg}`);
        failed++;
      }
    } else {
      await log(`migration failed (exit ${exitCode}): ${filename} — keeping file`);
      failed++;
    }
  }

  await log(
    `session-stop done — migrated: ${migrated}, skipped (in-flight): ${skipped}, failed: ${failed}`
  );
}

// ---------------------------------------------------------------------------
// Entry point — always exit 0 so Claude Code continues
// ---------------------------------------------------------------------------

main().catch(async (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  await log(`FATAL: ${msg}`);
  process.exit(0);
});
