// Exercise emitted production code with Node, outside Vite/Bun's module loader.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../.svelte-kit/output/server/', import.meta.url);
const { create_server } = await import(new URL('index.js', output));
const { manifest } = await import(new URL('manifest.js', output));
const server = create_server(manifest);
await server.init({ env: {} });
const response = await server.respond(new Request('https://yesid.dev/no-such-page-xyz'), {
	getClientAddress: () => '127.0.0.1',
});
const html = await response.text();
assert.equal(response.status, 404, html.slice(0, 500));
assert.match(html, /data-slot="error-page"/);
console.log('[ssr-runtime] missing path: 404 with site error page');

// Reject external imports/requires anywhere in the emitted server, including lazy chunks.
const packages = 'sanitize-html|htmlparser2|domhandler|domutils|domelementtype|dom-serializer|entities';
const external = new RegExp(`(?:from\\s*|import\\s*|import\\s*\\(|require\\s*\\()\\s*['"](?:${packages})(?:/[^'"]*)?['"]`);
for (const entry of await readdir(output, { recursive: true })) {
	if (!entry.endsWith('.js')) continue;
	const source = await readFile(fileURLToPath(new URL(entry.replaceAll('\\', '/'), output)), 'utf8');
	assert.ok(!external.test(source), `External sanitizer dependency in ${entry}`);
}
console.log('[ssr-runtime] sanitizer/parser chain has no external imports or requires');
