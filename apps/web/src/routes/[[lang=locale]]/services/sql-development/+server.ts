// GO-2 Track 3 (services consolidation): sql-development merged into
// database-engineering. The CMS row survives archived (visible=false,
// archive-not-delete); this static segment shadows the sibling [id] route
// so the indexed URL 301s instead of 404ing.
//
// Pattern copied from routes/work/+server.ts (slice-28.1 audit #24): raw
// Response because redirect() can't carry headers, and this permanent
// redirect should serve from the CDN edge (s-maxage=86400) rather than
// invoking the lambda per legacy hit.

export function GET(): Response {
	return new Response(null, {
		status: 301,
		headers: {
			location: '/services/database-engineering',
			'cache-control': 'public, s-maxage=86400',
		},
	});
}
