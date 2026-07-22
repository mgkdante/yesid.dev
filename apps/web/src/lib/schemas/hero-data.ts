// Hero-data schemas — runtime mirror of HeroMetric, HeroQueryRow, HeroData
// from $lib/live. The metric `key` is a string-literal union
// ('vehicles' | 'delay' | 'routes') mirrored as z.enum.

import { z } from 'zod';
import type { HeroMetric, HeroQueryRow, HeroData } from '$lib/live';
import type { AssertSchemaMatches } from '$lib/types';

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

// Drift detectors — compile error (`true satisfies never`) on schema/type drift.
true satisfies AssertSchemaMatches<z.infer<typeof HeroMetricSchema>, HeroMetric>;
true satisfies AssertSchemaMatches<z.infer<typeof HeroQueryRowSchema>, HeroQueryRow>;
true satisfies AssertSchemaMatches<z.infer<typeof HeroDataSchema>, HeroData>;
