import type { ClassValue } from 'clsx';
import { describe, expect, it } from 'vitest';
import { cn } from './cn';
import { createCn, createTwMergeConfig } from './create-cn';

const LEGACY_TW_MERGE_CONFIG = {
	extend: {
		theme: {
			text: [
				'hero',
				'hero-mobile',
				'display',
				'title',
				'heading',
				'subheading',
				'body',
				'small',
				'mono',
				'caption',
				'micro',
			],
			color: [
				'signage-bg',
				'signage-text',
				'accent-text',
				'accent-hover',
				'primary-hover',
				'terminal',
				'manifesto',
				'success',
				'border-subtle',
				'border-strong',
			],
		},
	},
} as const;

const LEGACY_OUTPUT_FIXTURES: Array<{
	label: string;
	inputs: ClassValue[];
	output: string;
}> = [
	{
		label: 'standard Tailwind conflicts',
		inputs: ['px-2', 'px-4'],
		output: 'px-4',
	},
	{
		label: 'clsx flattening and conditional classes',
		inputs: ['px-2', false, null, undefined, ['px-4'], { block: true }],
		output: 'px-4 block',
	},
	{
		label: 'brand text-scale conflicts',
		inputs: ['text-body', 'text-caption'],
		output: 'text-caption',
	},
	{
		label: 'brand text scale and color coexist',
		inputs: ['text-signage-bg', 'text-body'],
		output: 'text-signage-bg text-body',
	},
	{
		label: 'brand text-scale and color conflicts stay independent',
		inputs: ['text-body', 'text-caption', 'text-signage-text', 'text-accent-text'],
		output: 'text-caption text-accent-text',
	},
];

describe('cn factory split', () => {
	const factoryCn = createCn();

	for (const fixture of LEGACY_OUTPUT_FIXTURES) {
		it(`preserves ${fixture.label}`, () => {
			expect(factoryCn(...fixture.inputs)).toBe(fixture.output);
			expect(cn(...fixture.inputs)).toBe(fixture.output);
		});
	}

	it('covers every legacy yesid.dev class group in the factory base', () => {
		const factoryConfig = createTwMergeConfig();

		for (const group of ['text', 'color'] as const) {
			const factoryVocabulary = new Set(factoryConfig.extend.theme[group]);
			const missingLegacyTokens = LEGACY_TW_MERGE_CONFIG.extend.theme[group].filter(
				(token) => !factoryVocabulary.has(token),
			);

			expect(missingLegacyTokens).toEqual([]);
		}
	});
});
