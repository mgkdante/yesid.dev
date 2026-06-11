/**
 * about-page block fetcher — block_about_content.
 *
 * The most complex block: 13 nested types, mix of plain strings + LocalizedString
 * leaves in deeply nested per-locale JSON columns. `tech_stack` and `client_logos`
 * live on the parent row (Phase 1 fix-up 377401c) — NOT in translations.
 *
 * Mirrors transformBlockAboutContent in apps/web/src/lib/adapters/directus.ts:952.
 */

import { readSingleton } from '@directus/sdk';
import { toLocalizedJSON } from '../locale';
import { AboutContentSchema, type LocalizedString, type AboutContent } from '@repo/shared';
import { asSingletonRow } from './singleton';
import type { FetcherContext } from './types';

interface BlockRow {
	id: number;
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

export function toAboutContent(raw: BlockRow): AboutContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	const clientCount = typeof raw.client_count === 'number' ? raw.client_count : 0;

	function enVal<T>(field: string, fallback: T): T {
		const enRow = tr.find((r) => r.languages_code === 'en') ?? tr[0];
		if (!enRow) return fallback;
		const v = (enRow as Record<string, unknown>)[field];
		return (v !== undefined && v !== null ? v : fallback) as T;
	}

	// --- identity ---
	const rawIdentity = enVal<Record<string, unknown>>('identity', {});
	const rawPolaroids = Array.isArray(rawIdentity.polaroids)
		? (rawIdentity.polaroids as Array<Record<string, unknown>>)
		: [];

	const identityByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const id = row.identity;
		if (id && typeof id === 'object' && !Array.isArray(id)) {
			identityByLocale.set(code, id as Record<string, unknown>);
		}
	}
	function identityLS(field: string): LocalizedString {
		const result: LocalizedString = { en: '' };
		for (const [locale, id] of identityByLocale) {
			const v = (id as Record<string, unknown>)[field];
			if (typeof v === 'string' && v.length > 0) {
				if (locale === 'en') result.en = v;
				else if (locale === 'fr') result.fr = v;
				else if (locale === 'es') result.es = v;
			}
		}
		return result;
	}

	const polaroidsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const [locale, id] of identityByLocale) {
		const pols = (id as Record<string, unknown>).polaroids;
		if (Array.isArray(pols)) {
			polaroidsByLocale.set(locale, pols as Array<Record<string, unknown>>);
		}
	}
	const polaroids = rawPolaroids.map((enPol, idx) => {
		const altLS: LocalizedString = { en: typeof enPol.alt === 'string' ? enPol.alt : '' };
		const captionLS: LocalizedString = {
			en: typeof enPol.caption === 'string' ? enPol.caption : '',
		};
		for (const [locale, polList] of polaroidsByLocale) {
			if (locale === 'en') continue;
			const pol = polList[idx];
			if (!pol) continue;
			if (typeof pol.alt === 'string' && pol.alt.length > 0) {
				if (locale === 'fr') altLS.fr = pol.alt;
				else if (locale === 'es') altLS.es = pol.alt;
			}
			if (typeof pol.caption === 'string' && pol.caption.length > 0) {
				if (locale === 'fr') captionLS.fr = pol.caption;
				else if (locale === 'es') captionLS.es = pol.caption;
			}
		}
		return {
			src: typeof enPol.src === 'string' ? enPol.src : '',
			alt: altLS,
			caption: captionLS,
			rotate: typeof enPol.rotate === 'number' ? enPol.rotate : 0,
		};
	});

	const identity: AboutContent['identity'] = {
		name: identityLS('name'),
		title: identityLS('title'),
		valueProp: identityLS('valueProp'),
		headshot: typeof rawIdentity.headshot === 'string' ? rawIdentity.headshot : '',
		polaroids,
	};

	// --- metrics: value (plain), label (LS), icon? (plain) ---
	const metricsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.metrics)) {
			metricsByLocale.set(code, row.metrics as Array<Record<string, unknown>>);
		}
	}
	const enMetrics = metricsByLocale.get('en') ?? [];
	const metrics: AboutContent['metrics'] = enMetrics.map((enM, idx) => {
		const labelLS: LocalizedString = { en: typeof enM.label === 'string' ? enM.label : '' };
		for (const [locale, mList] of metricsByLocale) {
			if (locale === 'en') continue;
			const m = mList[idx];
			if (!m) continue;
			if (typeof m.label === 'string' && m.label.length > 0) {
				if (locale === 'fr') labelLS.fr = m.label;
				else if (locale === 'es') labelLS.es = m.label;
			}
		}
		const metric: AboutContent['metrics'][number] = {
			value: typeof enM.value === 'string' ? enM.value : '',
			label: labelLS,
		};
		if (typeof enM.icon === 'string' && enM.icon.length > 0) metric.icon = enM.icon;
		return metric;
	});

	// --- methodology: id (plain), station (number plain), label (LS), description (LS) ---
	const methodByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.methodology)) {
			methodByLocale.set(code, row.methodology as Array<Record<string, unknown>>);
		}
	}
	const enMethod = methodByLocale.get('en') ?? [];
	const methodology: AboutContent['methodology'] = enMethod.map((enS, idx) => {
		const labelLS: LocalizedString = { en: typeof enS.label === 'string' ? enS.label : '' };
		const descLS: LocalizedString = {
			en: typeof enS.description === 'string' ? enS.description : '',
		};
		for (const [locale, sList] of methodByLocale) {
			if (locale === 'en') continue;
			const s = sList[idx];
			if (!s) continue;
			if (typeof s.label === 'string' && s.label.length > 0) {
				if (locale === 'fr') labelLS.fr = s.label;
				else if (locale === 'es') labelLS.es = s.label;
			}
			if (typeof s.description === 'string' && s.description.length > 0) {
				if (locale === 'fr') descLS.fr = s.description;
				else if (locale === 'es') descLS.es = s.description;
			}
		}
		return {
			id: typeof enS.id === 'string' ? enS.id : '',
			label: labelLS,
			description: descLS,
			station: typeof enS.station === 'number' ? enS.station : 0,
		};
	});

	// --- testimonials ---
	const testimonialsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.testimonials)) {
			testimonialsByLocale.set(code, row.testimonials as Array<Record<string, unknown>>);
		}
	}
	const enTestimonials = testimonialsByLocale.get('en') ?? [];
	const testimonials: AboutContent['testimonials'] = enTestimonials.map((enT, idx) => {
		const quoteLS: LocalizedString = { en: typeof enT.quote === 'string' ? enT.quote : '' };
		const roleLS: LocalizedString = { en: typeof enT.role === 'string' ? enT.role : '' };
		for (const [locale, tList] of testimonialsByLocale) {
			if (locale === 'en') continue;
			const t = tList[idx];
			if (!t) continue;
			if (typeof t.quote === 'string' && t.quote.length > 0) {
				if (locale === 'fr') quoteLS.fr = t.quote;
				else if (locale === 'es') quoteLS.es = t.quote;
			}
			if (typeof t.role === 'string' && t.role.length > 0) {
				if (locale === 'fr') roleLS.fr = t.role;
				else if (locale === 'es') roleLS.es = t.role;
			}
		}
		const testimonial: AboutContent['testimonials'][number] = {
			quote: quoteLS,
			author: typeof enT.author === 'string' ? enT.author : '',
			role: roleLS,
			company: typeof enT.company === 'string' ? enT.company : '',
		};
		if (typeof enT.logo === 'string' && enT.logo.length > 0) testimonial.logo = enT.logo;
		return testimonial;
	});

	// --- techStack: read from parent row ---
	const rawTechStack = Array.isArray(raw.tech_stack)
		? (raw.tech_stack as Array<Record<string, unknown>>)
		: [];
	const techStack: AboutContent['techStack'] = rawTechStack.map((item) => ({
		name: typeof item.name === 'string' ? item.name : '',
		category: (item.category as AboutContent['techStack'][number]['category']) ?? 'tools',
		relatedServices: Array.isArray(item.relatedServices)
			? (item.relatedServices as string[])
			: [],
	}));

	// --- interests: id (plain), image (plain), label (LS) ---
	const interestsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.interests)) {
			interestsByLocale.set(code, row.interests as Array<Record<string, unknown>>);
		}
	}
	const enInterests = interestsByLocale.get('en') ?? [];
	const interests: AboutContent['interests'] = enInterests.map((enI, idx) => {
		const labelLS: LocalizedString = { en: typeof enI.label === 'string' ? enI.label : '' };
		for (const [locale, iList] of interestsByLocale) {
			if (locale === 'en') continue;
			const i = iList[idx];
			if (!i) continue;
			if (typeof i.label === 'string' && i.label.length > 0) {
				if (locale === 'fr') labelLS.fr = i.label;
				else if (locale === 'es') labelLS.es = i.label;
			}
		}
		return {
			id: typeof enI.id === 'string' ? enI.id : '',
			label: labelLS,
			image: typeof enI.image === 'string' ? enI.image : '',
		};
	});

	// --- weather ---
	const weatherByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const w = row.weather;
		if (w && typeof w === 'object' && !Array.isArray(w)) {
			weatherByLocale.set(code, w as Record<string, unknown>);
		}
	}
	const enWeather = weatherByLocale.get('en') ?? {};
	const cityLS: LocalizedString = { en: typeof enWeather.city === 'string' ? enWeather.city : '' };
	const hookLS: LocalizedString = { en: typeof enWeather.hook === 'string' ? enWeather.hook : '' };
	for (const [locale, w] of weatherByLocale) {
		if (locale === 'en') continue;
		if (typeof w.city === 'string' && w.city.length > 0) {
			if (locale === 'fr') cityLS.fr = w.city;
			else if (locale === 'es') cityLS.es = w.city;
		}
		if (typeof w.hook === 'string' && w.hook.length > 0) {
			if (locale === 'fr') hookLS.fr = w.hook;
			else if (locale === 'es') hookLS.es = w.hook;
		}
	}
	const weather: AboutContent['weather'] = {
		city: cityLS,
		hook: hookLS,
		enabled: typeof enWeather.enabled === 'boolean' ? enWeather.enabled : false,
	};

	// --- clientLogos: read from parent row ---
	const rawClientLogos = Array.isArray(raw.client_logos)
		? (raw.client_logos as Array<Record<string, unknown>>)
		: [];
	const clientLogos: AboutContent['clientLogos'] = rawClientLogos.map((logo) => {
		const cl: AboutContent['clientLogos'][number] = {
			name: typeof logo.name === 'string' ? logo.name : '',
			src: typeof logo.src === 'string' ? logo.src : '',
		};
		if (typeof logo.url === 'string' && logo.url.length > 0) cl.url = logo.url;
		return cl;
	});

	// --- cta ---
	const ctaByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const c = row.cta;
		if (c && typeof c === 'object' && !Array.isArray(c)) {
			ctaByLocale.set(code, c as Record<string, unknown>);
		}
	}
	const enCta = ctaByLocale.get('en') ?? {};
	const buttonLabelLS: LocalizedString = {
		en: typeof enCta.buttonLabel === 'string' ? enCta.buttonLabel : '',
	};
	const availabilityLS: LocalizedString = {
		en: typeof enCta.availability === 'string' ? enCta.availability : '',
	};
	for (const [locale, c] of ctaByLocale) {
		if (locale === 'en') continue;
		if (typeof c.buttonLabel === 'string' && c.buttonLabel.length > 0) {
			if (locale === 'fr') buttonLabelLS.fr = c.buttonLabel;
			else if (locale === 'es') buttonLabelLS.es = c.buttonLabel;
		}
		if (typeof c.availability === 'string' && c.availability.length > 0) {
			if (locale === 'fr') availabilityLS.fr = c.availability;
			else if (locale === 'es') availabilityLS.es = c.availability;
		}
	}
	const rawCtaLines = Array.isArray(enCta.lines)
		? (enCta.lines as Array<Record<string, unknown>>)
		: [];
	const ctaLines = rawCtaLines.map((l) => ({
		text: typeof l.text === 'string' ? l.text : '',
		color: (l.color as 'orange' | 'muted' | 'accent') ?? 'muted',
	}));
	const rawCtaSocials = Array.isArray(enCta.socials)
		? (enCta.socials as Array<Record<string, unknown>>)
		: [];
	const ctaSocials = rawCtaSocials.map((s) => ({
		label: typeof s.label === 'string' ? s.label : '',
		href: typeof s.href === 'string' ? s.href : '',
		icon: typeof s.icon === 'string' ? s.icon : '',
	}));
	const cta: AboutContent['cta'] = {
		command: typeof enCta.command === 'string' ? enCta.command : '',
		lines: ctaLines,
		buttonLabel: buttonLabelLS,
		buttonHref: typeof enCta.buttonHref === 'string' ? enCta.buttonHref : '',
		availability: availabilityLS,
		socials: ctaSocials,
	};

	const stopLabels = toLocalizedJSON(tr, 'stop_labels') as AboutContent['stopLabels'];
	const labels = toLocalizedJSON(tr, 'labels') as AboutContent['labels'];
	const meta = toLocalizedJSON(tr, 'meta') as AboutContent['meta'];

	return {
		identity,
		metrics,
		methodology,
		testimonials,
		techStack,
		interests,
		weather,
		clientLogos,
		clientCount,
		cta,
		stopLabels,
		labels,
		meta,
	};
}

export async function fetchAboutContent({ client }: FetcherContext): Promise<AboutContent> {
	const result = await client.request(
		readSingleton('block_about_content', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(result, 'fetchAboutContent/block_about_content');
	return AboutContentSchema.parse(toAboutContent(row));
}
