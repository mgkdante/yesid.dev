// Journey schemas — runtime mirror of JourneySkill + JourneyPanel in $lib/types.
// HighlightEffect and SkillIcon are z.enum (string-literal unions in TS).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { JourneySkill, JourneyPanel, HighlightEffect, SkillIcon } from '$lib/types';

export const HighlightEffectSchema = z.enum(['scale', 'gradient', 'wave', 'charReveal']);

export const SkillIconSchema = z.enum([
	'sql',
	'typescript',
	'python',
	'sveltekit',
	'gsap',
	'powerbi',
	'docker',
]);

export const JourneySkillSchema = z.object({
	id: z.string(),
	name: z.string(),
	subtitle: z.string().optional(),
	icon: SkillIconSchema,
});

export const JourneyPanelSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	text: LocalizedStringSchema,
	highlightWords: z.array(z.string()),
	highlightEffect: HighlightEffectSchema,
	skills: z.array(JourneySkillSchema),
});

// Drift detectors.
type _HighlightEffectCheck = z.infer<typeof HighlightEffectSchema> extends HighlightEffect
	? HighlightEffect extends z.infer<typeof HighlightEffectSchema>
		? true
		: false
	: false;
const _highlightEffectCheck: _HighlightEffectCheck = true;
void _highlightEffectCheck;

type _SkillIconCheck = z.infer<typeof SkillIconSchema> extends SkillIcon
	? SkillIcon extends z.infer<typeof SkillIconSchema>
		? true
		: false
	: false;
const _skillIconCheck: _SkillIconCheck = true;
void _skillIconCheck;

type _JourneySkillCheck = z.infer<typeof JourneySkillSchema> extends JourneySkill
	? JourneySkill extends z.infer<typeof JourneySkillSchema>
		? true
		: false
	: false;
const _journeySkillCheck: _JourneySkillCheck = true;
void _journeySkillCheck;

type _JourneyPanelCheck = z.infer<typeof JourneyPanelSchema> extends JourneyPanel
	? JourneyPanel extends z.infer<typeof JourneyPanelSchema>
		? true
		: false
	: false;
const _journeyPanelCheck: _JourneyPanelCheck = true;
void _journeyPanelCheck;
