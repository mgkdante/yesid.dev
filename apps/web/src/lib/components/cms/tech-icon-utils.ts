/**
 * Resolve a tech-stack icon string to a full Iconify icon ID.
 *
 * If the input already contains a namespace (e.g. "logos:apache-airflow"),
 * it's returned as-is. Otherwise, the default namespace is prepended
 * (e.g. "airflow" → "logos:airflow"). Defaults to the `logos` Iconify set
 * (https://icon-sets.iconify.design/logos/).
 *
 * Used by TechIcon.svelte. Editors can override per-item in Data Studio
 * by storing a fully-qualified iconify ID (e.g. "logos:apache-airflow")
 * when the bare slug doesn't match an existing icon.
 */
export function toIconifyId(name: string, defaultNamespace = 'logos'): string {
	if (!name) return '';
	if (name.includes(':')) return name;
	return `${defaultNamespace}:${name}`;
}
