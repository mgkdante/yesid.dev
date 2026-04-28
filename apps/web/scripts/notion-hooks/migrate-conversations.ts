#!/usr/bin/env bun
/**
 * migrate-conversations.ts — Convert a single .jsonl Claude Code transcript
 * into a Notion Conversations DB row.
 *
 * CLI:
 *   bun apps/web/scripts/notion-hooks/migrate-conversations.ts <path-to-jsonl> [--db-id=<override>]
 *
 * Requires: NOTION_INTEGRATION_TOKEN env var.
 *
 * Schema (Conversations DB collection://fc5ef611-dbcf-425f-8136-99b4b6016e19):
 *   Name        (title)  : "<date> — <session-id-prefix>"
 *   Date        (date)   : session start time ISO
 *   Project     (select) : "yesid.dev"
 *   Session ID  (text)   : the .jsonl UUID
 *   Summary     (text)   : first user message first 200 chars
 *   body                 : full markdown-converted transcript
 *
 * R-9: all code fences use explicit language tags; tool results truncated to 5000 chars.
 * Section 16 A3: tool results in <details><summary> toggle blocks.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { basename } from 'node:path';
import { createDatabasePage } from './lib/notion-client.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DB_ID = 'fc5ef611-dbcf-425f-8136-99b4b6016e19';
const TOOL_RESULT_MAX_CHARS = 5000;
// Notion API limit: 100 blocks per create-page call (children array).
// We use a soft threshold to decide when to create sub-pages.
const BLOCK_SOFT_LIMIT = 90;

// ---------------------------------------------------------------------------
// JSONL event types (subset we care about)
// ---------------------------------------------------------------------------

interface BaseEvent {
  type: string;
  timestamp?: string;
  sessionId?: string;
  uuid?: string;
  parentUuid?: string | null;
  isSidechain?: boolean;
}

interface UserEvent extends BaseEvent {
  type: 'user';
  message?: {
    role: 'user';
    content: string | ContentBlock[];
  };
  content?: string | ContentBlock[];
}

interface AssistantEvent extends BaseEvent {
  type: 'assistant';
  message?: {
    role: 'assistant';
    content: string | ContentBlock[];
  };
  content?: string | ContentBlock[];
}

interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  content?: string | ContentBlock[];
  tool_use_id?: string;
  is_error?: boolean;
}

interface AttachmentEvent extends BaseEvent {
  type: 'attachment';
  attachment?: {
    type: string;
    content?: string;
    stdout?: string;
  };
}

type JsonlEvent = UserEvent | AssistantEvent | AttachmentEvent | (BaseEvent & Record<string, unknown>);

// ---------------------------------------------------------------------------
// Markdown conversion helpers (R-9: always explicit language tags)
// ---------------------------------------------------------------------------

function truncateToolResult(content: string): string {
  if (content.length <= TOOL_RESULT_MAX_CHARS) return content;
  const extra = content.length - TOOL_RESULT_MAX_CHARS;
  return content.slice(0, TOOL_RESULT_MAX_CHARS) + `\n[truncated, ${extra} chars more]`;
}

function contentBlocksToMarkdown(blocks: ContentBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'text' && block.text) {
      parts.push(block.text.trim());
    } else if (block.type === 'tool_use') {
      const name = block.name ?? 'unknown';
      const input = JSON.stringify(block.input ?? {}, null, 2);
      parts.push(`\`\`\`tool-call ${name}\n${input}\n\`\`\``);
    } else if (block.type === 'tool_result') {
      let resultText = '';
      if (typeof block.content === 'string') {
        resultText = block.content;
      } else if (Array.isArray(block.content)) {
        resultText = block.content
          .map((c) => (typeof c === 'string' ? c : (c as ContentBlock).text ?? JSON.stringify(c)))
          .join('\n');
      }
      const truncated = truncateToolResult(resultText);
      const toolId = block.tool_use_id ?? 'result';
      const label = block.is_error ? `tool result [error] ${toolId}` : `tool result ${toolId}`;
      parts.push(
        `<details>\n<summary>${label}</summary>\n\n\`\`\`text\n${truncated}\n\`\`\`\n\n</details>`
      );
    }
  }

  return parts.join('\n\n');
}

function contentToMarkdown(content: string | ContentBlock[]): string {
  if (typeof content === 'string') {
    return content.trim();
  }
  return contentBlocksToMarkdown(content);
}

// ---------------------------------------------------------------------------
// Parse .jsonl → structured turns
// ---------------------------------------------------------------------------

interface Turn {
  role: 'user' | 'assistant';
  markdown: string;
  timestamp?: string;
}

async function parseJsonl(filePath: string): Promise<{
  turns: Turn[];
  sessionId: string;
  startTimestamp: string | null;
  firstUserText: string;
}> {
  const turns: Turn[] = [];
  let startTimestamp: string | null = null;
  let firstUserText = '';

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  // Extract UUID from filename: <uuid>.jsonl
  const sessionId = basename(filePath, '.jsonl');

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let event: JsonlEvent;
    try {
      event = JSON.parse(trimmed) as JsonlEvent;
    } catch {
      continue; // skip malformed lines
    }

    // Capture earliest timestamp
    if (event.timestamp && !startTimestamp) {
      startTimestamp = event.timestamp;
    }

    if (event.type === 'user') {
      const ue = event as UserEvent;
      const rawContent = ue.message?.content ?? ue.content ?? '';
      const md = contentToMarkdown(rawContent);
      if (md) {
        if (!firstUserText) {
          // Extract plain text for summary
          const plain = typeof rawContent === 'string'
            ? rawContent
            : (Array.isArray(rawContent)
              ? (rawContent as ContentBlock[])
                  .filter((b) => b.type === 'text')
                  .map((b) => b.text ?? '')
                  .join(' ')
              : '');
          firstUserText = plain.slice(0, 200).replace(/\n/g, ' ').trim();
        }
        turns.push({ role: 'user', markdown: md, timestamp: event.timestamp });
      }
    } else if (event.type === 'assistant') {
      const ae = event as AssistantEvent;
      const rawContent = ae.message?.content ?? ae.content ?? '';
      const md = contentToMarkdown(rawContent);
      if (md) {
        turns.push({ role: 'assistant', markdown: md, timestamp: event.timestamp });
      }
    }
    // Attachments (hook outputs, queue ops, etc.) are intentionally skipped —
    // they're implementation noise, not conversation content.
  }

  return { turns, sessionId, startTimestamp, firstUserText };
}

// ---------------------------------------------------------------------------
// Build Notion page markdown body
// ---------------------------------------------------------------------------

function buildBody(turns: Turn[]): string {
  const lines: string[] = [];
  for (const turn of turns) {
    const heading = turn.role === 'user' ? '### User' : '### Assistant';
    lines.push(heading);
    lines.push('');
    lines.push(turn.markdown);
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Split body into chunks if needed (Notion 100-block limit per create-page)
// A rough heuristic: count heading_3 + code fences + paragraphs.
// If body exceeds BLOCK_SOFT_LIMIT, split at turn boundaries.
// ---------------------------------------------------------------------------

function estimateBlockCount(markdown: string): number {
  const headings = (markdown.match(/^### /gm) ?? []).length;
  const codeFences = (markdown.match(/^```/gm) ?? []).length / 2;
  // Paragraphs: blank-line delimited chunks that are not headings or code
  const paragraphs = (markdown.match(/\n\n(?!###|```)/g) ?? []).length;
  return headings + Math.ceil(codeFences) + paragraphs;
}

function splitBodyIntoChunks(turns: Turn[], chunkBlockLimit: number): string[] {
  const chunks: string[] = [];
  let currentTurns: Turn[] = [];

  for (const turn of turns) {
    const candidate = buildBody([...currentTurns, turn]);
    if (estimateBlockCount(candidate) > chunkBlockLimit && currentTurns.length > 0) {
      chunks.push(buildBody(currentTurns));
      currentTurns = [turn];
    } else {
      currentTurns.push(turn);
    }
  }

  if (currentTurns.length > 0) {
    chunks.push(buildBody(currentTurns));
  }

  return chunks.length > 0 ? chunks : [''];
}

// ---------------------------------------------------------------------------
// Main migration logic
// ---------------------------------------------------------------------------

async function migrateJsonl(filePath: string, dbId: string): Promise<void> {
  // Validate file exists
  await stat(filePath);

  const { turns, sessionId, startTimestamp, firstUserText } = await parseJsonl(filePath);

  if (turns.length === 0) {
    console.log(`[migrate] ${sessionId}: 0 turns — skipping (empty/attachment-only transcript)`);
    return;
  }

  // Compute date for Name property
  const dateStr = startTimestamp
    ? new Date(startTimestamp).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const sessionIdPrefix = sessionId.slice(0, 8);
  const pageName = `${dateStr} — ${sessionIdPrefix}`;

  const summary = firstUserText
    ? firstUserText.slice(0, 200)
    : `Session ${sessionIdPrefix}`;

  // Build body chunks
  const chunks = splitBodyIntoChunks(turns, BLOCK_SOFT_LIMIT);

  if (chunks.length === 1) {
    // Single page
    const result = await createDatabasePage({
      databaseId: dbId,
      properties: {
        Name: pageName,
        Date: startTimestamp ?? new Date().toISOString(),
        Project: 'yesid.dev',
        'Session ID': sessionId,
        Summary: summary,
      },
      contentMarkdown: chunks[0] ?? '',
    });
    console.log(`[migrate] OK  ${sessionId} → ${result.id} (${turns.length} turns, 1 page)`);
  } else {
    // Multiple sub-pages: create main page + linked sub-pages
    const mainSummary = `${summary} [split into ${chunks.length} parts]`;
    const mainResult = await createDatabasePage({
      databaseId: dbId,
      properties: {
        Name: pageName,
        Date: startTimestamp ?? new Date().toISOString(),
        Project: 'yesid.dev',
        'Session ID': sessionId,
        Summary: mainSummary,
      },
      contentMarkdown: `*This transcript was split into ${chunks.length} parts due to size.*\n\nSee sub-pages: ${chunks.map((_, i) => `Part ${i + 1}`).join(', ')}`,
    });
    console.log(`[migrate] SPLIT ${sessionId} → ${mainResult.id} (${turns.length} turns, ${chunks.length} parts)`);

    for (let i = 0; i < chunks.length; i++) {
      const partResult = await createDatabasePage({
        databaseId: dbId,
        properties: {
          Name: `${pageName} (part ${i + 1}/${chunks.length})`,
          Date: startTimestamp ?? new Date().toISOString(),
          Project: 'yesid.dev',
          'Session ID': `${sessionId}#part${i + 1}`,
          Summary: `Part ${i + 1} of ${chunks.length} for ${sessionId}`,
        },
        contentMarkdown: chunks[i] ?? '',
      });
      console.log(`[migrate]   part ${i + 1}/${chunks.length} → ${partResult.id}`);
    }
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith('--'));
  const dbIdArg = args.find((a) => a.startsWith('--db-id='));
  const dbId = dbIdArg ? dbIdArg.split('=')[1]! : DEFAULT_DB_ID;

  if (!filePath) {
    console.error('Usage: bun migrate-conversations.ts <path-to-jsonl> [--db-id=<override>]');
    process.exit(1);
  }

  try {
    await migrateJsonl(filePath, dbId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[migrate] ERROR ${filePath}: ${msg}`);
    process.exit(1);
  }
}

main();
