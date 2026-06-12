// %lang% placeholder contract: app.html carries it, hooks.server.ts replaces
// it per request from the URL locale. Path-derived (not params-derived) so it
// works for error renders and is trivially CDN-safe (locale is in the path).
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { handle } from '../hooks.server';

function fakeEvent(pathname: string) {
	return {
		request: new Request(`https://yesid.dev${pathname}`),
		url: new URL(`https://yesid.dev${pathname}`),
		locals: {},
	} as unknown as Parameters<typeof handle>[0]['event'];
}

async function transformFor(pathname: string): Promise<string> {
	let captured: ((opts: { html: string }) => string) | undefined;
	const resolve = vi.fn(
		async (_event: unknown, opts?: { transformPageChunk?: (o: { html: string }) => string }) => {
			captured = opts?.transformPageChunk;
			return new Response('ok', { headers: { 'content-type': 'text/html' } });
		},
	);
	await handle({ event: fakeEvent(pathname), resolve } as never);
	expect(captured).toBeDefined();
	return captured!({ html: '<html lang="%lang%" data-theme="dark">' });
}

describe('html lang attribute', () => {
	it('app.html uses the %lang% placeholder (not a hardcoded lang)', () => {
		const appHtml = readFileSync('src/app.html', 'utf-8');
		expect(appHtml).toContain('lang="%lang%"');
		expect(appHtml).not.toContain('lang="en"');
	});
	it('replaces %lang% with en for unprefixed paths', async () => {
		expect(await transformFor('/about')).toContain('lang="en"');
	});
	it('replaces %lang% with fr under the /fr prefix', async () => {
		expect(await transformFor('/fr/about')).toContain('lang="fr"');
	});
});
