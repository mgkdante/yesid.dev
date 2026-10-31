import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';

const analyticsMocks = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock('#lib/analytics/client.ts', () => analyticsMocks);

import ContactPage from './ContactPage.svelte';
import type { ContactContent } from '#lib/types.ts';
import { persisted } from '@yesid/ui/state';

const contactContent: ContactContent = {
	pageTitle: { en: 'Contact fixture' },
	stationLabel: { en: 'Fixture station' },
	sendErrorMessage: { en: 'Fixture delivery failed' },
	web3formsKey: 'fixture-key',
	infoTerminal: {
		title: 'Fixture info', command: '$ info',
		location: { en: 'A city' }, responseTime: { en: 'Soon' }, languages: { en: 'EN FR ES' },
		bestFit: [{ en: 'A supplied need' }],
		sectionLabels: {
			location: { en: 'Place' }, connect: { en: 'Channels' },
			languages: { en: 'Languages' }, bestFit: { en: 'Needs' },
		},
	},
	formTerminal: {
		title: 'Fixture form', command: '$ contact', commandOutput: { en: 'Ready' },
		fields: {
			name: { label: { en: 'name' }, placeholder: { en: 'Your name' } },
			email: { label: { en: 'email' }, placeholder: { en: 'Your email' } },
			message: { label: { en: 'message' }, placeholder: { en: 'Your note' } },
		},
		submitLabel: { en: 'Send' }, bookingPrompt: { en: 'Talk instead?' }, bookingButtonLabel: { en: 'Book' },
	},
	validation: {
		required: { en: '{field} is required' }, invalidEmail: { en: 'Invalid email format' }, errorSummary: { en: '{count} errors' },
	},
	success: {
		command: { en: '~ $ send' }, validating: { en: 'Checking' }, sending: { en: 'Sending' }, sent: { en: 'Delivered' },
		responseTime: { en: 'Soon' }, meanwhile: { en: 'Visit {work} and {blog}.' },
		resetLabel: { en: 'Send another' }, fieldOk: { en: 'OK' }, workLinkLabel: { en: 'work' }, blogLinkLabel: { en: 'blog' },
	},
	socials: [
		{ label: { en: 'Calendar' }, href: 'https://cal.com/fixture', icon: 'calendar' },
		{ label: { en: 'Email' }, href: 'mailto:fixture@example.com', icon: 'email' },
		{ label: { en: 'GitHub' }, href: 'https://github.com/fixture', icon: 'github' },
		{ label: { en: 'LinkedIn' }, href: 'https://linkedin.com/in/fixture', icon: 'linkedin' },
	],
};

let originalFetch: typeof fetch;
beforeEach(() => {
	originalFetch = globalThis.fetch;
	analyticsMocks.trackAnalyticsEvent.mockClear();
});
afterEach(() => { globalThis.fetch = originalFetch; vi.useRealTimers(); });

async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
	el.value = value;
	await fireEvent.input(el);
	await tick();
	await tick();
}

async function fillForm(name = 'Test User', email = 'test@example.com', message = 'Hello there') {
	for (const [label, value] of [[/^name/i, name], [/^email/i, email], [/^message/i, message]] as const) {
		await typeInto(screen.getAllByLabelText(label)[0] as HTMLInputElement | HTMLTextAreaElement, value);
	}
}

async function submitForm(submitBtn: HTMLElement) {
	const form = submitBtn.closest('form') as HTMLFormElement;
	await fireEvent.submit(form);
	await tick();
}

async function clickWithoutNavigating(link: HTMLElement) {
	const preventNavigation = (event: Event) => event.preventDefault();
	link.addEventListener('click', preventNavigation);
	try {
		await fireEvent.click(link);
	} finally {
		link.removeEventListener('click', preventNavigation);
	}
}

describe('ContactPage', () => {
	it('renders with data-testid page-contact', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getByText('Fixture station')).toBeTruthy();
	});

	it('renders info terminal', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		// Both desktop and mobile render the snippet, so 2 instances
		const terminals = screen.getAllByTestId('contact-info-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('renders form terminal', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const terminals = screen.getAllByTestId('contact-form-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('associates both layouts with their own labeled fields and validation errors', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const fields = screen.getAllByRole('textbox') as (HTMLInputElement | HTMLTextAreaElement)[];
		for (const form of screen.getAllByTestId('contact-form-terminal')) {
			expect(within(form).getAllByRole('textbox')).toHaveLength(Object.keys(contactContent.formTerminal.fields).length);
			for (const { label } of Object.values(contactContent.formTerminal.fields))
				expect(within(form).getByLabelText(`${label.en}:`)).toBeInTheDocument();
		}
		expect(new Set(fields.map((field) => field.id)).size).toBe(fields.length);
		for (const field of fields) {
			expect(field).toHaveAccessibleName(`${contactContent.formTerminal.fields[field.name as keyof typeof contactContent.formTerminal.fields].label.en}:`);
			expect(field.tagName).toBe(field.name === 'message' ? 'TEXTAREA' : 'INPUT');
			expect(field).toHaveAttribute('data-handoff-focus', `contact-${field.name}`);
		}
		await submitForm(screen.getAllByTestId('contact-submit')[0]);
		for (const field of fields) {
			expect(field).toHaveAttribute('aria-invalid', 'true');
			expect(field).toHaveAccessibleDescription(`✗ ${contactContent.validation.required.en.replace('{field}', contactContent.formTerminal.fields[field.name as keyof typeof contactContent.formTerminal.fields].label.en)}`);
		}
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it('uses CMS-localized form field labels in labels and validation errors', async () => {
		const labeledContact = {
			...contactContent,
			formTerminal: {
				...contactContent.formTerminal,
				fields: {
					name: { ...contactContent.formTerminal.fields.name, label: { en: 'full name' } },
					email: { ...contactContent.formTerminal.fields.email, label: { en: 'email address' } },
					message: { ...contactContent.formTerminal.fields.message, label: { en: 'project note' } },
				},
			},
			validation: {
				...contactContent.validation,
				required: { en: 'Missing {field}' },
			},
		} satisfies ContactContent;

		render(ContactPage, { props: { contactPage: labeledContact } });
		expect(screen.getAllByLabelText(/^full name/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^email address/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^project note/i).length).toBeGreaterThanOrEqual(1);

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		expect(screen.getAllByText(/Missing full name/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Missing email address/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Missing project note/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders submit button', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const buttons = screen.getAllByRole('button', { name: /send/i });
		expect(buttons.length).toBeGreaterThanOrEqual(1);
	});

	it('renders social links', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getAllByTestId('contact-social-email').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-github').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-linkedin').length).toBeGreaterThanOrEqual(1);
	});

	for (const [locale, label, item] of [
		['en', 'Fixture needs', 'A changed brief'],
		['fr', 'Besoins témoins', 'Un autre mandat'],
		['es', 'Necesidades', 'Un encargo distinto'],
	])
		it(`renders supplied best-fit labels and items in ${locale}`, () => {
			const supplied = {
				...contactContent,
				infoTerminal: {
					...contactContent.infoTerminal,
					sectionLabels: {
						...contactContent.infoTerminal.sectionLabels,
						bestFit: {
							en: 'Fixture needs',
							fr: 'Besoins témoins',
							es: 'Necesidades',
						},
					},
					bestFit: [
						{
							en: 'A changed brief',
							fr: 'Un autre mandat',
							es: 'Un encargo distinto',
						},
					],
				},
			};
			render(ContactPage, {
				props: { contactPage: supplied },
				context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]),
			});
			for (const section of screen.getAllByTestId('contact-best-fit')) {
				expect(section).toHaveTextContent(label);
				expect(section).toHaveTextContent(item);
			}
		});
	it('hides the BEST FIT section when the CMS carries no lines', () => {
		const { bestFit: _bestFit, ...restInfo } = contactContent.infoTerminal;
		const stripped = {
			...contactContent,
			infoTerminal: restInfo,
		} satisfies ContactContent;
		render(ContactPage, { props: { contactPage: stripped } });
		expect(screen.queryByTestId('contact-best-fit')).toBeNull();
	});

	it('renders an extra CMS channel as another terminal line', () => {
		render(ContactPage, {
			props: {
				contactPage: {
					...contactContent,
					socials: [
						...contactContent.socials,
						{
							label: { en: 'Mastodon' },
							href: 'https://mastodon.social/@mgkdante',
							icon: 'mastodon',
						},
					],
				},
			},
		});
		const mastodonLinks = screen.getAllByRole('link', { name: 'Mastodon' });
		expect(mastodonLinks.length).toBeGreaterThanOrEqual(1);
		expect(mastodonLinks[0]).toHaveAttribute('href', 'https://mastodon.social/@mgkdante');
	});

	it('email social uses mailto link', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const emailLinks = screen.getAllByTestId('contact-social-email');
		expect(emailLinks[0].getAttribute('href')).toMatch(/^mailto:/);
	});

	it('shows the channel name in Connect and keeps the address as the link', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const github = screen.getAllByTestId('contact-social-github')[0];
		expect(github).toHaveTextContent('GitHub');
		expect(github).not.toHaveTextContent('github.com/fixture');
		expect(github).toHaveAttribute('href', 'https://github.com/fixture');
	});

	it('github social opens in new tab', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const ghLinks = screen.getAllByTestId('contact-social-github');
		expect(ghLinks[0].getAttribute('target')).toBe('_blank');
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		await fillForm('Test', 'not-an-email', 'Hello');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		expect(screen.getAllByText(/invalid.*email/i).length).toBeGreaterThanOrEqual(1);
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it.each(['response failure', 'request rejection'])('does not track conversion after %s', async (failure) => {
		const prevFetch = globalThis.fetch;
		globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			if (String(input).includes('web3forms')) {
				if (failure === 'request rejection') throw new Error('offline');
				return Response.json({ success: false });
			}
			return prevFetch(input, init);
		}) as typeof globalThis.fetch;
		render(ContactPage, { props: { contactPage: contactContent } });
		await fillForm();
		await submitForm(screen.getAllByRole('button', { name: /send/i })[0]);
		await waitFor(() => expect(screen.getAllByText(/Fixture delivery failed/).length).toBeGreaterThanOrEqual(1));
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	// Launch-edge batch: the Web3Forms round trip is 1-3s of network time — the
	// button must disable (no double submits) and the terminal must show the
	// in-flight line instead of dead air.
	it('disables submit + shows the transmission line while the send is in flight', async () => {
		let resolveFetch!: (v: unknown) => void;
		globalThis.fetch = vi.fn().mockReturnValue(
			new Promise((resolve) => {
				resolveFetch = resolve;
			}),
		) as typeof globalThis.fetch;

		render(ContactPage, { props: { contactPage: contactContent } });
		await fillForm();

		const submitBtns = screen.getAllByTestId('contact-submit') as HTMLButtonElement[];
		await submitForm(submitBtns[0]);

		// In flight: disabled button, visible transmission line.
		expect(submitBtns[0].disabled).toBe(true);
		expect(screen.getAllByTestId('contact-sending-line').length).toBeGreaterThanOrEqual(1);

		// A second submit while in flight must not re-fire the request.
		// (The mount-time weather fetch shares the same stub — count only
		// the Web3Forms calls.)
		const web3formsCalls = () =>
			(globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.filter((call) =>
				String(call[0]).includes('web3forms'),
			).length;
		expect(web3formsCalls()).toBe(1);
		await submitForm(submitBtns[0]);
		expect(web3formsCalls()).toBe(1);
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();

		// Resolve → the success sequence takes over.
		resolveFetch({ json: async () => ({ success: true }) });
		await waitFor(
			() => expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1),
			{ timeout: 4000 },
		);
		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledTimes(1);
		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledWith('contact_form_success');
	});

	it('recovers a stalled send, preserves the draft, and lets the visitor retry', async () => {
		let attempts = 0;
		globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			if (!String(input).includes('web3forms')) return Response.json(null);
			attempts++;
			if (attempts > 1) return Response.json({ success: true });
			return new Promise<Response>((_, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true });
			});
		}) as typeof globalThis.fetch;

		render(ContactPage, { props: { contactPage: contactContent } });
		await fillForm('Visitor', 'visitor@example.com', 'Please keep this draft.');
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		const submit = screen.getAllByTestId('contact-submit')[0] as HTMLButtonElement;
		await submitForm(submit);
		expect(submit).toBeDisabled();
		await vi.advanceTimersByTimeAsync(15_000);
		await tick();

		expect(submit).not.toBeDisabled();
		expect(screen.getAllByText('✗ Fixture delivery failed').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^name/i)[0]).toHaveValue('Visitor');
		expect(screen.getAllByLabelText(/^email/i)[0]).toHaveValue('visitor@example.com');
		expect(screen.getAllByLabelText(/^message/i)[0]).toHaveValue('Please keep this draft.');
		expect(screen.queryAllByTestId('contact-success')).toHaveLength(0);
		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();

		await submitForm(submit);
		await vi.advanceTimersByTimeAsync(1500);
		await tick();
		expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1);
		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([['contact_form_success']]);
	});

	it.each(['contact-social-calendar', 'contact-booking-link'])('tracks only booking_click for %s', async (testId) => {
		render(ContactPage, { props: { contactPage: contactContent } });
		await clickWithoutNavigating(screen.getAllByTestId(testId)[0]);
		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([['booking_click']]);
	});

	it.each([
		['email', 'mailto:contact@yesid.dev'],
		['phone', 'tel:+12025550100'],
		['whatsapp', 'https://wa.me/12025550100'],
	])('tracks one direct contact event for %s', async (icon, href) => {
		const content = {
			...contactContent,
			socials: [{ label: { en: icon }, href, icon }],
		} satisfies ContactContent;

		render(ContactPage, { props: { contactPage: content } });
		await clickWithoutNavigating(
			screen.getAllByTestId(`contact-social-${icon}`)[0],
		);

		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledTimes(1);
		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledWith(
			'direct_contact_click',
		);
	});

	it.each([
		['github', 'https://github.com/mgkdante'],
		['linkedin', 'https://www.linkedin.com/in/otaloray/'],
		['cal-link-without-calendar-icon', 'https://cal.com/yesid-dev'],
		['ordinary-https', 'https://example.com/contact'],
		['insecure-whatsapp', 'http://wa.me/12025550100'],
		['spoofed-whatsapp', 'https://wa.me.evil.example/12025550100'],
		['malformed', 'not a url'],
	])('does not track the ineligible channel %s', async (icon, href) => {
		const content = {
			...contactContent,
			socials: [{ label: { en: icon }, href, icon }],
		} satisfies ContactContent;

		render(ContactPage, { props: { contactPage: content } });
		await clickWithoutNavigating(
			screen.getAllByTestId(`contact-social-${icon}`)[0],
		);

		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it('renders supplied success links, tracks once, and clears then resets the captured draft', async () => {
		const linkedContact = {
			...contactContent,
			success: {
				...contactContent.success,
				meanwhile: { en: 'Meanwhile, check {work} and {blog}.' },
				workLinkLabel: { en: 'services' },
				blogLinkLabel: { en: 'journal' },
			},
		} satisfies ContactContent;

		render(ContactPage, { props: { contactPage: linkedContact } });
		await fillForm();

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);
		await waitFor(() => expect(screen.getAllByTestId('contact-success')[0]).toHaveTextContent('journal'), { timeout: 4000 });

		const success = screen.getAllByTestId('contact-success')[0];
		expect(success.textContent).toContain('services');
		expect(success.textContent).toContain('journal');
		expect(success.textContent).not.toContain('work');
		expect(success.textContent).not.toContain('blog.');
		const links = Array.from(success.querySelectorAll('a'));
		expect(links.map((link) => link.textContent)).toEqual(['services', 'journal']);
		expect(links.map((link) => link.getAttribute('href'))).toEqual(['/services', '/blog']);
		expect(analyticsMocks.trackAnalyticsEvent.mock.calls).toEqual([['contact_form_success']]);
		for (const key of ['contact-name', 'contact-email', 'contact-message']) expect(persisted(key, 'x').value).toBe('');
		expect(persisted('contact-success', false).value).toBe(true);
		await fireEvent.click(screen.getAllByRole('button', { name: 'Send another' })[0]);
		await tick();
		expect(persisted('contact-success', true).value).toBe(false);
		for (const key of ['contact-name', 'contact-email', 'contact-message']) expect(persisted(key, 'x').value).toBe('');
		for (const field of screen.getAllByRole('textbox')) expect(field).toHaveValue('');
	});

	it('displays weather when provided', () => {
		render(ContactPage, {
			props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		expect(screen.getAllByText(/12°C/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/partly cloudy/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders without weather gracefully', () => {
		render(ContactPage, { props: { contactPage: contactContent, weather: null } });
		expect(screen.queryAllByText(/°C/).length).toBe(0);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	// Override the null weather stub to exercise both hydration-refresh outcomes.
	it('refreshes weather from /api/weather on mount', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ temp: 99, condition: 'fresh breeze', icon: '01d' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		) as typeof globalThis.fetch;
		render(ContactPage, {
			props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		await waitFor(() => {
			expect(screen.getAllByText(/99°C/).length).toBeGreaterThanOrEqual(1);
		});
		expect(screen.getAllByText(/fresh breeze/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.queryAllByText(/12°C/).length).toBe(0);
		// EN omits the ?lang= param so the CDN cache key stays byte-identical.
		expect(globalThis.fetch).toHaveBeenCalledWith('/api/weather');
	});

	// The client refresh must carry the active locale so OpenWeather localizes
	// `condition` (fr/es). Regression guard for the bug where /fr re-fetched
	// English weather after hydration, overwriting the correct SSR-baked value.
	it('refreshes weather with the ?lang= param inside a fr locale provider', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ temp: 99, condition: 'brise fraîche', icon: '01d' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		) as typeof globalThis.fetch;
		render(ContactPage, {
			props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } },
			context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]),
		});
		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledWith('/api/weather?lang=fr');
		});
	});

	it('keeps the SSR-baked weather when /api/weather fails', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as typeof globalThis.fetch;
		render(ContactPage, {
			props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		// Give the rejected refresh a microtask turn to (not) apply.
		await new Promise((r) => setTimeout(r, 20));
		expect(screen.getAllByText(/12°C/).length).toBeGreaterThanOrEqual(1);
	});
});

// A language switch remounts the page, so the draft and the sent state must come back.
describe('ContactPage state across remounts', () => {
	it('restores a half-typed draft into a freshly mounted form', async () => {
		const first = render(ContactPage, { props: { contactPage: contactContent } });
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		await typeInto(messageInputs[0], 'carry me across the switch');
		first.unmount();

		render(ContactPage, { props: { contactPage: contactContent } });
		await tick();

		const restored = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(restored[0].value).toBe('carry me across the switch');
	});

	it('re-shows the success screen on a later mount until "send another"', async () => {
		persisted('contact-success', false).value = true;
		render(ContactPage, { props: { contactPage: contactContent } });
		await tick();

		expect(screen.getAllByTestId('contact-success')[0]).toHaveTextContent('Delivered');

		await fireEvent.click(screen.getAllByRole('button', { name: 'Send another' })[0]);
		await tick();
		expect(screen.queryAllByTestId('contact-success')).toHaveLength(0);
		expect(persisted('contact-success', true).value).toBe(false);
	});
});
