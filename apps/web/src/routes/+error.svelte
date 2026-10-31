<script lang="ts">
	import { page } from '$app/state';
	import { errorPageContent as staticErrorPageContent, siteLabels } from '#lib/content/index.ts';
	import type { ErrorPageContent } from '#lib/navigation/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { pathLocale, localizeHref } from '#lib/utils/locale-routing.ts';
	import { ErrorPage } from '@yesid/ui/layout';

	// Error renders carry no params and bare test renders no page.url, so the locale comes from the path.
	const locale = $derived(pathLocale(page.url?.pathname ?? '/'));

	// handleError's status-specific row, then the layout's status=0 row, then the static fixture.
	const errorPage: ErrorPageContent = $derived(
		page.error?.cmsErrorPage ?? page.data?.errorPage ?? staticErrorPageContent,
	);
</script>

<ErrorPage
	status={page.status}
	label={resolveLocale(errorPage.label, locale)}
	heading={resolveLocale(errorPage.heading, locale)}
	body={resolveLocale(errorPage.description, locale)}
	suggestions={errorPage.suggestions.map((suggestion) => ({
		label: resolveLocale(suggestion.label, locale),
		href: localizeHref(suggestion.href, locale),
	}))}
	suggestionsLabel={resolveLocale(siteLabels.ui.errorSuggestionsLabel, locale)}
	statusNote={resolveLocale(siteLabels.ui.errorStatusNote, locale) ||
		'// requested path not in service'}
	signLabel={resolveLocale(siteLabels.ui.errorSignLabel, locale)}
/>
