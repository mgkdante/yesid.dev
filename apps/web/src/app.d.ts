// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PageSeo } from '$lib/schemas/seo';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
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
