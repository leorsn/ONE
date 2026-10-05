# NEVER launch website — verification and deployment

Source repository: `leorsn/ONE`.
Production branch: `web/never-launch-site`.
Vercel project: `never` (`prj_0orYJDYQDCkTCkHnisbJUrKZriz2`).
Root directory: `website`. Framework: Next.js.
Production domain: https://never-ruddy.vercel.app

## Verified on 2026-10-05

- Retrieved the complete website source from GitHub commit `5c516b1a8144c96c31d694957c7c5ff75de2548d`.
- Matched all six original PNG files against their Git blob hashes.
- Confirmed that `never-scroll-sprite.jpg` matches its Git blob hash but is not a decodable image. Replaced its use with four actual app screenshots encoded as WebP.
- `npm run build` passes compilation, TypeScript and static generation for Home, Explore, metadata, sitemap and robots.
- All ten new WebP assets decode successfully.
- Inspected generated HTML for the four story chapters, six Material Worlds, two existing planned memberships, navigation, main-content targets and route metadata.
- App Store availability remains marked as coming soon. Existing planned prices and trial conditions remain unchanged. No free plan or unlimited quota was added.

## Deployment diagnosis

The current production deployment is `dpl_9U6auG3Zrqd9b4NTn4dcBifHVC5s` with source `drop`, empty Git metadata and the old Product / Worlds / Privacy architecture. Vercel's Git deployment context reports no linked projects for the team. The live site does not show the current GitHub branch.

The existing production domain must stay on this project. Root directory and Next.js build configuration have been set on the existing project. Git repository connection and the production branch still require dashboard access: the available connector can create a Git-linked project but explicitly cannot reconnect an existing unlinked project of the same name.

## Still required before release approval

1. Connect the existing `never` project to `leorsn/ONE` and select production branch `web/never-launch-site`.
2. Deploy that branch, then verify the SHA, target and production alias.
3. Browser-check Home and Explore at widths 1440, 1280, 1024, 768, 430 and 390; include short mobile viewports.
4. Exercise forward/reverse/fast scroll, chapter buttons, refresh halfway through the story, mobile navigation, all six world selections, pricing and privacy anchors.
5. Exercise reduced motion, JavaScript-disabled reading and keyboard navigation. Check console/hydration errors, decoded images, viewport overflow and failed network requests.
6. Confirm the actual public production URL serves this commit, including ScrollStory and Explore. A successful build alone is not release verification.

Local browser QA was attempted but could not run: agent-browser cannot bind its daemon socket in this runtime, and no Chromium executable is installed. Local HTTP access also failed. No responsive or runtime browser pass is claimed.

## Scope

Only `website/` files changed. Mobile/native application and Supabase configuration are outside this change.
