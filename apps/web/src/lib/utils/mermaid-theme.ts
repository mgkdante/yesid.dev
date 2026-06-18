// Mermaid theme builder.
//
// Mermaid renders with `theme: 'base'` plus an explicit `themeVariables` map so
// diagrams match the site's design tokens instead of Mermaid's defaults. The map
// is assembled at render time from the live CSS custom properties (read via
// `getComputedStyle`), which means it automatically tracks the active light/dark
// theme: re-running the builder after a `data-theme` flip yields the new palette.
//
// Client-only — calls `getComputedStyle` / `document`. Reading CSS custom
// properties is the only side-effect-free thing it does; it owns no state and
// triggers no rendering itself.

/** The `themeVariables` object passed to `mermaid.initialize`. */
export type MermaidThemeVariables = Record<string, string>;

/** Read a CSS custom property off a computed style, falling back when unset. */
function cssVar(style: CSSStyleDeclaration, name: string, fallback: string): string {
	return style.getPropertyValue(name).trim() || fallback;
}

/**
 * Build the Mermaid `themeVariables` map from the current design tokens.
 *
 * Resolves the site's CSS custom properties against `root` (or
 * `document.documentElement` when no element is supplied), so the returned
 * palette reflects whichever light/dark theme is active at call time. Call again
 * after a theme change to obtain the updated palette.
 *
 * @param root Element to resolve CSS custom properties against. Defaults to the
 *   document root when omitted or null.
 */
export function buildMermaidThemeVariables(root?: Element | null): MermaidThemeVariables {
	const style = getComputedStyle(root ?? document.documentElement);
	const primary = cssVar(style, '--primary', '#E07800');
	const accent = cssVar(style, '--accent', '#FFB627');
	const background = cssVar(style, '--background', '#141414');
	const card = cssVar(style, '--card', '#1a1a1a');
	const foreground = cssVar(style, '--foreground', '#F5F5F0');
	const muted = cssVar(style, '--muted-foreground', '#949494');
	const border = cssVar(style, '--border-subtle', '#2f2f2f');

	return {
		background,
		mainBkg: card,
		primaryColor: card,
		primaryBorderColor: primary,
		primaryTextColor: foreground,
		secondaryColor: background,
		secondaryBorderColor: accent,
		secondaryTextColor: foreground,
		tertiaryColor: background,
		tertiaryBorderColor: border,
		tertiaryTextColor: foreground,
		lineColor: accent,
		textColor: foreground,
		nodeTextColor: foreground,
		clusterBkg: background,
		clusterBorder: primary,
		edgeLabelBackground: card,
		labelTextColor: foreground,
		noteBkgColor: card,
		noteTextColor: foreground,
		noteBorderColor: border,
		actorBkg: card,
		actorBorder: primary,
		actorTextColor: foreground,
		activationBkgColor: primary,
		activationBorderColor: accent,
		signalColor: muted,
		signalTextColor: foreground,
	};
}
