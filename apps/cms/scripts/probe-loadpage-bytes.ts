// Slice-18i Task 1.8 (Probe P10): measures the URL byte-size of the
// loadPage('home') Directus query. Verifies the single-deep-fields-query
// approach fits Directus's request limit before Phase 3 implementation.
//
// Run: bun run apps/cms/scripts/probe-loadpage-bytes.ts
// No Directus connection required — pure construction + Buffer.byteLength.

const ALL_BLOCK_COLLECTIONS = [
  'block_hero',
  'block_manifesto',
  'block_proof_reel',
  'block_services_grid',
  'block_cta',
  'block_closer',
  'block_about_intro',
  'block_about_content',
  'block_contact_content',
  'block_tech_stack_page_content',
  'block_blog_page_content',
  'block_projects_page_content',
] as const;

const fields = [
  '*',
  'translations.*',
  'blocks.*',
  ...ALL_BLOCK_COLLECTIONS.flatMap((c) => [
    `blocks.item:${c}.*`,
    `blocks.item:${c}.translations.*`,
  ]),
];

const url = `/items/pages?filter[slug][_eq]=home&filter[status][_eq]=published&fields=${encodeURIComponent(fields.join(','))}&limit=1`;

const bytes = Buffer.byteLength(url);
console.log(`URL bytes: ${bytes}`);
console.log(`Field count: ${fields.length}`);
console.log(`Block collections: ${ALL_BLOCK_COLLECTIONS.length}`);
console.log('');
console.log('Decision thresholds:');
console.log('  < 4000 bytes: proceed with single-query approach (Phase 3)');
console.log('  4000–8000:    proceed but flag as a watch item (R1 risk)');
console.log('  > 8000:       escalate — split into per-collection batched queries');
console.log('');
console.log(`URL preview (first 500 chars):`);
console.log(url.slice(0, 500));
