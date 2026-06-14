// Hero-data schemas — runtime mirror of HeroMetric, HeroQueryRow, HeroData
// from $lib/content/hero-data. The metric `key` is a string-literal union
// ('vehicles' | 'delay' | 'routes') mirrored as z.enum.

import { z } from 'zod';
import type { HeroMetric, HeroQueryRow, HeroData } from '$lib/content/hero-data';

export const HeroMetricKeySchema = z.enum(['vehicles', 'delay', 'routes']);

export const HeroMetricSchema = z.object({
	value: z.number(),
	unit: z.string().optional(),
	key: HeroMetricKeySchema,
	// CMS truth: the dashboard card LABEL/SUB copy lives in
	// siteLabels.heroDashboard now (resolved in HeroMetrics by key), so the
	// metric carries only code-owned dynamic data. WITHOUT coverage/total here,
	// parsePort() (Zod drops unknown keys) would strip the numbers the CMS
	// sub-templates interpolate off the SSR heroData, and {coverage}/{total}
	// would render literally on the client.
	coverage: z.number().optional(),
	total: z.number().optional(),
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
