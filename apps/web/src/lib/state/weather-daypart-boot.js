// Inlined in the head (CSP-hashed) so the Montréal weather card wears Montréal's
// daypart from its first frame, whatever the site theme: dark tokens from sunset
// to sunrise, light ones by day. Same rule and formulas as the card itself
// (suncalc, the sun's centre below -0.833 degrees). Pages are prerendered, so the
// hour can only be known here; the card takes over after hydration.
(() => {
	const rad = Math.PI / 180;
	const d = Date.now() / 864e5 - 0.5 + 2440588 - 2451545;
	const m = rad * (357.5291 + 0.98560028 * d);
	const l = m + rad * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + rad * 102.9372 + Math.PI;
	const e = rad * 23.4397;
	const dec = Math.asin(Math.sin(e) * Math.sin(l));
	const ra = Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l));
	const lat = rad * 45.5017;
	const hour = rad * (280.16 + 360.9856235 * d) - rad * 73.5673 - ra;
	const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hour));
	const theme = altitude < -0.833 * rad ? 'dark' : 'light';
	const stamp = () => document.querySelectorAll('.weather-card:not([data-theme])').forEach((card) => card.setAttribute('data-theme', theme));
	// Mutation records arrive before the parser yields to paint, so each card is
	// stamped before it is first drawn.
	const observer = new MutationObserver(stamp);
	observer.observe(document.documentElement, { childList: true, subtree: true });
	document.addEventListener('DOMContentLoaded', () => {
		stamp();
		observer.disconnect();
	}, { once: true });
})();
