/**
 * session-start.ts — SessionStart hook: pulls Notion Memory page → local md files.
 *
 * Invoked by Claude Code's SessionStart hook:
 *   bun C:\Users\otalo\Yesito\Projects\yesid.dev\apps\web\scripts\notion-hooks\session-start.ts
 *
 * Requires: NOTION_INTEGRATION_TOKEN env var (see lib/notion-client.ts for setup).
 *
 * On success: writes/updates all Memory child pages as .md files under LOCAL_MEMORY_DIR,
 *             writes MEMORY.md from the Memory page body, deletes orphan .md files.
 * On failure: logs error and exits 0 (graceful degradation — Claude Code continues).
 *
 * Log: ~/.claude/logs/notion-hooks.log (append mode)
 */

import { mkdir, readdir, writeFile, unlink, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fetchPageChildren, fetchPageMarkdown } from './lib/notion-client.ts';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_HASH = 'C--Users-otalo-Yesito-Projects-yesid-dev';
const MEMORY_PARENT_ID = '34f3e863-0690-8116-8014-f824769b948c';
const LOCAL_MEMORY_DIR = join(homedir(), '.claude', 'projects', PROJECT_HASH, 'memory');
const LOG_DIR = join(homedir(), '.claude', 'logs');
const LOG_PATH = join(LOG_DIR, 'notion-hooks.log');

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

async function log(msg: string): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const line = `[${new Date().toISOString()}] session-start: ${msg}\n`;
    await appendFile(LOG_PATH, line, 'utf-8');
  } catch {
    // Log failures are non-fatal — we never throw from here
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await log('starting memory pull');

  // Ensure the local memory directory exists
  await mkdir(LOCAL_MEMORY_DIR, { recursive: true });

  // Fetch all child pages of the Memory parent
  const children = await fetchPageChildren(MEMORY_PARENT_ID);
  await log(`found ${children.length} child pages under Memory parent`);

  const wantedFilenames = new Set<string>();

  // Write each child page as a .md file
  for (const child of children) {
    const filename = `${child.title}.md`;
    wantedFilenames.add(filename);

    const body = await fetchPageMarkdown(child.id);
    await writeFile(join(LOCAL_MEMORY_DIR, filename), body, 'utf-8');
    await log(`wrote ${filename} (${body.length} chars)`);
  }

  // Fetch the Memory page itself → MEMORY.md (the index)
  const indexBody = await fetchPageMarkdown(MEMORY_PARENT_ID);
  await writeFile(join(LOCAL_MEMORY_DIR, 'MEMORY.md'), indexBody, 'utf-8');
  wantedFilenames.add('MEMORY.md');
  await log(`wrote MEMORY.md (${indexBody.length} chars)`);

  // Delete orphan .md files that are no longer in Notion
  const existing = await readdir(LOCAL_MEMORY_DIR);
  for (const name of existing) {
    if (name.endsWith('.md') && !wantedFilenames.has(name)) {
      await unlink(join(LOCAL_MEMORY_DIR, name));
      await log(`deleted orphan: ${name}`);
    }
  }

  await log(`pull complete — ${children.length + 1} pages written`);
}

// ---------------------------------------------------------------------------
// Entry point — graceful degradation on any error
// ---------------------------------------------------------------------------

main().catch(async (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  await log(`ERROR: ${msg}`);
  // Exit 0 so Claude Code continues even if Notion is unavailable
  process.exit(0);
});
