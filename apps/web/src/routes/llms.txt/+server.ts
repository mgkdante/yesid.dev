import type { RequestHandler } from './$types';
import { llmsTxt } from '$lib/server/llms';

// Prerendered at build time (entry registered in svelte.config.js — the file
// is linked from nowhere, so the crawler would never discover it).
export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(llmsTxt(), {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
