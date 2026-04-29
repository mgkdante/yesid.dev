// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '$lib/schemas/seo';
import type { PageData as DirectusPageData } from '@repo/shared';

declare global {
	namespace App {
		// interface Error {}
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
