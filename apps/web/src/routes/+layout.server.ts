// Every page uses validated build-time content; unknown detail rows still resolve to 404.
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { catalog as defaultCatalog, type ContentCatalog } from '#lib/catalog/index.ts';
import { resolvePageSeo } from '#lib/adapters/page-seo.ts';
import { localeFromParams, stripLocaleSegment, delocalizePath } from '#lib/utils/locale-routing.ts';

export const prerender = true;

export const load = (async ({ route, params, url }, content: ContentCatalog = defaultCatalog) => {
	const routeId = stripLocaleSegment(route.id ?? '/__error');
	const locale = localeFromParams(params, url.pathname);
	if (route.id !== null) {
		if (!content.isPathPublished(delocalizePath(url.pathname)) || !content.isLocaleAvailable(locale)) error(404, 'Not found');
		if (routeId === '/projects/[slug]') {
			const project = content.projects.bySlug(params.slug ?? '');
			if (!project || !content.isAvailable({ kind: 'project', entity: project }, locale)) error(404, 'Project not found');
		}
		if (routeId === '/services/[id]') {
			const service = content.services.byId(params.id ?? '');
			if (!service || !content.isAvailable({ kind: 'service', entity: service }, locale)) error(404, 'Service not found');
		}
		if (routeId === '/blog/[slug]') {
			const post = content.blog.bySlug(params.slug ?? '');
			if (!post || !content.isAvailable({ kind: 'post', entity: post }, locale)) error(404, 'Post not found');
		}
	}
	return {
		headerLinks: content.nav.byPlacement('header'),
		footerLinks: content.nav.byPlacement('footer'),
		menuItems: content.nav.byPlacement('menu'),
		errorPage: content.content.errorPage(),
		morphShapes: content.content.morphShapes(),
		locale,
		seo: await resolvePageSeo(routeId, locale, params as Record<string, string>, { catalog: content }),
		themeColor: content.meta.siteSeoDefaults().themeColor,
	};
}) satisfies LayoutServerLoad;
