# NEVER launch website — verification and deployment

Source repository: `leorsn/ONE`.
Production branch: `web/never-launch-site`.
Vercel project: `never` (`prj_0orYJDYQDCkTCkHnisbJUrKZriz2`).
Root directory: `website`. Framework: Next.js.
Production domain: https://never-ruddy.vercel.app

## Verified on 2026-10-05

- Retrieved the website source from GitHub commit `5c516b1a8144c96c31d694957c7c5ff75de2548d`.
- Matched all six original PNG files against their Git blob hashes.
- Confirmed that `never-scroll-sprite.jpg` matches its Git blob hash but is not a decodable image. Replaced its use with four actual app screenshots encoded as WebP.
- `npm run build` passes compilation, TypeScript and static generation for Home, Explore, metadata, sitemap and robots.
- All ten new WebP assets decode successfully.
- Inspected generated HTML for the four story chapters, six Material Worlds, two existing planned memberships, navigation, main-content targets and route metadata.
- App Store availability remains marked as coming soon. Existing planned prices and trial conditions remain unchanged. No free plan or unlimited quota was added.

## Production replacement

The former production deployment `dpl_9U6auG3Zrqd9b4NTn4dcBifHVC5s` had source `drop`, empty Git metadata and the old Product / Worlds / Privacy architecture.

The existing project is now connected to `leorsn/ONE`. Dashboard settings confirm production branch `web/never-launch-site`, root `website`, framework Next.js, build command `npm run build`, and automatic production domain assignment.

Git commit `f10583486c3b6360364b8b03a576a43eb9631634` was built in preview, then rebuilt in the production environment as `dpl_GL7nRdWeSkY2ohcoXZ78Jcr3sAGM`. Vercel marks this production build as `redeploy`; its GitHub repository, branch and commit metadata are populated, and its build log explicitly records cloning GitHub at that branch and commit. No files were manually uploaded. Both stable aliases point to this Git-based deployment:
- `never-ruddy.vercel.app`
- `never-info-71269986.vercel.app`

This report update also checks that a push to the configured branch triggers a new automatic Git production deployment.

## Public production checks

Checked the actual stable production URL, rather than relying on the preview URL or a successful build:
- Unauthenticated HTTP requests to Home and `/explore` both return 200.
- Home shows the new title and ScrollStory architecture. The old “Your memory, organized” title is absent.
- Browser check at 1363 × 936 confirms enhanced ScrollStory, loaded real app screens, chapter controls and reverse scrolling. Scan and Calendar switch to their corresponding visible screen and text.
- `/explore` opens through Home navigation and has its own page title.
- All six world controls work: Aurora, Monolith, Platinum, Archive, Canyon and Tidal. Their thumbnails load and the active heading changes on selection.
- Pricing anchor opens both planned memberships, €2.99 NEVER and €4.99 NEVER AI, with the existing trial conditions.
- No horizontal overflow was observed on either route at this viewport.
- Captured browser warnings/errors were from the browser extension, not application or hydration errors.

## Remaining broader QA

A full responsive test matrix at 1440, 1280, 1024, 768, 430 and 390, short mobile viewports, reduced motion, JavaScript-disabled reading and keyboard navigation is not claimed by this deployment check. Local browser QA was attempted but could not run: agent-browser could not bind its daemon socket and no Chromium executable was installed. The production checks above used the cloud browser.

## Scope

Only `website/` files changed. Mobile/native application and Supabase configuration are outside this change.
