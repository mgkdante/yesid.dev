import { ogFontFiles } from '@yesid/seo-kit/og/files';
import type { Project } from '@repo/shared';
import { fitFullSubtitle, OG_CARD_WIDTH } from './card';
import { createOgCardRenderer } from './render';

const { measure } = createOgCardRenderer(ogFontFiles);

/** Runs before any content modules are emitted, using the card's bundled fonts. */
export function validateProjectLines(projects: readonly Project[]): void {
	for (const project of projects) {
		for (const [locale, text] of Object.entries(project.oneLiner)) {
			if (!text?.trim()) continue;
			try {
				fitFullSubtitle(text, OG_CARD_WIDTH - 160, measure);
			} catch (cause) {
				throw new Error(`Project ${project.slug}, locale ${locale}, field one_liner: cannot render fully at 18px or larger. Shorten or simplify this one-liner before exporting.`, { cause });
			}
		}
	}
}
