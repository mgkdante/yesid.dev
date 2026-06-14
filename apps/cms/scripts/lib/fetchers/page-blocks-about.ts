/**
 * about-page block fetcher — block_about_content.
 *
 * The most complex block: 13 nested types. go2-t1b2: identity/weather/cta/
 * stop_labels/labels/meta now read FLAT columns (locale-invariant leaves on
 * the parent row, per-locale strings + the polaroids repeater on
 * translations); the list repeaters (metrics/methodology/testimonials/
 * interests) are unchanged. Parent-row arrays now carry languages + education.
 */

import { readSingleton } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import { AboutContentSchema, type LocalizedString, type AboutContent } from '@repo/shared';
import { asSingletonRow } from './singleton';
import type { FetcherContext } from './types';

interface BlockRow {
	id: number;
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

export function toAboutContent(raw: BlockRow): AboutContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;

	// --- identity: flat columns + per-locale polaroids repeater ---
	const polaroidsByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		if (Array.isArray(row.polaroids)) {
			polaroidsByLocale.set(row.languages_code, row.polaroids as Array<Record<string, unknown>>);
		}
	}
	const enPolaroids = polaroidsByLocale.get('en') ?? [];
	const polaroids = enPolaroids.map((enPol, idx) => {
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
		name: toLocalizedString(tr, 'identity_name'),
		title: toLocalizedString(tr, 'identity_title'),
		valueProp: toLocalizedString(tr, 'identity_value_prop'),
		headshot: typeof raw.headshot === 'string' ? raw.headshot : '',
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

	// --- languages: read from parent row ---
	const languages = Array.isArray(raw.languages)
		? (raw.languages as unknown[]).filter((item): item is string => typeof item === 'string')
		: [];

	// --- education: per-locale repeater on the translation rows (school/program
	// are localized strings, icon is locale-invariant). Same shape as the
	// metrics/methodology/interests repeaters above; the en row is the base and
	// fr/es are zipped by index. (Earlier this read bilingual school_en/_fr
	// columns from the parent row, but that field was never created — the data
	// lives on the translation rows, so the parent read always yielded [].) ---
	const educationByLocale = new Map<string, Array<Record<string, unknown>>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		if (Array.isArray(row.education)) {
			educationByLocale.set(code, row.education as Array<Record<string, unknown>>);
		}
	}
	const enEducation = educationByLocale.get('en') ?? [];
	const education: AboutContent['education'] = enEducation.map((enE, idx) => {
		const school: LocalizedString = { en: typeof enE.school === 'string' ? enE.school : '' };
		const program: LocalizedString = { en: typeof enE.program === 'string' ? enE.program : '' };
		for (const [locale, eList] of educationByLocale) {
			if (locale === 'en') continue;
			const e = eList[idx];
			if (!e) continue;
			if (typeof e.school === 'string' && e.school.length > 0) {
				if (locale === 'fr') school.fr = e.school;
				else if (locale === 'es') school.es = e.school;
			}
			if (typeof e.program === 'string' && e.program.length > 0) {
				if (locale === 'fr') program.fr = e.program;
				else if (locale === 'es') program.es = e.program;
			}
		}
		return {
			school,
			program,
			icon: enE.icon === 'bishops' ? 'bishops' : 'champlain',
		};
	});

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

	// --- weather: flat LS + parent boolean ---
	const weather: AboutContent['weather'] = {
		city: toLocalizedString(tr, 'weather_city'),
		hook: toLocalizedString(tr, 'weather_hook'),
		enabled: raw.weather_enabled === true,
	};

	// --- cta: parent scalars/arrays + flat LS ---
	const rawCtaLines = Array.isArray(raw.cta_lines)
		? (raw.cta_lines as Array<Record<string, unknown>>)
		: [];
	const rawCtaSocials = Array.isArray(raw.cta_socials)
		? (raw.cta_socials as Array<Record<string, unknown>>)
		: [];
	const cta: AboutContent['cta'] = {
		command: typeof raw.cta_command === 'string' ? raw.cta_command : '',
		lines: rawCtaLines.map((l) => ({
			text: typeof l.text === 'string' ? l.text : '',
			color: (l.color as 'orange' | 'muted' | 'accent') ?? 'muted',
		})),
		buttonLabel: toLocalizedString(tr, 'cta_button_label'),
		buttonHref: typeof raw.cta_button_href === 'string' ? raw.cta_button_href : '',
		availability: toLocalizedString(tr, 'cta_availability'),
		socials: rawCtaSocials.map((s) => ({
			label: typeof s.label === 'string' ? s.label : '',
			href: typeof s.href === 'string' ? s.href : '',
			icon: typeof s.icon === 'string' ? s.icon : '',
		})),
	};

	const stopLabels: AboutContent['stopLabels'] = {
		identity: toLocalizedString(tr, 'stop_identity'),
		metrics: toLocalizedString(tr, 'stop_metrics'),
		testimonials: toLocalizedString(tr, 'stop_testimonials'),
		process: toLocalizedString(tr, 'stop_process'),
		stack: toLocalizedString(tr, 'stop_stack'),
		clients: toLocalizedString(tr, 'stop_clients'),
		interests: toLocalizedString(tr, 'stop_interests'),
		snapshots: toLocalizedString(tr, 'stop_snapshots'),
		location: toLocalizedString(tr, 'stop_location'),
		next: toLocalizedString(tr, 'stop_next'),
	};
	const labels: AboutContent['labels'] = {
		polaroidPrevAria: toLocalizedString(tr, 'label_polaroid_prev_aria'),
		polaroidNextAria: toLocalizedString(tr, 'label_polaroid_next_aria'),
		testimonialsCarouselAria: toLocalizedString(tr, 'label_testimonials_carousel_aria'),
		testimonialsTabNavAria: toLocalizedString(tr, 'label_testimonials_tab_nav_aria'),
		testimonialSlideAria: toLocalizedString(tr, 'label_testimonial_slide_aria'),
		showTestimonialAria: toLocalizedString(tr, 'label_show_testimonial_aria'),
	};
	const meta: AboutContent['meta'] = {
		title: toLocalizedString(tr, 'meta_title'),
		description: toLocalizedString(tr, 'meta_description'),
	};

	return {
		identity,
		metrics,
		methodology,
		testimonials,
		languages,
		education,
		interests,
		weather,
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
