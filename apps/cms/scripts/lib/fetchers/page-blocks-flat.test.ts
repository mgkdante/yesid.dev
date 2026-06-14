import { describe, expect, it } from 'bun:test';
import { toHeroContent, toManifestoContent, toCloserContent, toAboutIntroContent } from './page-blocks-home';
import { toTechStackPageContent, toContactContent } from './page-blocks-medium';
import { toAboutContent } from './page-blocks-about';
import {
	HeroContentSchema, ManifestoContentSchema, CloserContentSchema,
	TechStackPageContentSchema, ContactContentSchema, AboutContentSchema,
} from '@repo/shared';

describe('flat-column recomposition (go2-t1b2)', () => {
	it('hero: flat columns recompose HeroContent', () => {
		const row = {
			id: 1,
			translations: [
				{
					languages_code: 'en',
					headline_line1: 'SHIP FAST', headline_line2: "DON'T BREAK", headline_aria_suffix: 'production',
					subheadline: 'sub', subtitle: 'tit', cta_work: 'See work', cta_contact: 'Contact',
					sql_prompt: 'select', sql_live_label: 'LIVE', sql_col_route: 'route',
					sql_col_avg_delay: 'avg_delay_s', sql_col_vehicles: 'vehicles', sql_meta_template: '{n} rows',
					refresh_label: 'refresh', refresh_helper: 'press', scroll_down: 'scroll',
				},
				{ languages_code: 'fr', headline_line1: 'LIVREZ VITE', scroll_down: 'défiler' },
			],
		};
		const out = toHeroContent(row);
		expect(out.headline.line1).toEqual({ en: 'SHIP FAST', fr: 'LIVREZ VITE' });
		expect(out.sqlPanel.columns.avgDelayS).toEqual({ en: 'avg_delay_s' });
		expect(out.heroAnim.scrollDown).toEqual({ en: 'scroll', fr: 'défiler' });
		expect(() => HeroContentSchema.parse(out)).not.toThrow();
	});

	it('closer: flat rows/terminal + parent href/url recompose CloserContent', () => {
		const row = {
			id: 1, cta_href: '/contact', attribution_url: 'https://x',
			translations: [{
				languages_code: 'en',
				heading: 'TERMINUS', heading_dot: '.', subheading: 'end of line',
				cta_label: 'Start a project', attribution_text: 'type by X',
				terminal_title: 't', terminal_city: 'MTL', terminal_encoding: 'utf8',
				terminal_destinations_label: 'dest', terminal_prompt: '>',
				rows_contact_label: 'contact', rows_contact_description: 'd', rows_contact_action: 'go',
				rows_connect_label: 'connect', rows_connect_description: 'd', rows_connect_action: 'go',
				rows_read_label: 'read', rows_read_action: 'go',
				rows_about_label: 'about', rows_about_description: 'd', rows_about_action: 'go',
			}],
		};
		const out = toCloserContent(row);
		expect(out.cta).toEqual({ label: { en: 'Start a project' }, href: '/contact' });
		expect(out.rows.read).toEqual({ label: { en: 'read' }, action: { en: 'go' } });
		expect(() => CloserContentSchema.parse(out)).not.toThrow();
	});

	it('contact: parent terminal chrome + flat LS columns recompose ContactContent', () => {
		const row = {
			id: 1, web3forms_key: 'k',
			info_terminal_title: 'info.sh', info_terminal_command: 'cat info',
			form_terminal_title: 'form.sh', form_terminal_command: 'send',
			form_field_name_label: 'name', form_field_email_label: 'email', form_field_message_label: 'message',
			translations: [{
				languages_code: 'en',
				page_title: 'Contact', station_label: '04', send_error_message: 'failed',
				meta_title: 'Contact | yesid.', meta_description: 'desc',
				info_location: 'MTL', info_response_time: '24h',
				info_section_label_location: 'LOCATION', info_section_label_connect: 'CONNECT',
				form_command_output: 'ready', form_submit_label: 'send',
				form_field_name_placeholder: 'Your name', form_field_email_placeholder: 'you@x.dev',
				form_field_message_placeholder: 'What breaks?',
				validation_required: 'required', validation_invalid_email: 'bad email', validation_error_summary: 'fix {n}',
				success_validating: 'validating', success_sending: 'sending', success_sent: 'sent',
				success_response_time: '24h', success_meanwhile: 'meanwhile', success_reset_label: 'reset', success_field_ok: 'ok',
				socials: [{ label: 'GitHub', href: 'https://g', icon: 'gh' }],
			}],
		};
		const out = toContactContent(row);
		expect(out.formTerminal.fields.name).toEqual({ label: 'name', placeholder: { en: 'Your name' } });
		expect(out.infoTerminal.title).toBe('info.sh');
		expect(out.success.fieldOk).toEqual({ en: 'ok' });
		expect(out.socials).toEqual([{ label: 'GitHub', href: 'https://g', icon: 'gh' }]);
		expect(() => ContactContentSchema.parse(out)).not.toThrow();
	});

	it('about: flat identity/weather/cta + parent scalars + per-locale polaroids', () => {
		const row = {
			id: 1,
			headshot: '/img/y.jpg', weather_enabled: true,
			cta_command: 'whoami', cta_button_href: '/contact',
			cta_lines: [{ text: 'hi', color: 'muted' }],
			cta_socials: [{ label: 'GH', href: 'https://g', icon: 'gh' }],
			languages: ['English'],
			translations: [
				{
					languages_code: 'en',
					identity_name: 'Yesid', identity_title: 'Engineer', identity_value_prop: 'ships',
					education: [{ school: 'School', program: 'Program', icon: 'champlain' }],
					polaroids: [{ src: '/p.jpg', alt: 'me', caption: 'hi', rotate: -2 }],
					weather_city: 'Montreal', weather_hook: 'rain',
					cta_button_label: 'Talk', cta_availability: 'open',
					stop_identity: 's1', stop_metrics: 's2', stop_testimonials: 's3', stop_process: 's4',
					stop_stack: 's5', stop_clients: 's6', stop_interests: 's7', stop_snapshots: 's8',
					stop_location: 's9', stop_next: 's10',
					label_polaroid_prev_aria: 'l2', label_polaroid_next_aria: 'l3',
					label_testimonials_carousel_aria: 'l4', label_testimonials_tab_nav_aria: 'l5',
					label_testimonial_slide_aria: 'l6', label_show_testimonial_aria: 'l7',
					meta_title: 'About', meta_description: 'd',
					metrics: [{ value: '10+', label: 'projects' }],
					methodology: [], testimonials: [], interests: [],
				},
				{
					languages_code: 'fr',
					identity_name: 'Yesid', polaroids: [{ alt: 'moi', caption: 'salut' }],
					education: [{ school: 'École', program: 'Programme', icon: 'champlain' }],
					weather_city: 'Montréal',
				},
			],
		};
		const out = toAboutContent(row);
		expect(out.identity.headshot).toBe('/img/y.jpg');
		expect(out.identity.polaroids[0].alt).toEqual({ en: 'me', fr: 'moi' });
		expect(out.weather).toEqual({ city: { en: 'Montreal', fr: 'Montréal' }, hook: { en: 'rain' }, enabled: true });
		expect(out.cta.command).toBe('whoami');
		expect(out.stopLabels.next).toEqual({ en: 's10' });
		expect(out.languages).toEqual(['English']);
		expect(out.education[0]?.school).toEqual({ en: 'School', fr: 'École' });
		expect(() => AboutContentSchema.parse(out)).not.toThrow();
	});

	it('manifesto + tech-stack-page + about-intro flat columns parse', () => {
		const m = toManifestoContent({
			id: 1, ticks: ['a'],
			translations: [{
				languages_code: 'en',
				statement_line1: 'I build', statement_line_huge: 'PIPELINES', statement_line3_part1: 'that',
				statement_line3_highlight: 'never', statement_line3_part2: 'sleep',
				terminal_user: 'yesid', terminal_command: 'make ship',
				edge_left_section_number: '002', edge_left_section_name: 'MANIFESTO', edge_left_location: 'MTL',
				edge_right_lat: '45.5', edge_right_lng: '-73.5', edge_right_src: 's', edge_right_via: 'v',
				edge_right_dst: 'd', edge_right_node: 'n', edge_right_status: 'ok',
				edge_bottom_connected: 'c', edge_bottom_line: 'l', edge_bottom_url: 'u',
				edge_bottom_version: 'v1', edge_bottom_scroll_hint: 'scroll',
				transit_arrival_label: 'arr', transit_platform_badge: 'p', transit_direction_badge: 'dir',
				pills: [{ label: 'SQL', serviceId: 'database-engineering' }],
				hidden_transit_lines: [{ name: 'x', color: '#fff' }],
			}],
		});
		expect(m.statement.lineHuge).toEqual({ en: 'PIPELINES' });
		expect(() => ManifestoContentSchema.parse(m)).not.toThrow();

		const ts = toTechStackPageContent({
			id: 1,
			translations: [{
				languages_code: 'en',
				meta_title: 'Tech | yesid.', meta_description: 'd',
				hero_overline: 'o', hero_title_line1: 'TECH', hero_title_line2: 'STACK',
				hero_terminal_aria: 'Hero terminal', hero_stat_technologies: '{n} technologies',
				terminal_cmd: '~ yesid --stack --verbose', terminal_loading: '→ loading {count} nodes...',
				terminal_success: '✓ successful', terminal_cataloged: '→ {count} technologies cataloged',
				terminal_status: 'interactive map online.',
				action_get_in_touch: 'Get in touch', action_view_services: 'View services',
				cta_heading_line1: 'h1', cta_heading_line2: 'h2', cta_sub: 's', cta_availability: 'a',
			}],
		});
		expect(ts.hero.stats.technologies).toEqual({ en: '{n} technologies' });
		// Operator addendum: hero terminal templates recompose under hero.terminal,
		// keeping the literal {count} token for component-side interpolation.
		expect(ts.hero.terminal).toEqual({
			cmd: { en: '~ yesid --stack --verbose' },
			loading: { en: '→ loading {count} nodes...' },
			success: { en: '✓ successful' },
			cataloged: { en: '→ {count} technologies cataloged' },
			status: { en: 'interactive map online.' },
		});
		// go2/w5: stack_explainer column absent → the optional key is OMITTED
		// (a bare { en: '' } would fail LocalizedStringSchema's non-blank en).
		expect(ts.hero.stackExplainer).toBeUndefined();
		expect(() => TechStackPageContentSchema.parse(ts)).not.toThrow();

		// go2/w5 present case: a populated stack_explainer column recomposes as
		// hero.stackExplainer (per-locale) and still parses.
		const tsWithExplainer = toTechStackPageContent({
			id: 1,
			translations: [
				{
					languages_code: 'en',
					meta_title: 'Tech | yesid.', meta_description: 'd',
					hero_overline: 'o', hero_title_line1: 'TECH', hero_title_line2: 'STACK',
					hero_terminal_aria: 'Hero terminal', hero_stat_technologies: '{n} technologies',
					terminal_cmd: '~ yesid --stack --verbose', terminal_loading: '→ loading {count} nodes...',
					terminal_success: '✓ successful', terminal_cataloged: '→ {count} technologies cataloged',
					terminal_status: 'interactive map online.',
					stack_explainer: 'A "stack" is just the parts list.',
					action_get_in_touch: 'Get in touch', action_view_services: 'View services',
					cta_heading_line1: 'h1', cta_heading_line2: 'h2', cta_sub: 's', cta_availability: 'a',
				},
				{ languages_code: 'fr', stack_explainer: 'Un « stack », c\'est la liste des pièces.' },
			],
		});
		expect(tsWithExplainer.hero.stackExplainer).toEqual({
			en: 'A "stack" is just the parts list.',
			fr: 'Un « stack », c\'est la liste des pièces.',
		});
		expect(() => TechStackPageContentSchema.parse(tsWithExplainer)).not.toThrow();

		const ai = toAboutIntroContent({
			id: 1, stack_items: ['Bun'],
			translations: [{
				languages_code: 'en', name: 'Yesid', title: 't', bio: 'b', more_link: 'm',
				stack_label: 's', location_label: 'l', interests_label: 'i', interests: 'x',
				location_city: 'Montreal', location_region: 'QC',
			}],
		});
		expect(ai.location).toEqual({ city: { en: 'Montreal' }, region: { en: 'QC' } });
	});
});
