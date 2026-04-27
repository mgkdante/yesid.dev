/**
 * @deprecated As of slice 18h-ii Phase 5 (renderer flipped to IconRenderer.svelte
 * which reads IconRecord directly from the icons collection). This helper remains
 * for the legacy bare-slug fallback path during transition. Drop in slice-18k
 * once all consumers migrate.
 */

/**
 * Resolve a tech-stack icon string to a full Iconify icon ID.
 *
 * If the input already contains a namespace (e.g. "logos:apache-airflow"),
 * it's returned as-is. Otherwise, the default namespace is prepended
 * (e.g. "airflow" → "logos:airflow"). Defaults to the `logos` Iconify set
 * (https://icon-sets.iconify.design/logos/).
 *
 * @deprecated Use IconRenderer.svelte with an IconRecord prop instead.
 * This utility remains for the legacy bare-slug transition path only.
 * Will be removed in slice-18k.
 */
export function toIconifyId(name: string, defaultNamespace = 'logos'): string {
	if (!name) return '';
	if (name.includes(':')) return name;
	return `${defaultNamespace}:${name}`;
}
