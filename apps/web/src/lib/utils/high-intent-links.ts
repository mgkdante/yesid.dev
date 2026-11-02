const APPROVED_WHATSAPP_HOSTS = new Set(['wa.me']);
const BOOKING_FALLBACK_HREF = 'https://cal.com/yesid-dev';

/** The Contact channels Calendar row owns the booking link used on Home and Contact. */
export function bookingHref(channels: readonly { icon: string; href: string }[]): string {
	return channels.find((channel) => channel.icon === 'calendar')?.href.trim() || BOOKING_FALLBACK_HREF;
}

function parseAbsoluteUrl(href: string): URL | null {
	const value = href.trim();
	if (!value) return null;

	try {
		return new URL(value);
	} catch {
		return null;
	}
}

export type DirectContactChannel = 'email' | 'phone' | 'whatsapp';

/** The direct channel a link opens, or null when it is not a usable direct contact link. */
export function directContactChannel(href: string): DirectContactChannel | null {
	const url = parseAbsoluteUrl(href);
	if (!url) return null;

	if (url.protocol === 'mailto:') {
		return url.pathname.includes('@') ? 'email' : null;
	}

	if (url.protocol === 'tel:') {
		return /\d/.test(url.pathname) ? 'phone' : null;
	}

	const whatsapp =
		url.protocol === 'https:' &&
		url.port === '' &&
		APPROVED_WHATSAPP_HOSTS.has(url.hostname) &&
		url.pathname !== '/';
	return whatsapp ? 'whatsapp' : null;
}

export function isDirectContactHref(href: string): boolean {
	return directContactChannel(href) !== null;
}

export function isProjectProofHref(href: string): boolean {
	const url = parseAbsoluteUrl(href);
	if (!url || url.username || url.password) return false;

	return (
		(url.protocol === 'https:' || url.protocol === 'http:') &&
		url.hostname.length > 0
	);
}
