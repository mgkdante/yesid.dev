// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '$lib/schemas/seo';
import type { PageData as DirectusPageData } from '@repo/shared';
import type { ErrorPageContent } from '$lib/content/nav';

declare global {
	namespace App {
		/**
		 * slice-18i Phase 7D: handleError enriches the error object with the
		 * status-specific errorPage content. +error.svelte reads it from
		 * $page.error.cmsErrorPage so each status code can show distinct copy.
		 */
		interface Error {
			message: string;
			/** errorPage content matching the response status code. Name is
			 * historical — post-27.2 it resolves from the static content layer
			 * (CMS-authored, exported at build time), not a live CMS call.
			 * Undefined when the adapter read fails (handleError degrades
			 * gracefully). */
			cmsErrorPage?: ErrorPageContent;
		}
		interface Locals {
			/** Per-request loadPage memo. Survives across +page.server.ts and
			 *  +layout.server.ts calls in the same HTTP request. Set in
			 *  hooks.server.ts handle. */
			pageCache: Map<string, Promise<DirectusPageData>>;
		}
		interface PageData {
			seo: PageSeo;
		}
		/**
		 * go2/w5 round 4: the Tech Stack Engine's shallow-routing state —
		 * opening an archetype drawing pushes one history entry carrying the
		 * slug, so browser back closes the drawing instead of leaving /tech-stack.
		 */
		interface PageState {
			stackEngineDetail?: string;
		}
		// interface Platform {}
	}
}

declare module '*.svg?raw' {
	const content: string;
	export default content;
}

export {};
