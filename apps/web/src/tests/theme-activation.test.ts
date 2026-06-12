// GO-W2.2 T5: app.html must ship the pre-paint theme script. Dark stays the
// no-JS/markup default; the script honors localStorage('theme') then
// prefers-color-scheme. Edge-cached HTML is shared across users, so this
// inline script is the ONLY correct theming channel (hooks.server.ts
// s-maxage=86400).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appHtml = readFileSync(resolve(process.cwd(), 'src/app.html'), 'utf-8');

describe('theme activation (app.html)', () => {
	it('keeps data-theme="dark" as the markup default', () => {
		// lang is the %lang% placeholder since slice-28.6 (hooks.server.ts
		// transformPageChunk replaces it per request) — this test pins the
		// data-theme default, not the lang value.
		expect(appHtml).toMatch(/<html lang="%lang%" data-theme="dark">/);
	});
	it('drops the dead class="dark" hook', () => {
		expect(appHtml).not.toContain('class="dark"');
	});
	it('ships the pre-paint inline script before %sveltekit.head%', () => {
		const scriptIdx = appHtml.indexOf("localStorage.getItem('theme')");
		const headIdx = appHtml.indexOf('%sveltekit.head%');
		expect(scriptIdx).toBeGreaterThan(-1);
		expect(scriptIdx).toBeLessThan(headIdx);
		expect(appHtml).toContain("matchMedia('(prefers-color-scheme: light)')");
		expect(appHtml).toContain('d.dataset.theme = t;');
	});
});
