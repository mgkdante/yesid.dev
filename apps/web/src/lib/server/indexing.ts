export const NOINDEX_POLICY = 'noindex, nofollow, noarchive';

const PRODUCTION_HOSTNAMES = new Set(['yesid.dev', 'www.yesid.dev']);

export function isProductionHostname(hostname: string): boolean {
	return PRODUCTION_HOSTNAMES.has(hostname.toLowerCase());
}
