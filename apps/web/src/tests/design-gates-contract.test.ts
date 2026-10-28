import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as policy from '../../tools/design-gates';

const POLICY_DIGEST = 'sha256:63a3d539169357be7e69c8c22ba0971c29cf7a480dcc9481d130ba48c3c2957f';

function policySnapshot() {
	return {
		forbidden: policy.YESID_FORBIDDEN.map(({ pattern, reason }) => ({
			pattern: pattern.source,
			flags: pattern.flags,
			reason,
		})),
		colorMixFiles: [...policy.YESID_COLOR_MIX_FILES],
		markerAllowedFiles: [...policy.YESID_MARKER_ALLOWED_FILES].sort(),
		colorMixConfig: policy.YESID_COLOR_MIX_CONFIG,
		aaPairs: policy.YESID_AA_PAIRS,
		identities: policy.YESID_IDENTITIES,
	};
}

describe('yesid.dev-owned design-gate policy', () => {
	it('preserves the accepted product doctrine outside the neutral package', () => {
		expect({
			forbidden: policy.YESID_FORBIDDEN.length,
			colorMixFiles: policy.YESID_COLOR_MIX_FILES.length,
			markerAllowedFiles: policy.YESID_MARKER_ALLOWED_FILES.size,
			brandTokens: policy.YESID_COLOR_MIX_CONFIG.brandTokens?.length,
			aaPairs: policy.YESID_AA_PAIRS.length,
			identities: policy.YESID_IDENTITIES.length,
		}).toEqual({
			forbidden: 5,
			colorMixFiles: 2,
			markerAllowedFiles: 0,
			brandTokens: 4,
			aaPairs: 57,
			identities: 2,
		});

		const digest = `sha256:${createHash('sha256')
			.update(JSON.stringify(policySnapshot()))
			.digest('hex')}`;
		expect(digest).toBe(POLICY_DIGEST);
	});
});
