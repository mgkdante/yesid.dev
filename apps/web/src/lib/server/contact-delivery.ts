import { z } from 'zod';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const CONTACT_FROM = 'yesid.dev Contact <form@forms.yesid.dev>';
const CONTACT_TO = 'contact@yesid.dev';
const CONTACT_SUBJECT = 'New contact via yesid.dev';
const CONTACT_USER_AGENT = 'yesid.dev-contact/1.0';

export const ContactSubmissionSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		email: z.string().trim().email().max(254),
		message: z.string().trim().min(1).max(10_000),
		website: z.string().max(200).default(''),
	})
	.strict();

export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>;

export interface ContactDeliveryDependencies {
	apiKey: string | undefined;
	fetch: typeof globalThis.fetch;
	timeoutMs: number;
}

function textBody(submission: Omit<ContactSubmission, 'website'>): string {
	return `Name: ${submission.name}\nEmail: ${submission.email}\n\nMessage:\n${submission.message}`;
}

export async function sendContactEmail(
	submission: Omit<ContactSubmission, 'website'>,
	dependencies: ContactDeliveryDependencies,
): Promise<boolean> {
	if (!dependencies.apiKey) return false;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), dependencies.timeoutMs);

	try {
		const response = await dependencies.fetch(RESEND_EMAILS_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${dependencies.apiKey}`,
				'Content-Type': 'application/json',
				'User-Agent': CONTACT_USER_AGENT,
			},
			body: JSON.stringify({
				from: CONTACT_FROM,
				to: [CONTACT_TO],
				reply_to: submission.email,
				subject: CONTACT_SUBJECT,
				text: textBody(submission),
			}),
			signal: controller.signal,
		});
		return response.ok;
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
}
