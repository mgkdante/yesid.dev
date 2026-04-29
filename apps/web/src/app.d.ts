// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '$lib/schemas/seo';
import type { PageData as DirectusPageData } from '@repo/shared';
import type { ErrorPageContent } from '$lib/content/nav';

declare global {
	namespace App {
		/**
		 * slice-18i Phase 7D: handleError enriches the error object with the
		 * status-specific CMS errorPage row. +error.svelte reads it from
		 * $page.error.cmsErrorPage so each status code can show distinct copy.
		 */
		interface Error {
			message: string;
			/** CMS-fetched errorPage row matching the response status code.
			 * Undefined when handleError cannot reach the CMS (fails gracefully). */
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
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.svg?raw' {
	const content: string;
	export default content;
}

export {};
