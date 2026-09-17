# NEVER — Personal Team iPhone Test Mode

This guide is for temporary on-device development before the Apple Developer Program membership/signing configuration is available.

It is **not** TestFlight acceptance and it must not weaken the committed production configuration.

## What this mode is for

Use an Xcode Personal Team build to review the parts of NEVER that do not depend on paid-program provisioning:

- launch/root loading state;
- onboarding;
- sign-in UI and local route behavior;
- Home/Inbox;
- Search;
- Calendar UI;
- Saved/Documents UI;
- Ask NEVER UI/local fallback behavior where available;
- Item Detail and Inbox Detail;
- Appearance/light/dark mode;
- general keyboard, safe-area, haptic and visual acceptance;
- camera/photo/OCR only if the generated Personal Team target signs with those permissions on the test device.

## What does not count as accepted in Personal Team mode

Do not mark these as passed merely because the rest of the app installs:

- Push/notification entitlement provisioning;
- App Groups;
- Share Extension handoff;
- TestFlight/App Store distribution;
- production StoreKit/RevenueCat purchase acceptance;
- any Apple capability that Xcode cannot provision for the Personal Team.

These remain open until tested with the intended Apple Developer Program team and signed profiles.

## Important rule

Do **not** remove production capabilities from committed `app.json`, EAS configuration, Share Extension identifiers, App Group identifiers or release tests just to make Personal Team signing succeed.

If Xcode generates a local `ios/` project and Personal Team signing rejects an entitlement, any workaround is local-only and disposable.

Before changing generated native files, confirm the entitlement that is blocking signing:

```bash
grep -R "aps-environment\|com.apple.security.application-groups" ios -n
```

Known example from the first physical-device attempt: a generated `aps-environment` entitlement blocked Personal Team signing.

## Local-only workaround policy

If the goal is **core UI/device QA only** and Xcode rejects an advanced capability:

1. Keep the remote branch unchanged.
2. In Xcode, use the Personal Team for the main app target.
3. Remove/disable only the unsupported generated capability needed to get the temporary main-app test build signed.
4. Do not claim the removed capability as tested.
5. Record the local deviation in the test notes.
6. Never commit generated entitlement/capability removals to `dev/foundation`.

If App Groups/Share Extension provisioning prevents the entire build from signing, stop Share Sheet acceptance for that build rather than redesigning the production Share architecture around Personal Team limitations.

## Before the next Mac test

From the repository:

```bash
cd ~/ONE
git checkout dev/foundation
git pull
git status --short
npm ci --no-audit --no-fund
npm run quality
```

The checkout should be clean before generating/rebuilding native iOS files.

After a local-only signing workaround, run:

```bash
git status --short
```

Do not commit generated Personal Team capability changes.

## Personal Team acceptance result

A successful Personal Team session may establish:

- **CORE DEVICE UI: PASS**
- **CORE LOCAL FLOWS: PASS/PARTIAL**

It cannot establish:

- **SHARE EXTENSION: PASS**
- **PUSH/PROVISIONED NOTIFICATIONS: PASS**
- **TESTFLIGHT: READY**
- **APP STORE: READY**

Those require the intended paid-program signing/configuration and the full `docs/DEVICE_TEST_PLAN.md` acceptance matrix.

## After Apple Developer Program enrollment

Return to the committed production capability set, generate/sign with the intended team, then run the full device matrix:

- Share Sheet/App Group handoff;
- notifications and notification taps;
- auth deep links;
- camera/photo/OCR;
- offline/reconnect;
- account isolation;
- billing sandbox;
- iPhone/iPad visual acceptance;
- TestFlight archive/release gates.

Treat the Personal Team build as temporary instrumentation, not as the release candidate.
