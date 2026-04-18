# Slice 22 — Deploy to Vercel + DNS Cutover

**Level 1 direction doc.**

**Status:** planned
**Depends on:** 21
**Est. Sessions:** 1

## Goal

Site goes live. yesid.dev resolves to the production deployment with full CI/CD.

## Scope

1. Connect the public repo to Vercel.
2. Configure build with Bun runtime.
3. Auto-deploy on push to `main`; preview deploys on PRs.
4. Test preview deployment end-to-end.
5. Update yesid.dev DNS (A + CNAME records, or Vercel's integrated DNS).
6. Verify live production + CI/CD pipeline.
7. Google Search Console: submit sitemap, verify ownership.
8. Configure error reporting (Sentry), analytics (PostHog + Vercel Analytics).

## Verification

- Build succeeds on Vercel
- Preview deploys work on PRs
- Production deploys work on merge to `main`
- 3D scene loads on first paint (if still present; likely retired in 17e)
- CI blocks bad merges (tests must pass)
- Lighthouse scores match pre-deploy measurements
- Social preview tests (from Slice 15) pass on live URL

## Post-launch

- Monitor Vercel Analytics for first-week traffic
- Watch Sentry for any uncaught errors
- Submit to Awwwards / Dribbble / etc. if targeting recognition
