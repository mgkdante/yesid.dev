/**
 * services fetcher — reads `services` with translations + deliverables + sections,
 * plus a single `projects_services` junction read to attach relatedProjects.
 *
 * Mirrors apps/web/src/lib/adapters/directus.ts:1596 `toService` + L1836 `fetchServices`.
 * Optimization vs runtime: batch-fetch the full junction once instead of N+1 per service.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { toLocalizedString, toLocalizedStringOrUndef } from '../locale';
import {
	ServiceSchema,
	type Service,
	type ServiceSection,
} from '../schemas/service';
import type { LocalizedString } from '@repo/shared';
import type { FetcherContext } from './types';
import { stackFromTechM2M, type DirectusTechStackJunctionRow } from './projects';

export interface DirectusServiceTranslation {
	languages_code: string;
	title?: string | null;
	subtitle?: string | null;
	description?: string | null;
	long_description?: string | null;
	value_proposition?: string | null;
	benefit_headline?: string | null;
	impact_metric_value?: string | null;
	impact_metric_label?: string | null;
}

export interface DirectusServiceDeliverableTranslation {
	languages_code: string;
	label?: string | null;
}

export interface DirectusServiceDeliverable {
	id: number;
	sort: number | null;
	translations?: DirectusServiceDeliverableTranslation[];
}

export interface DirectusServiceSectionTranslation {
	languages_code: string;
	title?: string | null;
	content?: string | null;
}

export interface DirectusServiceSectionRow {
	id: number;
	sort: number | null;
	translations?: DirectusServiceSectionTranslation[];
}

export interface DirectusService {
	id: string;
	station: number;
	icon?: string | null;
	svg?: string | null;
	visible?: boolean | null;
	translations?: DirectusServiceTranslation[];
	deliverables?: DirectusServiceDeliverable[];
	sections?: DirectusServiceSectionRow[];
	/** Normalized tech stack: M2M to tech_stack, ordered by junction `sort`. */
	tech_stack?: DirectusTechStackJunctionRow[];
}

interface JunctionRow {
	project_id: string;
	service_id: string;
}

/** Pure transform — DirectusService → Service (without relatedProjects, filled later). */
export function toService(row: DirectusService): Service {
	const translations = row.translations ?? [];
	const service: Service = {
		id: row.id,
		station: row.station,
		title: toLocalizedString(translations, 'title'),
		description: toLocalizedString(translations, 'description'),
		relatedProjects: [],
	};
	if (row.svg) service.svg = row.svg;
	if (row.visible !== null && row.visible !== undefined) service.visible = row.visible;
	const subtitle = toLocalizedStringOrUndef(translations, 'subtitle');
	if (subtitle) service.subtitle = subtitle;
	const longDescription = toLocalizedStringOrUndef(translations, 'long_description');
	if (longDescription) service.longDescription = longDescription;
	const valueProposition = toLocalizedStringOrUndef(translations, 'value_proposition');
	if (valueProposition) service.valueProposition = valueProposition;
	const benefitHeadline = toLocalizedStringOrUndef(translations, 'benefit_headline');
	if (benefitHeadline) service.benefitHeadline = benefitHeadline;
	const stack = stackFromTechM2M(row.tech_stack);
	if (stack.length > 0) service.stack = stack;

	const impactValue = toLocalizedStringOrUndef(translations, 'impact_metric_value');
	const impactLabel = toLocalizedStringOrUndef(translations, 'impact_metric_label');
	if (impactValue && impactLabel) {
		service.impactMetric = { value: impactValue, label: impactLabel };
	}

	const deliverables = (row.deliverables ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((d): LocalizedString => toLocalizedString(d.translations ?? [], 'label'));
	if (deliverables.length > 0) service.deliverables = deliverables;

	const sections = (row.sections ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((s): ServiceSection => ({
			title: toLocalizedString(s.translations ?? [], 'title'),
			content: toLocalizedString(s.translations ?? [], 'content'),
		}));
	if (sections.length > 0) service.sections = sections;

	return service;
}

/** Fetch + validate all services with relatedProjects attached via junction batch read. */
export async function fetchServices({ client }: FetcherContext): Promise<readonly Service[]> {
	const [rawServices, junction] = await Promise.all([
		client.request(
			readItems('services', {
				fields: [
					'*',
					{ translations: ['*'] } as unknown as string,
					{ deliverables: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
					{ sections: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
					{ tech_stack: ['sort', { tech_stack_id: ['id', 'name'] }] } as unknown as string,
				],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<DirectusService[]>,
		client.request(
			readItems('projects_services', {
				fields: ['service_id', 'project_id'],
				limit: -1,
			}),
		) as Promise<unknown> as Promise<JunctionRow[]>,
	]);

	const byService = new Map<string, string[]>();
	for (const row of junction) {
		const list = byService.get(row.service_id) ?? [];
		list.push(row.project_id);
		byService.set(row.service_id, list);
	}

	const services = rawServices.map(toService);
	for (const s of services) {
		(s as { relatedProjects: string[] }).relatedProjects = byService.get(s.id) ?? [];
	}

	return z.array(ServiceSchema).parse(services);
}
