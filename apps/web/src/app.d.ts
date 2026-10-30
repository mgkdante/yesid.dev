// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '#lib/schemas/seo.ts';
import type { ErrorPageContent } from '#lib/navigation/types.ts';

declare global {
	namespace App {
		/* Status-specific error copy is attached by handleError. */
		interface Error {
			message: string;
			/** errorPage content matching the response status code. Name is
			 * historical — post-27.2 it resolves from the static content layer
			 * (CMS-authored, exported at build time), not a live CMS call.
			 * Undefined when the adapter read fails (handleError degrades
			 * gracefully). */
			cmsErrorPage?: ErrorPageContent;
		}
		interface Locals {}
		interface PageData {
			seo: PageSeo;
		}
		// interface Platform {}
	}
}

declare module '*.svg?raw' {
	const content: string;
	export default content;
}

export {};
