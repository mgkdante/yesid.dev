import { Database } from 'bun:sqlite';
import { parseArgs } from 'node:util';

const DEFAULT_NOTION_VERSION = '2025-09-03';
const DEFAULT_TABLE_NAME = 'rows';
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 1000;

type JsonValue = string | number | boolean | null;
type RowValue = JsonValue;
type Row = Record<string, RowValue>;

interface CliArgs {
  dataSourceId: string;
  sql: string;
  tableName: string;
  format: 'json' | 'table';
  pageSize: number;
  maxPages: number;
}

interface QueryResponse {
  results?: NotionPage[];
  has_more?: boolean;
  next_cursor?: string | null;
}

interface NotionPage {
  id: string;
  url?: string;
  created_time?: string;
  last_edited_time?: string;
  archived?: boolean;
  in_trash?: boolean;
  properties?: Record<string, NotionProperty>;
}

interface NotionProperty {
  type?: string;
  [key: string]: unknown;
}

export function normalizeDataSourceId(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('collection://')) {
    return trimmed.slice('collection://'.length);
  }
  return trimmed;
}

export function notionPageToRow(page: NotionPage): Row {
  const row: Row = {
    id: page.id,
    url: page.url ?? null,
    createdTime: page.created_time ?? null,
    lastEditedTime: page.last_edited_time ?? null,
    archived: page.archived ? 1 : 0,
    inTrash: page.in_trash ? 1 : 0,
  };

  for (const [name, property] of Object.entries(page.properties ?? {})) {
    row[name] = propertyToValue(property);
  }

  return row;
}

export function queryRowsWithSql(
  rows: Row[],
  sql: string,
  tableName = DEFAULT_TABLE_NAME,
  aliases: string[] = []
): Row[] {
  const db = new Database(':memory:');
  try {
    loadRows(db, rows, tableName, aliases);
    return db.query(sql).all() as Row[];
  } finally {
    db.close();
  }
}

async function main(argv: readonly string[]): Promise<void> {
  const args = parseCliArgs(argv);
  const token = process.env.NOTION_API_KEY ?? process.env.NOTION_INTEGRATION_TOKEN;
  if (!token) {
    throw new Error(
      'NOTION_API_KEY or NOTION_INTEGRATION_TOKEN is required. Use `op run --env-file=.env -- ...` or `bun --env-file=.env ...`.'
    );
  }

  const rows = await fetchAllRows({
    token,
    dataSourceId: args.dataSourceId,
    pageSize: args.pageSize,
    maxPages: args.maxPages,
  });
  const tableAliases = [`collection://${normalizeDataSourceId(args.dataSourceId)}`];
  const result = queryRowsWithSql(rows, args.sql, args.tableName, tableAliases);

  if (args.format === 'table') {
    console.table(result);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      'data-source-id': { type: 'string' },
      sql: { type: 'string' },
      table: { type: 'string', default: DEFAULT_TABLE_NAME },
      format: { type: 'string', default: 'json' },
      'page-size': { type: 'string', default: String(DEFAULT_PAGE_SIZE) },
      'max-pages': { type: 'string', default: String(DEFAULT_MAX_PAGES) },
      help: { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const dataSourceId = values['data-source-id'];
  const sql = values.sql;
  if (!dataSourceId || !sql) {
    printHelp();
    throw new Error('--data-source-id and --sql are required');
  }

  const format = values.format;
  if (format !== 'json' && format !== 'table') {
    throw new Error('--format must be json or table');
  }

  const pageSize = parsePositiveInteger(values['page-size'] ?? '', '--page-size');
  const maxPages = parsePositiveInteger(values['max-pages'] ?? '', '--max-pages');

  return {
    dataSourceId,
    sql,
    tableName: values.table ?? DEFAULT_TABLE_NAME,
    format,
    pageSize,
    maxPages,
  };
}

function printHelp(): void {
  process.stdout.write(`notion-sql

Fetch a Notion data source with the REST API, load pages into in-memory SQLite,
and run local SQL against the rows.

Usage:
  op run --env-file=.env -- bun plugins/workflow-overlord/scripts/notion-sql.ts \\
    --data-source-id <uuid-or-collection-url> \\
    --sql 'SELECT "Name", "Status", "Branch" FROM rows ORDER BY createdTime DESC LIMIT 10'

Options:
  --data-source-id <id>  Notion data source UUID or collection:// URL.
  --sql <query>          SQL to run locally. Default table is "rows".
  --table <name>         SQLite table name to create. Default: rows.
  --format <json|table>  Output format. Default: json.
  --page-size <n>        Notion page size. Default: 100.
  --max-pages <n>        Safety cap on fetched pages. Default: 1000.

Also creates a quoted alias view named after the collection URL, so this works:
  SELECT "Name" FROM "collection://<data-source-id>" LIMIT 1
`);
}

async function fetchAllRows(args: {
  token: string;
  dataSourceId: string;
  pageSize: number;
  maxPages: number;
}): Promise<Row[]> {
  const rows: Row[] = [];
  let cursor: string | null | undefined;

  while (rows.length < args.maxPages) {
    const response = await queryDataSourcePage({
      token: args.token,
      dataSourceId: args.dataSourceId,
      pageSize: Math.min(args.pageSize, args.maxPages - rows.length),
      startCursor: cursor,
    });

    for (const page of response.results ?? []) {
      rows.push(notionPageToRow(page));
    }

    if (!response.has_more || !response.next_cursor) {
      break;
    }
    cursor = response.next_cursor;
  }

  return rows;
}

async function queryDataSourcePage(args: {
  token: string;
  dataSourceId: string;
  pageSize: number;
  startCursor?: string | null;
}): Promise<QueryResponse> {
  const body: Record<string, unknown> = {
    page_size: args.pageSize,
    result_type: 'page',
  };
  if (args.startCursor) {
    body.start_cursor = args.startCursor;
  }

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${normalizeDataSourceId(args.dataSourceId)}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': process.env.NOTION_VERSION ?? DEFAULT_NOTION_VERSION,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion data source query failed (${response.status}): ${text}`);
  }

  return (await response.json()) as QueryResponse;
}

function loadRows(db: Database, rows: Row[], tableName: string, aliases: string[]): void {
  const columns = collectColumns(rows);
  const columnDefs = columns.map((column) => `${quoteIdent(column)} ${inferSqliteType(rows, column)}`);
  db.run(`CREATE TABLE ${quoteIdent(tableName)} (${columnDefs.join(', ')})`);

  if (rows.length > 0) {
    const placeholders = columns.map(() => '?').join(', ');
    const insert = db.prepare(
      `INSERT INTO ${quoteIdent(tableName)} (${columns.map(quoteIdent).join(', ')}) VALUES (${placeholders})`
    );
    const insertRows = db.transaction((inputRows: Row[]) => {
      for (const row of inputRows) {
        insert.run(...columns.map((column) => row[column] ?? null));
      }
    });
    insertRows(rows);
  }

  for (const alias of aliases) {
    db.run(`CREATE VIEW ${quoteIdent(alias)} AS SELECT * FROM ${quoteIdent(tableName)}`);
  }
}

function collectColumns(rows: Row[]): string[] {
  const columns = new Set(['id', 'url', 'createdTime', 'lastEditedTime', 'archived', 'inTrash']);
  for (const row of rows) {
    for (const column of Object.keys(row)) {
      columns.add(column);
    }
  }
  return [...columns];
}

function inferSqliteType(rows: Row[], column: string): string {
  const values = rows
    .map((row) => row[column])
    .filter((value): value is Exclude<RowValue, null> => value !== null);
  if (values.length === 0) {
    return 'TEXT';
  }
  if (values.every((value) => typeof value === 'number')) {
    return 'REAL';
  }
  return 'TEXT';
}

function quoteIdent(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function propertyToValue(property: NotionProperty): RowValue {
  const type = property.type;
  if (!type) {
    return null;
  }

  const value = property[type];
  switch (type) {
    case 'title':
    case 'rich_text':
      return richTextToPlain(value);
    case 'number':
      return typeof value === 'number' ? value : null;
    case 'checkbox':
      return value === true ? 1 : 0;
    case 'select':
    case 'status':
      return objectName(value);
    case 'multi_select':
      return Array.isArray(value) ? value.map(objectName).filter(Boolean).join(', ') : null;
    case 'date':
      return isRecord(value) ? stringOrNull(value.start) : null;
    case 'url':
    case 'email':
    case 'phone_number':
    case 'created_time':
    case 'last_edited_time':
      return stringOrNull(value);
    case 'formula':
      return isRecord(value) && typeof value.type === 'string'
        ? propertyToValue({ type: value.type, [value.type]: value[value.type] })
        : null;
    case 'unique_id':
      return uniqueIdToPlain(value);
    case 'relation':
      return Array.isArray(value) ? JSON.stringify(value.map((item) => (isRecord(item) ? item.id : item))) : null;
    case 'people':
      return Array.isArray(value) ? JSON.stringify(value.map(personToPlain)) : null;
    case 'files':
      return Array.isArray(value) ? JSON.stringify(value.map(fileToPlain)) : null;
    case 'rollup':
      return rollupToPlain(value);
    default:
      return value == null ? null : JSON.stringify(value);
  }
}

function richTextToPlain(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value
    .map((token) => (isRecord(token) && typeof token.plain_text === 'string' ? token.plain_text : ''))
    .join('');
}

function objectName(value: unknown): string | null {
  return isRecord(value) && typeof value.name === 'string' ? value.name : null;
}

function uniqueIdToPlain(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }
  const number = typeof value.number === 'number' ? String(value.number) : null;
  if (!number) {
    return null;
  }
  return typeof value.prefix === 'string' ? `${value.prefix}-${number}` : number;
}

function rollupToPlain(value: unknown): RowValue {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return null;
  }
  if (value.type === 'number' && typeof value.number === 'number') {
    return value.number;
  }
  if (value.type === 'date' && isRecord(value.date)) {
    return stringOrNull(value.date.start);
  }
  if (value.type === 'array' && Array.isArray(value.array)) {
    return JSON.stringify(value.array);
  }
  return value[value.type] == null ? null : JSON.stringify(value[value.type]);
}

function personToPlain(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  return {
    id: value.id,
    name: value.name,
    type: value.type,
    email: isRecord(value.person) ? value.person.email : undefined,
  };
}

function fileToPlain(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  return {
    name: value.name,
    type: value.type,
    url: isRecord(value.external)
      ? value.external.url
      : isRecord(value.file)
        ? value.file.url
        : undefined,
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
