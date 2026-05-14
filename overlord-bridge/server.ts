#!/usr/bin/env bun
/**
 * overlord-bridge — workflow-overlord v2 MCP server
 *
 * Four tools the AI calls during sessions:
 *   - get_active_slice    — read the current open slice for this branch
 *   - update_session      — patch Summary on a Sessions row mid-work
 *   - log_handoff         — append a Handoff section to a slice page at close
 *   - upload_transcript   — upload markdown as file-attachment on Sessions row (called from session-end.sh)
 */
import { Client } from '@notionhq/client';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export interface ActiveSlice {
  id: string;
  title: string;
  status: string;
  branch: string;
  summary: string;
}

export async function getActiveSlice(opts: {
  notion: any;
  branch: string;
  slicesDbId: string;
}): Promise<ActiveSlice | null> {
  if (!opts.slicesDbId) throw new Error('slicesDbId required');
  const result = await opts.notion.databases.query({
    database_id: opts.slicesDbId,
    filter: {
      and: [
        { property: 'Status', select: { does_not_equal: 'closed' } },
        { property: 'Branch', rich_text: { equals: opts.branch } },
      ],
    },
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 1,
  });
  if (result.results.length === 0) return null;
  const row = result.results[0];
  return {
    id: row.id,
    title: row.properties.Title?.title?.[0]?.plain_text ?? '',
    status: row.properties.Status?.select?.name ?? '',
    branch: row.properties.Branch?.rich_text?.[0]?.plain_text ?? '',
    summary: row.properties.Summary?.rich_text?.[0]?.plain_text ?? '',
  };
}

export async function updateSession(opts: {
  notion: any;
  sessionId: string;
  summary?: string;
  lastTask?: string;
}): Promise<void> {
  if (!opts.sessionId) throw new Error('sessionId required');
  const properties: Record<string, any> = {};
  if (opts.summary !== undefined) {
    properties.Summary = { rich_text: [{ text: { content: opts.summary.slice(0, 2000) } }] };
  }
  await opts.notion.pages.update({ page_id: opts.sessionId, properties });
}

export async function logHandoff(opts: {
  notion: any;
  sliceId: string;
  body: string;
}): Promise<void> {
  if (!opts.sliceId) throw new Error('sliceId required');
  const paragraphs = opts.body
    .split('\n\n')
    .filter((p) => p.trim())
    .map((p) => ({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: p.slice(0, 2000) } }] },
    }));
  await opts.notion.blocks.children.append({
    block_id: opts.sliceId,
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'Handoff' } }] },
      },
      ...paragraphs,
    ],
  });
}

export async function uploadTranscript(opts: {
  notion: any;
  sessionId: string;
  markdown: string;
  filename: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  if (!opts.sessionId) throw new Error('sessionId required');
  const fetchFn = opts.fetchImpl ?? fetch;
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN not set');

  // Step 1: create file upload
  const createResp = await fetchFn('https://api.notion.com/v1/file_uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename: opts.filename, content_type: 'text/markdown' }),
  });
  if (!createResp.ok) throw new Error(`file_uploads create failed: ${await createResp.text()}`);
  const { id: uploadId, upload_url } = (await createResp.json()) as { id: string; upload_url: string };

  // Step 2: PUT bytes to signed url (multipart/form-data per Notion API)
  const form = new FormData();
  form.append('file', new Blob([opts.markdown], { type: 'text/markdown' }), opts.filename);
  const putResp = await fetchFn(upload_url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
    body: form,
  });
  if (!putResp.ok) throw new Error(`file_uploads send failed: ${await putResp.text()}`);

  // Step 3: attach to Sessions row
  await opts.notion.pages.update({
    page_id: opts.sessionId,
    properties: {
      Transcript: {
        files: [
          { type: 'file_upload', file_upload: { id: uploadId }, name: opts.filename },
        ],
      },
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// MCP stdio loop
// ──────────────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error('[overlord-bridge] NOTION_TOKEN not set — refusing to start');
    process.exit(2);
  }
  const slicesDbId = process.env.WORKFLOW_OVERLORD_SLICES_DB_ID;
  const sessionsDbId = process.env.WORKFLOW_OVERLORD_SESSIONS_DB_ID;
  if (!slicesDbId || !sessionsDbId) {
    console.error('[overlord-bridge] WORKFLOW_OVERLORD_SLICES_DB_ID + WORKFLOW_OVERLORD_SESSIONS_DB_ID required');
    process.exit(2);
  }

  const notion = new Client({ auth: token });
  const server = new Server(
    { name: 'overlord-bridge', version: '2.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_active_slice',
        description: 'Returns the current open or in-progress slice for the active git branch.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'update_session',
        description: 'Patches Summary on a Sessions row (mid-session progress logging).',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Sessions DB row UUID' },
            summary: { type: 'string', description: 'Updated summary text (truncated to 2000 chars)' },
            lastTask: { type: 'string', description: 'Optional last-task label' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'log_handoff',
        description: 'Appends a Handoff heading + paragraphs to a slice page (called at slice-close).',
        inputSchema: {
          type: 'object',
          properties: {
            sliceId: { type: 'string' },
            body: { type: 'string', description: 'Markdown body, paragraphs separated by blank lines' },
          },
          required: ['sliceId', 'body'],
        },
      },
      {
        name: 'upload_transcript',
        description: 'Uploads markdown blob as a Notion file attachment on a Sessions row (internal, called by session-end hook).',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            markdown: { type: 'string' },
            filename: { type: 'string' },
          },
          required: ['sessionId', 'markdown', 'filename'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const branch = (await Bun.$`git branch --show-current`.text()).trim();
    const args = (req.params.arguments ?? {}) as any;
    try {
      switch (req.params.name) {
        case 'get_active_slice': {
          const slice = await getActiveSlice({ notion, branch, slicesDbId });
          return { content: [{ type: 'text', text: JSON.stringify(slice) }] };
        }
        case 'update_session': {
          await updateSession({ notion, sessionId: args.sessionId, summary: args.summary, lastTask: args.lastTask });
          return { content: [{ type: 'text', text: 'ok' }] };
        }
        case 'log_handoff': {
          await logHandoff({ notion, sliceId: args.sliceId, body: args.body });
          return { content: [{ type: 'text', text: 'ok' }] };
        }
        case 'upload_transcript': {
          await uploadTranscript({ notion, sessionId: args.sessionId, markdown: args.markdown, filename: args.filename });
          return { content: [{ type: 'text', text: 'ok' }] };
        }
        default:
          throw new Error(`Unknown tool: ${req.params.name}`);
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[overlord-bridge] v2.0.0 ready on stdio');
}
