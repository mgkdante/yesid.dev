/** Tiny {placeholder} substituter for CMS template strings (go2-t1c2). */
export function fillTemplate(template: string, params: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (m, key: string) => params[key] ?? m);
}
