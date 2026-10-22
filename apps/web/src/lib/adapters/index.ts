import { staticAdapter } from './static';
import type { ContentAdapter } from './types';

export const adapter: ContentAdapter = {
	services: staticAdapter.services,
	projects: staticAdapter.projects,
	blog: staticAdapter.blog,
	meta: staticAdapter.meta,
	techStack: staticAdapter.techStack,
	content: { ...staticAdapter.content },
	nav: staticAdapter.nav,
	legal: staticAdapter.legal,
};

export type { ContentAdapter } from './types';
