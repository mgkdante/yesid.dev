<!--
  FilterSummary — Shared "N results" count + "clear filters" button.
  Used in both Blog and Projects listing pages.

  i18n: pluralization is locale-aware. Callers pass a localized singular/plural
  template pair (`countLabel`) carrying the full "{count} noun" phrasing per form,
  e.g. en { singular: '{count} result', plural: '{count} results' } /
       fr { singular: '{count} résultat', plural: '{count} résultats' }.
  The component picks the form per locale (EN: plural unless count === 1;
  FR: plural only when count >= 2 — 0 and 1 are singular in French) and
  substitutes {count}. This replaces the old hardcoded English `+ "s"` rule,
  which was wrong for French zero ("0 résultat", not "0 résultats").
-->
<script lang="ts">
	import type { LocalizedString } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { siteLabels } from '$lib/content';

	const locale = getLocale();

	export interface FilterSummaryProps {
		count: number;
		/** Localized singular/plural count phrasing. Each form carries the full
		 *  "{count} noun" template so the noun + its plural marker stay per-locale. */
		countLabel: { singular: LocalizedString; plural: LocalizedString };
		onClear: () => void;
	}

	let { count, countLabel, onClear }: FilterSummaryProps = $props();

	const clearFiltersLabel = resolveLocale(siteLabels.navChrome.shared.clearFiltersLabel, locale);

	// Per-locale plural selection. French treats 0 as singular; English does not.
	const isPlural = $derived(locale === 'fr' ? count >= 2 : count !== 1);
	const summaryText = $derived(
		resolveLocale(isPlural ? countLabel.plural : countLabel.singular, locale).replace(
			'{count}',
			String(count)
		)
	);
</script>

<div class="mb-3 flex items-center gap-2">
	<span class="text-xs text-[var(--muted-foreground)]">
		{summaryText}
	</span>
	<button
		class="tap-feedback inline-flex items-center min-h-11 px-2 font-mono text-caption text-primary underline transition-colors hover:text-[var(--foreground)] active:text-[var(--foreground)]"
		onclick={onClear}
	>
		{clearFiltersLabel}
	</button>
</div>
