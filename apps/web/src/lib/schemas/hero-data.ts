import { z } from 'zod';

export const HeroMetricKeySchema = z.enum(['vehicles', 'delay', 'routes']);

export const HeroMetricSchema = z.object({
	value: z.number(),
	unit: z.string().optional(),
	key: HeroMetricKeySchema,
	/** Runtime {coverage} percentage substituted into the localized delay sub-label. */
	coverage: z.number().optional(),
	/** Runtime {total} route count substituted into the localized routes sub-label. */
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

export type HeroMetric = z.infer<typeof HeroMetricSchema>;
export type HeroQueryRow = z.infer<typeof HeroQueryRowSchema>;
export type HeroData = z.infer<typeof HeroDataSchema>;
