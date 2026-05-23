import { describe, expect, test } from 'bun:test';
import { getActiveSlice, updateSession, logHandoff, uploadTranscript } from './server.ts';

describe('getActiveSlice', () => {
  test('returns the most recent non-closed slice for the branch', async () => {
    const mockNotion = {
      databases: {
        query: async () => ({
          results: [
            {
              id: 'slice-id-1',
              properties: {
                Title: { title: [{ plain_text: 'slice-test' }] },
                Status: { select: { name: 'open' } },
                Branch: { rich_text: [{ plain_text: 'feat/v2-rebuild' }] },
                Summary: { rich_text: [{ plain_text: 'doing the thing' }] },
              },
            },
          ],
        }),
      },
    };
    const result = await getActiveSlice({
      notion: mockNotion as any,
      branch: 'feat/v2-rebuild',
      slicesDbId: 'db-1',
    });
    expect(result?.id).toBe('slice-id-1');
    expect(result?.title).toBe('slice-test');
    expect(result?.status).toBe('open');
    expect(result?.summary).toBe('doing the thing');
  });

  test('returns null when no slice matches', async () => {
    const mockNotion = { databases: { query: async () => ({ results: [] }) } };
    const result = await getActiveSlice({
      notion: mockNotion as any,
      branch: 'never',
      slicesDbId: 'db-1',
    });
    expect(result).toBeNull();
  });

  test('throws when slicesDbId is empty', async () => {
    await expect(
      getActiveSlice({ notion: {} as any, branch: 'b', slicesDbId: '' })
    ).rejects.toThrow('slicesDbId required');
  });
});

describe('updateSession', () => {
  test('patches Summary on the Sessions row', async () => {
    let captured: any = null;
    const mockNotion = {
      pages: {
        update: async (args: any) => {
          captured = args;
          return { id: args.page_id };
        },
      },
    };
    await updateSession({
      notion: mockNotion as any,
      sessionId: 'session-id-1',
      summary: 'did the thing',
    });
    expect(captured.page_id).toBe('session-id-1');
    expect(captured.properties.Summary.rich_text[0].text.content).toBe('did the thing');
  });

  test('truncates summary to 2000 chars', async () => {
    let captured: any = null;
    const mockNotion = {
      pages: { update: async (args: any) => { captured = args; return { id: args.page_id }; } },
    };
    const huge = 'x'.repeat(3000);
    await updateSession({ notion: mockNotion as any, sessionId: 's', summary: huge });
    expect(captured.properties.Summary.rich_text[0].text.content.length).toBe(2000);
  });

  test('throws on empty sessionId', async () => {
    await expect(
      updateSession({ notion: {} as any, sessionId: '', summary: 'x' })
    ).rejects.toThrow('sessionId required');
  });
});

describe('logHandoff', () => {
  test('appends Handoff heading + paragraphs', async () => {
    let captured: any = null;
    const mockNotion = {
      blocks: {
        children: {
          append: async (args: any) => {
            captured = args;
            return { results: [] };
          },
        },
      },
    };
    await logHandoff({
      notion: mockNotion as any,
      sliceId: 'slice-1',
      body: 'Files: src/foo.ts\n\nTests: passed\n\nDeviations: none',
    });
    expect(captured.block_id).toBe('slice-1');
    expect(captured.children[0].heading_2.rich_text[0].text.content).toBe('Handoff');
    expect(captured.children.length).toBe(4); // heading + 3 paragraphs
  });

  test('throws on empty sliceId', async () => {
    await expect(
      logHandoff({ notion: {} as any, sliceId: '', body: 'x' })
    ).rejects.toThrow('sliceId required');
  });
});

describe('uploadTranscript', () => {
  test('does 2 fetches (create + put) + 1 pages.update', async () => {
    const calls: string[] = [];
    const mockNotion = {
      pages: {
        update: async (args: any) => {
          calls.push('pages.update');
          expect(args.properties.Transcript.files[0].name).toBe('s.md');
          return { id: args.page_id };
        },
      },
    };
    process.env.NOTION_TOKEN = 'test-token';
    const mockFetch = (async (url: any, init: any) => {
      calls.push(`fetch:${url}`);
      if (typeof url === 'string' && url.endsWith('/file_uploads')) {
        return new Response(JSON.stringify({ id: 'upload-1', upload_url: 'https://signed.url' }), { status: 200 });
      }
      if (typeof url === 'string' && url === 'https://signed.url') {
        return new Response('', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as any;
    await uploadTranscript({
      notion: mockNotion as any,
      sessionId: 'session-1',
      markdown: '# transcript',
      filename: 's.md',
      fetchImpl: mockFetch,
    });
    expect(calls).toContain('fetch:https://api.notion.com/v1/file_uploads');
    expect(calls).toContain('fetch:https://signed.url');
    expect(calls).toContain('pages.update');
  });
});
