// GO-2 Track 3 (services consolidation): internal-tooling archived; its
// promise (kill spreadsheet copy-paste) lives on in Pipelines & Automation,
// so intent-preserving redirect target is /services/data-pipeline.
// See sql-development/+server.ts for the pattern rationale.

export function GET(): Response {
	return new Response(null, {
		status: 301,
		headers: {
			location: '/services/data-pipeline',
			'cache-control': 'public, s-maxage=86400',
		},
	});
}
