#!/usr/bin/env bun
/**
 * SessionEnd hook — workflow-overlord v2 Guarantee #2
 * Reads JSONL transcript (with flush-completion detection), builds markdown,
 * uploads as Notion file attachment on the Sessions row, updates Ended.
 */
import { Client } from '@notionhq/client';
import { readFileSync, statSync } from 'node:fs';
import { uploadTranscript } from '../overlord-bridge/server.ts';

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
  const sessionId = process.env.WORKFLOW_OVERLORD_SESSION_ID;
  const transcriptPath = process.env.WORKFLOW_OVERLORD_TRANSCRIPT_PATH;
  const token = process.env.NOTION_TOKEN;
  if (!sessionId || !transcriptPath || !token) {
    console.error('[workflow-overlord:session-end] missing required env (SESSION_ID, TRANSCRIPT_PATH, NOTION_TOKEN)');
    process.exit(2);
  }
  try {
    await waitForStableFile(transcriptPath, {
      probeMs: 500, stableProbes: 3, timeoutMs: 15000,
    });
    const jsonl = readFileSync(transcriptPath, 'utf8');
    const markdown = buildTranscriptMarkdown(jsonl);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `transcript-${today}-${sessionId.slice(0, 8)}.md`;

    const notion = new Client({ auth: token });
    await uploadTranscript({ notion, sessionId, markdown, filename });
    await notion.pages.update({
      page_id: sessionId,
      properties: { Ended: { date: { start: new Date().toISOString() } } },
    });
    console.error(`[workflow-overlord:session-end] Session ${sessionId} closed; transcript uploaded as ${filename}.`);
  } catch (err) {
    console.error(`[workflow-overlord:session-end] FAILED: ${(err as Error).message}`);
    process.exit(2);
  }
}
