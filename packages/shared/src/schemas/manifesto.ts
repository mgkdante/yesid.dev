import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ManifestoContentSchema = z.object({
	statement: z.object({
		line1: LocalizedStringSchema,
		lineHuge: LocalizedStringSchema,
		line3Part1: LocalizedStringSchema,
		line3Highlight: LocalizedStringSchema,
		line3Part2: LocalizedStringSchema,
	}),
	terminal: z.object({
		user: LocalizedStringSchema,
		command: LocalizedStringSchema,
	}),
	pills: z.array(
		z.object({
			label: LocalizedStringSchema,
			serviceId: z.string(),
		}),
	).readonly(),
	edgeLeft: z.object({
		sectionNumber: LocalizedStringSchema,
		sectionName: LocalizedStringSchema,
		location: LocalizedStringSchema,
	}),
	edgeRight: z.object({
		lat: LocalizedStringSchema,
		lng: LocalizedStringSchema,
		src: LocalizedStringSchema,
		via: LocalizedStringSchema,
		dst: LocalizedStringSchema,
		node: LocalizedStringSchema,
		status: LocalizedStringSchema,
	}),
	edgeBottom: z.object({
		connected: LocalizedStringSchema,
		line: LocalizedStringSchema,
		url: LocalizedStringSchema,
		version: LocalizedStringSchema,
		scrollHint: LocalizedStringSchema,
	}),
	transit: z.object({
		arrivalLabel: LocalizedStringSchema,
		platformBadge: LocalizedStringSchema,
		directionBadge: LocalizedStringSchema,
	}),
	ticks: z.array(z.string()).readonly(),
	hiddenTransitLines: z.array(
		z.object({
			name: LocalizedStringSchema,
			color: z.string(),
		}),
	).readonly(),
});

export type ManifestoContent = z.infer<typeof ManifestoContentSchema>;
