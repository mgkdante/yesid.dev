// Hero-data schemas — runtime mirror of HeroMetric, HeroQueryRow, HeroData
// from $lib/content/hero-data. The metric `key` is a string-literal union
// ('vehicles' | 'delay' | 'routes') mirrored as z.enum.

import { z } from 'zod';
import type { HeroMetric, HeroQueryRow, HeroData } from '$lib/content/hero-data';

export const HeroMetricKeySchema = z.enum(['vehicles', 'delay', 'routes']);

// Mirrors LocalizedString { en; fr?; es? }.
const LocalizedStringSchema = z.object({
	en: z.string(),
	fr: z.string().optional(),
	es: z.string().optional(),
});

export const HeroMetricSchema = z.object({
	label: z.string(),
	value: z.number(),
	unit: z.string().optional(),
	sub: z.string(),
	key: HeroMetricKeySchema,
	// WITHOUT these, parsePort() strips the metric FR off the SSR heroData
	// (Zod drops unknown keys) and localizeHeroData falls back to the EN label.
	// The drift detector below misses it because both are optional on HeroMetric.
	labelI18n: LocalizedStringSchema.optional(),
	subI18n: LocalizedStringSchema.optional(),
});

export const HeroQueryRowSchema = z.object({
	route: z.string(),
	avgDelayS: z.number(),
	vehicles: z.number(),
});

export const HeroDataSchema = z.object({
	metrics: z.array(HeroMetricSchema),
	queryRows: z.array(HeroQueryRowSchema),
	queryTime: z.number(),
});

// Drift detectors.
type _HeroMetricCheck = z.infer<typeof HeroMetricSchema> extends HeroMetric
	? HeroMetric extends z.infer<typeof HeroMetricSchema>
		? true
		: false
	: false;
const _heroMetricCheck: _HeroMetricCheck = true;
void _heroMetricCheck;

type _HeroQueryRowCheck = z.infer<typeof HeroQueryRowSchema> extends HeroQueryRow
	? HeroQueryRow extends z.infer<typeof HeroQueryRowSchema>
		? true
		: false
	: false;
const _heroQueryRowCheck: _HeroQueryRowCheck = true;
void _heroQueryRowCheck;

type _HeroDataCheck = z.infer<typeof HeroDataSchema> extends HeroData
	? HeroData extends z.infer<typeof HeroDataSchema>
		? true
		: false
	: false;
const _heroDataCheck: _HeroDataCheck = true;
void _heroDataCheck;
