/**
 * Minimal Notion REST API client for the SessionStart memory-pull hook.
 *
 * Runs OUTSIDE a Claude Code session (standalone Bun process), so MCP tools
 * are not available. Uses the Notion REST API directly with an integration token
 * stored in NOTION_INTEGRATION_TOKEN.
 *
 * Operator setup:
 *   1. Go to https://www.notion.so/my-integrations
 *   2. Create an integration (read-only capability is sufficient)
 *   3. Share the Memory page (and its children) with the integration
 *   4. Set: export NOTION_INTEGRATION_TOKEN="secret_..."
 *
 * Markdown renderer coverage:
 *   Rendered: heading_1/2/3, paragraph, bulleted_list_item, numbered_list_item,
 *             code, quote, divider, callout (content only, no icon).
 *   Stubbed:  child_page (title only), child_database, embed, image, video,
 *             audio, file, pdf, table, table_row, synced_block, column_list,
 *             column, breadcrumb, table_of_contents, link_to_page, toggle,
 *             template, unsupported.
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// ---------------------------------------------------------------------------
// createDatabasePage — Public API for migrate-conversations.ts + SessionStop
// ---------------------------------------------------------------------------

export interface CreateDbPageArgs {
  /** Target Conversations DB id (without collection:// prefix). */
  databaseId: string;
  /** Row property values. Supported keys: Name, Date, Project, Session ID, Summary. */
  properties: {
    Name: string;
    Date: string;
    Project?: string;
    'Session ID'?: string;
    Summary?: string;
  };
  /** Full markdown body for the page content. */
  contentMarkdown: string;
}

export interface CreateDbPageResult {
  id: string;
  url: string;
}

/**
 * Creates a page in the Conversations DB (or any db with compatible schema).
 * Converts contentMarkdown to Notion paragraph/heading/code blocks.
 * Property shapes follow the Notion API 2022-06-28 spec.
 */
export async function createDatabasePage(
  args: CreateDbPageArgs
): Promise<CreateDbPageResult> {
  const { databaseId, properties, contentMarkdown } = args;
  const token = getToken();

  // Build Notion property payload
  const notionProperties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: properties.Name.slice(0, 2000) } }],
    },
    Date: {
      date: { start: properties.Date },
    },
  };

  if (properties.Project) {
    notionProperties['Project'] = { select: { name: properties.Project } };
  }
  if (properties['Session ID']) {
    notionProperties['Session ID'] = {
      rich_text: [{ text: { content: properties['Session ID'].slice(0, 2000) } }],
    };
  }
  if (properties.Summary) {
    notionProperties['Summary'] = {
      rich_text: [{ text: { content: properties.Summary.slice(0, 2000) } }],
    };
  }

  // Convert markdown → Notion blocks (max 100 children per API call)
  const blocks = markdownToBlocks(contentMarkdown);
  // Notion create-page accepts max 100 children — truncate if over limit
  const children = blocks.slice(0, 100);

  const payload = {
    parent: { database_id: databaseId },
    properties: notionProperties,
    children,
  };

  const response = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      ...makeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion create page ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

// ---------------------------------------------------------------------------
// markdownToBlocks — lightweight markdown → Notion block array converter
// Handles: heading_3, code (with language), toggle (details/summary), paragraph
// R-9: never emits bare code fences — always uses language from the source.
// ---------------------------------------------------------------------------

interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: unknown;
}

function makeRichText(text: string): Array<{ type: 'text'; text: { content: string } }> {
  // Notion rich_text content max 2000 chars per segment — split if needed
  const MAX = 2000;
  const segments: Array<{ type: 'text'; text: { content: string } }> = [];
  let remaining = text;
  while (remaining.length > 0) {
    segments.push({ type: 'text', text: { content: remaining.slice(0, MAX) } });
    remaining = remaining.slice(MAX);
  }
  return segments.length > 0 ? segments : [{ type: 'text', text: { content: '' } }];
}

function markdownToBlocks(markdown: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // --- heading_3: ### text
    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: makeRichText(line.slice(4).trim()) },
      });
      i++;
      continue;
    }

    // --- code block: ```language ... ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i++;
      }
      i++; // skip closing ```
      const codeContent = codeLines.join('\n');
      // Notion code block language: map common tags
      const notionLang = mapLanguage(lang);
      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: makeRichText(codeContent),
          language: notionLang,
        },
      });
      continue;
    }

    // --- toggle block: <details><summary>...</summary>..content..</details>
    if (line.startsWith('<details>')) {
      const summaryMatch = (lines[i + 1] ?? '').match(/^<summary>(.*?)<\/summary>$/);
      const summaryText = summaryMatch ? summaryMatch[1]! : 'details';
      const toggleChildren: NotionBlock[] = [];
      i += 2; // skip <details> and <summary> lines

      // Collect until </details>
      const innerLines: string[] = [];
      while (i < lines.length && !(lines[i] ?? '').startsWith('</details>')) {
        innerLines.push(lines[i] ?? '');
        i++;
      }
      i++; // skip </details>

      // Recursively convert inner content (usually a code block)
      const innerBlocks = markdownToBlocks(innerLines.join('\n'));
      toggleChildren.push(...innerBlocks);

      blocks.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: makeRichText(summaryText),
          children: toggleChildren,
        },
      });
      continue;
    }

    // --- blank line: skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- paragraph: accumulate until blank line
    const paraLines: string[] = [];
    while (i < lines.length && (lines[i] ?? '').trim() !== '' &&
           !(lines[i] ?? '').startsWith('### ') &&
           !(lines[i] ?? '').startsWith('```') &&
           !(lines[i] ?? '').startsWith('<details>')) {
      paraLines.push(lines[i] ?? '');
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: makeRichText(paraLines.join('\n')) },
      });
    }
  }

  return blocks;
}

/** Map informal language tags to Notion-supported code block languages. */
function mapLanguage(lang: string): string {
  const lower = lang.toLowerCase();
  const map: Record<string, string> = {
    'tool-call': 'json',
    'tool_call': 'json',
    'text': 'plain text',
    'bash': 'bash',
    'shell': 'bash',
    'sh': 'bash',
    'ts': 'typescript',
    'typescript': 'typescript',
    'js': 'javascript',
    'javascript': 'javascript',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'markdown': 'markdown',
    'css': 'css',
    'html': 'html',
    'python': 'python',
    'py': 'python',
    'sql': 'sql',
    'plain text': 'plain text',
  };
  return map[lower] ?? 'plain text';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RichTextItem {
  type: string;
  text?: { content: string; link?: { url: string } | null };
  mention?: { type: string; [k: string]: unknown };
  equation?: { expression: string };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text?: string;
  href?: string | null;
}

interface Block {
  id: string;
  type: string;
  has_children?: boolean;
  [k: string]: unknown;
}

interface BlocksResponse {
  results: Block[];
  has_more: boolean;
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function getToken(): string {
  const token = process.env.NOTION_INTEGRATION_TOKEN;
  if (!token) {
    throw new Error(
      'NOTION_INTEGRATION_TOKEN env var not set. ' +
        'Generate a Notion integration at https://www.notion.so/my-integrations ' +
        'and share the Memory page tree with it.'
    );
  }
  return token;
}

function makeHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Notion-Version': NOTION_VERSION,
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchBlocks(blockId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  let cursor: string | null = null;

  do {
    const url =
      `${NOTION_API}/blocks/${blockId}/children?page_size=100` +
      (cursor ? `&start_cursor=${cursor}` : '');

    const response = await fetch(url, { headers: makeHeaders() });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Notion API ${response.status}: ${body}`);
    }

    const data = (await response.json()) as BlocksResponse;
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the direct child pages of the given parent page.
 */
export async function fetchPageChildren(
  parentId: string
): Promise<Array<{ id: string; title: string }>> {
  const blocks = await fetchBlocks(parentId);
  return blocks
    .filter((b) => b.type === 'child_page')
    .map((b) => {
      const cp = b as Block & { child_page: { title: string } };
      return { id: b.id, title: cp.child_page.title };
    });
}

/**
 * Fetches all top-level blocks of the page and converts them to Markdown.
 * Recursively fetches children for list items up to two levels deep to
 * preserve nested lists.
 */
export async function fetchPageMarkdown(pageId: string): Promise<string> {
  const blocks = await fetchBlocks(pageId);
  const lines = await Promise.all(blocks.map((b) => blockToMarkdown(b, 0)));
  return lines.filter((l) => l !== null).join('\n\n');
}

// ---------------------------------------------------------------------------
// Rich text → plain markdown
// ---------------------------------------------------------------------------

function richTextToMarkdown(items: RichTextItem[]): string {
  return items
    .map((item) => {
      let text = item.plain_text ?? '';
      if (!text) return '';

      const ann = item.annotations;
      if (ann) {
        if (ann.code) text = `\`${text}\``;
        if (ann.bold) text = `**${text}**`;
        if (ann.italic) text = `*${text}*`;
        if (ann.strikethrough) text = `~~${text}~~`;
      }
      if (item.href) text = `[${text}](${item.href})`;
      return text;
    })
    .join('');
}

function getRichText(block: Block): RichTextItem[] {
  const typed = block as Record<string, Record<string, unknown>>;
  const inner = typed[block.type];
  if (!inner) return [];
  const rt = inner['rich_text'];
  if (!Array.isArray(rt)) return [];
  return rt as RichTextItem[];
}

// ---------------------------------------------------------------------------
// Block → Markdown
// ---------------------------------------------------------------------------

async function blockToMarkdown(block: Block, depth: number): Promise<string> {
  const indent = '  '.repeat(depth);

  switch (block.type) {
    case 'heading_1': {
      const text = richTextToMarkdown(getRichText(block));
      return `# ${text}`;
    }
    case 'heading_2': {
      const text = richTextToMarkdown(getRichText(block));
      return `## ${text}`;
    }
    case 'heading_3': {
      const text = richTextToMarkdown(getRichText(block));
      return `### ${text}`;
    }
    case 'paragraph': {
      const text = richTextToMarkdown(getRichText(block));
      return text ? `${indent}${text}` : '';
    }
    case 'bulleted_list_item': {
      const text = richTextToMarkdown(getRichText(block));
      let result = `${indent}- ${text}`;
      if (block.has_children) {
        const children = await fetchBlocks(block.id);
        const childLines = await Promise.all(
          children.map((c) => blockToMarkdown(c, depth + 1))
        );
        const childText = childLines.filter(Boolean).join('\n');
        if (childText) result += '\n' + childText;
      }
      return result;
    }
    case 'numbered_list_item': {
      const text = richTextToMarkdown(getRichText(block));
      let result = `${indent}1. ${text}`;
      if (block.has_children) {
        const children = await fetchBlocks(block.id);
        const childLines = await Promise.all(
          children.map((c) => blockToMarkdown(c, depth + 1))
        );
        const childText = childLines.filter(Boolean).join('\n');
        if (childText) result += '\n' + childText;
      }
      return result;
    }
    case 'code': {
      const typed = block as Block & {
        code: { rich_text: RichTextItem[]; language: string };
      };
      const lang = typed.code.language ?? 'text';
      const text = typed.code.rich_text.map((r) => r.plain_text ?? '').join('');
      return `\`\`\`${lang}\n${text}\n\`\`\``;
    }
    case 'quote': {
      const text = richTextToMarkdown(getRichText(block));
      return `> ${text}`;
    }
    case 'divider': {
      return '---';
    }
    case 'callout': {
      // Render callout as blockquote with optional emoji prefix
      const typed = block as Block & {
        callout: { rich_text: RichTextItem[]; icon?: { emoji?: string } };
      };
      const icon = typed.callout.icon?.emoji ? `${typed.callout.icon.emoji} ` : '';
      const text = richTextToMarkdown(typed.callout.rich_text);
      return `> ${icon}${text}`;
    }
    case 'child_page': {
      const cp = block as Block & { child_page: { title: string } };
      // Render as a bold reference — cannot inline nested page content here
      return `**[${cp.child_page.title}]** *(child page)*`;
    }
    case 'toggle': {
      const text = richTextToMarkdown(getRichText(block));
      let result = `<details>\n<summary>${text}</summary>\n`;
      if (block.has_children) {
        const children = await fetchBlocks(block.id);
        const childLines = await Promise.all(
          children.map((c) => blockToMarkdown(c, 0))
        );
        result += childLines.filter(Boolean).join('\n\n');
      }
      result += '\n</details>';
      return result;
    }
    default: {
      // Unsupported block — emit a comment so the file is still readable
      return `<!-- unsupported block type: ${block.type} -->`;
    }
  }
}
