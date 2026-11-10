import { permanentRedirect } from '#lib/server/redirect.ts';
import { localeFromParams, localizeHref } from '#lib/utils/locale-routing.ts';

// All legacy spellings follow the requested locale, including cross-locale URLs.
const slugs = {
	en: 'one-brain-for-four-ai-tools-t3-code-and-notion',
	fr: 'un-seul-cerveau-pour-quatre-outils-dia-t3-code-et-notion',
	es: 'un-solo-cerebro-para-cuatro-herramientas-de-ia-t3-code-y-notion',
};

export function fourAiToolsRedirect({ params }: { params: Partial<Record<string, string>> }): Response {
	const locale = localeFromParams(params);
	return permanentRedirect(localizeHref(`/blog/${slugs[locale]}`, locale));
}
