# Public redesign: release preparation

The security candidate pins Next.js to **16.4.3**, keeps React/React DOM **19.0.0**, and retains the approved public redesign with the original logo. **Published on 2026-10-26** after explicit user authorization. See the final production publication record below; earlier preview observations are historical.

## Verified locally on 2026-10-24 (updated clean candidate)

| Check | Result |
| --- | --- |
| Reproducible installation from committed candidate | `npm ci` passed in a clean OS-temp copy |
| Registry vulnerability audit | `npm audit --json`: zero reported vulnerabilities |
| Existing tests | `node --test scripts/*.test.mjs`: 16 passed |
| Production compilation | `npm run build`: passed, including sitemaps |
| Version compatibility | `npm ls next react react-dom` passed; Next 16.4.3, React/React DOM 19.0.0 |
| Original logo | SHA256 unchanged: `12F68A9DB9390D72F44D224C3E41B9F2C9CB7BFA220EDC3D321B2EED5FDF321B` |
| HTTP smoke checks | Previous pre-fix build passed; fresh fixed clean build on port 3011 passed home/category/article/API/robots/sitemaps and expected 404 checks; browser interactions remain pending |
| Actual production configuration/data | Not inspected or changed |

The clean candidate excludes the user's pre-existing FlyerGenerator, proxy-image, html-to-image and seed changes. They remain in the original workspace. Passing a workspace build alone would not establish that those changes are part of the release.

## Hosting configuration to confirm

- Use `frontend` as the application root and the Next.js framework preset.
- Install from the committed lockfile with `npm ci`, build with `npm run build`, and use the host's Next.js runtime integration. For a local self-hosted check, use `npm run start` after building.
- Select a host-supported Node.js LTS version satisfying the installed package engine (`>=20.9.0`); the minimum is not a recommendation to use an unsupported Node release.
- Keep secrets out of source control and out of every `NEXT_PUBLIC_` variable.

| Variable | Required confirmation |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.jujuy247.com.ar` for the canonical production domain |
| `NEXT_PUBLIC_DIRECTUS_URL` | The explicitly approved production HTTPS CMS origin, not localhost |
| `GOOGLE_SITE_VERIFICATION` | Preserve the existing value if configured |
| `YOUTUBE_CHANNEL_ID` / `YOUTUBE_CHANNEL_HANDLE` | Preserve the intended channel settings |
| `YOUTUBE_API_KEY` | Server-only, optional; the public-feed fallback remains available |
| `NEXT_PUBLIC_ADSENSE_CLIENT` and existing slot variables | Preserve the existing commercial configuration if used |

Public variables must be correct **before the hosting build**, since Next.js embeds them in browser assets. Do not upload or promote the `.next` build made against localhost. The image host configuration also derives from the Directus origin. Sitemaps read the CMS during the build, so that origin and public read permissions must work then.

No schema migration or seed script is part of this release. Do not run `seed.js`, `seed_tags.js` or `update_articles.js` against production.

## Local smoke checklist

Use the patched clean candidate with the local CMS. After the server is running:

- [ ] Home returns HTTP 200, renders the redesign and references `/logo3.png`.
- [ ] A category and article selected from the local public CMS return HTTP 200.
- [ ] `/robots.txt`, `/sitemap.xml` and `/news-sitemap.xml` return successful responses.
- [ ] Canonical URLs use the configured test origin; no unintended production requests or writes occur.
- [ ] Verify navigation, header behavior, video selection and image rendering in the browser. Local missing-image fixtures are not proof of production asset readiness.

## Before production

1. Complete the pending local checks and the candidate's applicable review; record failures honestly.
2. Obtain explicit authorization for the destination project, operation and account/session before inspecting hosting settings, pushing, creating a remote preview, merging or deploying. Preparation is not publication authorization.
3. Confirm production environment variables in the existing hosting project; do not overwrite working values from `.env.local` or assume example values are deployed.
4. Build an explicitly authorized preview of the approved candidate. Confirm real images, news, category pagination, canonical tags, structured data, sitemaps, videos and advertising.
5. Retain the previous deployment identity and approve a rollback plan before promotion. Promote only after the preview checks succeed and production publication is explicitly authorized.

## Rollback boundary

The security work unit changes the two dependency manifests plus its task record. The public layout, logo, CMS and stored news are unchanged by that unit.

Do **not** roll back to a deployment using vulnerable Next.js 16.4.0 merely to undo a visual regression. Prefer a previously verified patched deployment; if none exists, prepare the previous visual layout with the patched framework before publishing. Never restore an insecure package lock or run seed/data-reset commands as rollback.

## Security evidence

The baseline audit reported affected Next.js 16.4.0. The patched audit reports zero findings as of the check date, not a guarantee that all application risks have been eliminated.

- [Image optimization advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [App Router Server Actions denial-of-service advisory](https://github.com/advisories/GHSA-p3m5-59mp-jv5r)
- [Cache typed-array advisory](https://github.com/advisories/GHSA-673q-mjm6-r5xr)


## Updated clean candidate

Isolated baseline 9cb52b1 plus only directus.js, redesign.css, seo.test.mjs and editorial.test.mjs fixes passed npm ci, audit (zero), 16 tests, version checks and build. Retained local build: C:/Users/mauro/AppData/Local/Temp/next-release-d58efd003de7447eb94ba595f8027cc8/frontend. Source hashes and logs reside in its parent. The build uses local CMS and test origin 3011, so never promote its .next output to production. Clean HTTP proof passed; clean browser interactions remain pending. Do not conflate old port 3010 with this fixed candidate.

## Final local review result

Fix candidate e646878 passed native risk, resilience and reliability review with no findings; exact acknowledgement completed for target sha256:40dfeb3733520b4406a44d6f403d247fd2c3b12c5bb7d425514e60bcb17d3e65. This does not approve publication or certify production content. Antigravity reported no observed styling/functionality blockers on development3003, with matching fix hashes; clean3011 browser evidence remains pending. Codex browser automation was unavailable due missing kernel assets. Do not infer a rendered visual test from HTTP or CSS structural checks.

## Hosted preview validation

Preview: https://jujuy247-nuevo-8dlj50h1g-maurocentu26s-projects.vercel.app (dpl_s2x8iMf4vZwU422KKDJ3NhspQtV2), READY, source1479d64, scoped projectjujuy247-nuevo, rootfrontend, Node24.x. Production not promoted. Eleven HTTPchecks passed, including real categorypagination and images. XML sitemap903URLs/news4URLs; JSONLDvalid; previewresponse noindex; canonicalsproductiondomain.

**Do not promote yet:** hosted homepage displays the video-unavailable fallback rather than a player. Previewruntime reports YouTubeAPI429/rateLimitExceeded; fallback-specific cause is not established. Resolve and recheck embedded videos, then complete browser checks before promotion. No hosting environment changes or CMSwrites were performed.

## YouTube follow-up (supersedes earlier missing-player observation)

Latest preview: https://jujuy247-nuevo-iy8oapmlm-maurocentu26s-projects.vercel.app, deploymentdpl_FTWFnRnZS31Z3JAiRwkAhcWcbvGh, sourcee7807da. PublicRSS nowpreferred; APIusedonlyasfallback for latestvideos, reducing routine searchquota use. Sanitized serverdiagnostics log only HTTPstatus/errorname. Correctchannelindependentlyverified; originalRSSintermittency cause remainsunproven.

18tests passed, remoteproductionbuildREADY, hostedhome200 with embeddedyoutube-nocookieplayer and4playlistbuttons; noemptyfallback or autoplay1. Playback, keyboardselection and responsivevisual acceptance must still be observed in browser beforepromotion. The earlier11-routechecks applytoinitialpreview; latestpreviewhas targetedsmokeonly. No productionpromotion or key/environmentchanges.

## Production publication — 2026-10-26

Status: PUBLISHED at https://www.jujuy247.com.ar . Deployment dpl_2Dv7zKYYjhq4Qea3qByh5ZJuCw1H (https://jujuy247-nuevo-cuad4fi4o-maurocentu26s-projects.vercel.app), production environment, Node24, cleantrackedfrontendfrom225d0b2 identicaltested42c8b09. Built with existingproductionvariables without changing keys/settings; production-domainpromotion followed independent12-endpointstagedchecks and parentcheck.

PublicdomainresolvednewREADYdeployment; home/category/article/pagination/API/images/robots/sitemaps200, missingarticle404,907sitemapURLs/5newsURLs,2validarticleJSONLDdocuments. Oldlogoandredesignpresent,1YouTubeiframe/4playlistbuttons/noemptyfallback. Canonicalproductiondomaincorrect; publicresponsesnotnoindex, HTMLindexfollow. Userconfirmedactualplayback/selectiononidenticalfrontendpreview; publicproductionplaybackwasnotindependentlybrowser-tested. UpstreamYouTubeavailabilityremainsanexternalrisk, notcertifiedpermanentfix.

Previousdeployment: dpl_7LDvxf51gVCQjkNv9VJ8zRuAY8Jx. Retainidentityforincidentanalysis; do not blindlyrollbackto anunpatchedNextdeployment. No CMS/seeds/sourceuserwork included, noGitpush/mainmerge. IntegratingthereleasebranchintoGitmainremainsseparateauthorizedwork sofutureGitdeploysdonotdivergefromCLIpublication.
