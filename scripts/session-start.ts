#!/usr/bin/env bun
/**
 * SessionStart hook — workflow-overlord v2 Guarantee #1
 * Creates a Sessions row in Notion when a Claude/Codex session begins.
 * Loud errors on missing env, placeholder config, or API failure.
 */
import { Client } from '@notionhq/client';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

export interface SessionConfig {
  sessionsDbId: string;
  slicesDbId: string;
  rootPageId: string;
}

export function loadConfigFromAgents(agentsContent: string): SessionConfig {
  const fmMatch = agentsContent.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) throw new Error('AGENTS.local.md missing YAML frontmatter');
  const config = parseYaml(fmMatch[1]);
  const notion = config?.notion;
  if (!notion) throw new Error('AGENTS.local.md missing `notion:` block');
  const sessionsDbId =
    notion.databases?.sessions?.database_id ?? notion.databases?.sessions;
  const slicesDbId =
    notion.databases?.slices?.database_id ?? notion.databases?.slices;
  const rootPageId = notion.root_page_id;
  if (!sessionsDbId || typeof sessionsDbId !== 'string')
    throw new Error('AGENTS.local.md missing notion.databases.sessions.database_id');
  if (!slicesDbId || typeof slicesDbId !== 'string')
    throw new Error('AGENTS.local.md missing notion.databases.slices.database_id');
  if (!rootPageId) throw new Error('AGENTS.local.md missing notion.root_page_id');
  if (String(sessionsDbId).includes('FILL IN'))
    throw new Error('AGENTS.local.md has placeholder Notion config — fill it in');
  return { sessionsDbId, slicesDbId, rootPageId };
}

export async function findActiveSliceId(
  notion: any,
  slicesDbId: string,
  branch: string
): Promise<string | null> {
  const result = await notion.databases.query({
    database_id: slicesDbId,
    filter: { property: 'Branch', rich_text: { equals: branch } },
    page_size: 1,
  });
  return result.results[0]?.id ?? null;
}

export async function createSessionRow(opts: {
  notion: any;
  sessionsDbId: string;
  sliceId: string | null;
  branch: string;
  tool: 'claude' | 'codex';
  title: string;
}): Promise<string> {
  if (!opts.sessionsDbId) throw new Error('sessionsDbId required');
  const properties: any = {
    Title: { title: [{ text: { content: opts.title } }] },
    Tool: { select: { name: opts.tool } },
    Started: { date: { start: new Date().toISOString() } },
  };
  if (opts.sliceId) {
    properties.Slice = { relation: [{ id: opts.sliceId }] };
  }
  const row = await opts.notion.pages.create({
    parent: { database_id: opts.sessionsDbId },
    properties,
  });
  return row.id;
}

if (import.meta.main) {
  const tool = (process.env.WORKFLOW_OVERLORD_TOOL as 'claude' | 'codex') ?? 'claude';
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error('[workflow-overlord:session-start] NOTION_TOKEN not set (hook should resolve via op://)');
    process.exit(2);
  }
  try {
    // Prefer v2-pending if it exists (during the Phase 3 cutover window)
    const pendingPath = `${process.cwd()}/AGENTS.local.v2-pending.md`;
    const localPath = `${process.cwd()}/AGENTS.local.md`;
    let content: string;
    try { content = readFileSync(pendingPath, 'utf8'); }
    catch { content = readFileSync(localPath, 'utf8'); }

    const config = loadConfigFromAgents(content);
    const notion = new Client({ auth: token });
    const branch = (await Bun.$`git branch --show-current`.text()).trim() || 'detached';
    const sliceId = await findActiveSliceId(notion, config.slicesDbId, branch);
    const today = new Date().toISOString().slice(0, 10);
    const title = `${today} ${branch}`;
    const sessionId = await createSessionRow({
      notion, sessionsDbId: config.sessionsDbId, sliceId, branch, tool, title,
    });
    console.error(`[workflow-overlord:session-start] Sessions row created: ${sessionId}`);
    // Stdout: machine-readable for hook chain
    console.log(JSON.stringify({ sessionId, sliceId, branch, tool }));
  } catch (err) {
    console.error(`[workflow-overlord:session-start] FAILED: ${(err as Error).message}`);
    process.exit(2);
  }
}
