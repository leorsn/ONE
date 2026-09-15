# ONE — External Configuration Checklist

This file separates repository completion from configuration that lives in Apple, Expo/EAS, Supabase, RevenueCat, OpenAI and App Store Connect.

Status vocabulary:

- **CODE COMPLETE** — repository contract/config exists.
- **EXTERNALLY CONFIGURED** — verify in the named external service; do not infer from code.
- **PHYSICALLY TESTED** — verify only on an appropriate signed physical-device build.

## Apple Developer / iOS

| Requirement | Code state | External action | Physical acceptance |
| --- | --- | --- | --- |
| Main bundle ID `app.one.mobile` | CODE COMPLETE | Register/verify identifier and signing team | Install signed build |
| Share Extension `app.one.mobile.ShareExtension` | CODE COMPLETE | Register/verify extension target credentials | Share Sheet must show ONE |
| App Group `group.app.one.mobile` | CODE COMPLETE | Verify capability assignment to required targets/profiles | Share payload handoff |
| Camera permission copy | CODE COMPLETE | Generated through Expo image-picker config | Camera allow/deny/recovery |
| Photos permission copy | CODE COMPLETE | Generated through Expo image-picker config | Photos allow/deny/recovery |
| Notifications integration | CODE COMPLETE | Verify signed native build configuration | Local delivery/tap/cancel |
| URL scheme `one` | CODE COMPLETE | Included in signed binary | Auth/reset/native diagnostic links |

The current V1 auth flow uses the custom `one://` scheme. Associated Domains/Universal Links are not required by the current repository contract and must not be treated as configured merely because a web domain exists. If Universal Links are adopted later, add the entitlement and hosted AASA deliberately and test them separately.

EAS can synchronize supported iOS capabilities during signing, but the Apple account must still have authority and valid credentials. Static config introspection is not proof that Apple accepted capability assignment.

## Expo / EAS

- [ ] Link the repository to the intended Expo/EAS project and verify the project owner.
- [ ] Verify EAS credentials for the Apple Developer Team.
- [ ] Development profile uses the `development` EAS environment and a development client.
- [ ] Preview profile uses the `preview` EAS environment and does not include development-client tooling.
- [ ] Production profile uses the `production` EAS environment and does not include development-client tooling.
- [ ] Verify environment variables separately for development, preview and production.
- [ ] Produce a signed iOS development build for physical acceptance.
- [ ] After acceptance, produce a production/TestFlight build from the accepted SHA.

Recommended verification commands from a clean checkout:

```bash
npm ci --no-audit --no-fund
npm run quality
npx eas-cli@latest env:list --environment development
npx eas-cli@latest env:list --environment preview
npx eas-cli@latest env:list --environment production
npx eas-cli@latest build --platform ios --profile development
```

Do not print secret values into CI logs or tickets.

## Supabase

### Code / live backend already revalidated

- `public.items`: RLS enabled.
- `public.profiles`: RLS enabled.
- authenticated CRUD grants exist; `anon` has no table grants on these private tables.
- ownership policies use `auth.uid() = user_id`; UPDATE has both `USING` and `WITH CHECK`.
- `one-attachments` is private.
- Storage SELECT/INSERT/UPDATE/DELETE policies scope the first path segment to the authenticated user ID.
- `embed-one-item`, `semantic-search`, `delete-account`, and `answer-one-recall` are active with JWT verification enabled.
- Security Advisor: zero security findings at the Master Release audit.

### External verification still required

- [ ] Auth → URL Configuration allows `one://auth/callback`.
- [ ] Auth → URL Configuration allows `one://auth/reset-password`.
- [ ] Production email confirmation/password-reset delivery works with the intended SMTP configuration.
- [ ] Customized email templates preserve the supplied redirect target.
- [ ] Production project ownership/backups/retention settings are reviewed.
- [ ] If development and production use different Supabase projects, set the matching `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in each EAS environment.
- [ ] Never place a service-role key in an Expo public environment.

The committed publishable key is a public client credential; authorization relies on RLS, not secrecy of that key.

## RevenueCat / App Store billing

Expected product identifiers:

- ONE: `app.one.mobile.one.monthly` — target €2.99/month — 7-day eligible introductory trial.
- ONE AI: `app.one.mobile.oneai.monthly` — target €4.99/month — no trial.

External actions:

- [ ] Create/verify the iOS app in RevenueCat.
- [ ] Set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` for the appropriate EAS environments.
- [ ] Create/verify App Store Connect subscription products with the exact identifiers.
- [ ] Configure the ONE introductory trial in App Store Connect; do not encode trial eligibility as a client assumption.
- [ ] Map RevenueCat entitlements `one` and `one_ai` to the correct products.
- [ ] Configure the current offering/package mapping used by the app.
- [ ] Sandbox-test purchase, cancellation, restore, upgrade/downgrade and offline/error behavior.
- [ ] Confirm preview/production builds do not receive development beta entitlement when RevenueCat configuration is absent.

## ONE AI / OpenAI server boundary

- [ ] Store `OPENAI_API_KEY` only as a server-side Supabase Edge Function secret.
- [ ] Optionally set `ONE_RECALL_MODEL`; repository default is `gpt-5.6-luna`.
- [ ] Never create `EXPO_PUBLIC_OPENAI_*` secrets.
- [ ] Run an authenticated end-to-end Ask ONE test against real user-scoped test memories.
- [ ] Verify model failure returns the existing safe/local fallback rather than a fabricated success.

The Recall Edge Function reloads only the bounded item IDs under the caller's authenticated RLS scope and does not send the user's full database to the model.

## Public policy / App Store Connect

Before App Store release:

- [ ] Privacy Policy URL.
- [ ] Terms of Use / subscription terms as applicable.
- [ ] Support URL/contact.
- [ ] App Store privacy disclosures based on the technical inventory below.
- [ ] Subscription metadata and required legal text.
- [ ] Screenshots, description, age rating and release metadata.

## Technical data inventory for later disclosures

ONE may process, depending on user behavior and enabled features:

- account email/authentication identifiers through Supabase Auth;
- user-created memory text, dates, times, URLs, tags, people/entities and structured metadata;
- images/documents captured or shared into ONE;
- on-device OCR output;
- private cloud item rows and private Storage attachments when signed in/syncing;
- local notification content and identifiers for reminders;
- subscription/customer state through RevenueCat when configured;
- a bounded subset of relevant saved-memory fields sent through the authenticated ONE Recall Edge Function to the configured model provider for ONE AI answers.

This is an engineering inventory, not a legal representation. Final disclosures must be reviewed against the production configuration and actual vendor contracts/settings.
