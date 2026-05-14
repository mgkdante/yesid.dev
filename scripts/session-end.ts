#!/usr/bin/env bun
/**
 * SessionEnd hook — workflow-overlord v2 Guarantee #2
 * Reads JSONL transcript (with flush-completion detection), builds markdown,
 * uploads as Notion file attachment on the Sessions row, updates Ended.
 *
 * Receives Claude's session_id (e.g. 592433c0-...) — must look up the Notion
 * Sessions row by `Session ID` property (set at SessionStart) before updating.
 */
import { Client } from '@notionhq/client';
import { readFileSync, statSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { uploadTranscript } from '../overlord-bridge/server.ts';

export async function findSessionRowByClaudeId(
  notion: any,
  sessionsDbId: string,
  claudeSessionId: string
): Promise<string | null> {
  const result = await notion.databases.query({
    database_id: sessionsDbId,
    filter: { property: 'Session ID', rich_text: { equals: claudeSessionId } },
    page_size: 1,
  });
  return result.results[0]?.id ?? null;
}

export async function waitForStableFile(
  path: string,
  opts: { probeMs: number; stableProbes: number; timeoutMs: number }
): Promise<void> {
  const start = Date.now();
  let lastSig = '';
  let stable = 0;
  while (Date.now() - start < opts.timeoutMs) {
    await new Promise((r) => setTimeout(r, opts.probeMs));
    let sig: string;
    try {
      const s = statSync(path);
      sig = `${s.mtimeMs}:${s.size}`;
    } catch {
      sig = 'missing';
    }
    if (sig === lastSig && sig !== 'missing') {
      stable++;
      if (stable >= opts.stableProbes) return;
    } else {
      stable = sig === lastSig ? stable : 0;
      lastSig = sig;
    }
  }
  throw new Error(`waitForStableFile: ${path} did not stabilize within ${opts.timeoutMs}ms`);
}

export function buildTranscriptMarkdown(jsonl: string): string {
  const lines = jsonl.split('\n').filter((l) => l.trim());
  const sections: string[] = [];
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      const rawRole = msg.role || msg.type;
      if (!rawRole) continue;
      const role = String(rawRole);
      const heading = `## ${role[0].toUpperCase()}${role.slice(1)}`;
      const content = typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((c: any) => c.text ?? JSON.stringify(c)).join('\n')
          : JSON.stringify(msg.content ?? msg.message ?? msg);
      sections.push(`${heading}\n\n${content}`);
    } catch {
      // skip malformed
    }
  }
  return sections.join('\n\n---\n\n');
}

if (import.meta.main) {
  const claudeSessionId = process.env.WORKFLOW_OVERLORD_SESSION_ID;
  const transcriptPath = process.env.WORKFLOW_OVERLORD_TRANSCRIPT_PATH;
  const token = process.env.NOTION_TOKEN;
  if (!claudeSessionId || !transcriptPath || !token) {
    console.error('[workflow-overlord:session-end] missing required env (SESSION_ID, TRANSCRIPT_PATH, NOTION_TOKEN)');
    process.exit(2);
  }
  try {
    // Load Notion config from AGENTS.local.md (prefer v2-pending if present)
    let agentsContent: string;
    try { agentsContent = readFileSync(`${process.cwd()}/AGENTS.local.v2-pending.md`, 'utf8'); }
    catch { agentsContent = readFileSync(`${process.cwd()}/AGENTS.local.md`, 'utf8'); }
    const fm = agentsContent.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fm) throw new Error('AGENTS.local.md missing frontmatter');
    const config = parseYaml(fm[1]);
    const sessionsDbId =
      config?.notion?.databases?.sessions?.database_id ?? config?.notion?.databases?.sessions;
    if (!sessionsDbId) throw new Error('AGENTS.local.md missing sessions.database_id');

    const notion = new Client({ auth: token });

    // Look up Notion Sessions row by Claude's session_id
    const notionPageId = await findSessionRowByClaudeId(notion, sessionsDbId, claudeSessionId);
    if (!notionPageId) {
      console.error(`[workflow-overlord:session-end] no Sessions row found for Claude session ${claudeSessionId} — SessionStart hook may not have fired. Skipping.`);
      process.exit(0); // soft-skip, not an error worth blocking on
    }

    await waitForStableFile(transcriptPath, {
      probeMs: 500, stableProbes: 3, timeoutMs: 15000,
    });
    const jsonl = readFileSync(transcriptPath, 'utf8');
    const markdown = buildTranscriptMarkdown(jsonl);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `transcript-${today}-${claudeSessionId.slice(0, 8)}.md`;

    await uploadTranscript({ notion, sessionId: notionPageId, markdown, filename });
    await notion.pages.update({
      page_id: notionPageId,
      properties: { Ended: { date: { start: new Date().toISOString() } } },
    });
    console.error(`[workflow-overlord:session-end] Session ${notionPageId} (claude=${claudeSessionId}) closed; transcript uploaded as ${filename}.`);
  } catch (err) {
    console.error(`[workflow-overlord:session-end] FAILED: ${(err as Error).message}`);
    process.exit(2);
  }
}
