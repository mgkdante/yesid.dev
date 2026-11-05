import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

/** The same public URL contract applies to legacy and named proof. */
const ProofUrlSchema = z.url({ protocol: /^https$/ }).refine((value) => {
	try {
		const url = new URL(value);
		return !url.username && !url.password;
	} catch { return false; }
}, 'Proof links must not contain credentials');

/** One public claim, shared by services and projects. Missing proof remains valid. */
export const ImpactMetricSchema = z.object({
	value: LocalizedStringSchema,
	label: LocalizedStringSchema,
	/** Locale-neutral baseline for a before-and-after comparison. */
	before: z.string().optional(),
	/** Public evidence only; credentials must never be embedded in a link. */
	sourceUrl: ProofUrlSchema.optional(),
	/** Public site/document names are shared across locales, in editorial order. */
	sources: z.array(z.object({ label: z.string().trim().min(1), url: ProofUrlSchema })).optional(),
	/** Calendar date, not an instant. Consumers must not apply a local time-zone shift. */
	asOf: z.iso.date().optional(),
});

export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;
