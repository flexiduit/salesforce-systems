# FlexiDuit Cloudflare Access JWT patch

## What changes

Replace `app/chatgpt-auth.ts` in `flexiduit/salesforce-systems` with the file included here. The original import/export names remain compatible with `app/page.tsx` and `app/api/records/route.ts`. Authentication switches from untrusted ChatGPT header claims to cryptographically verified Cloudflare Access JWTs.

In `app/dashboard.tsx`, replace **every** occurrence of:

`/signout-with-chatgpt?return_to=%2F`

with:

`/cdn-cgi/access/logout`

Do not change the dashboard JSX layout, CSS or records SQL.

## Configure Cloudflare Worker variables

Set these in the Worker configuration as non-secret plain text variables (these contain identifiers, not signing credentials):

- `CF_ACCESS_TEAM_DOMAIN`: `<your-team>.cloudflareaccess.com`
- `CF_ACCESS_AUD`: the **AUD application tag** from Access > Applications > FlexiDuit app
- `ADMIN_EMAILS`: one or more explicitly authorized email addresses separated by commas, e.g. `admin@example.com`

Do not use the example values in production. Protect the **entire** Worker domain, all routes, and all environments that can reach customer data. Configure the Access policy to allow only approved admins, preferably with MFA. Verify this is a policy for the exact workers.dev/custom domain used.

The Cloudflare Access proxy attaches `Cf-Access-Jwt-Assertion` to requests. The backend verifies the RS256 signature with Access JWKS endpoint, issuer, audience, expiration, subject and allowed email. No request is granted access when configuration is missing or JWKS is inaccessible.

## Deploy & validate

1. Commit the file replacement and dashboard link replacement to GitHub.
2. Configure the three Worker variables and deploy the new commit.
3. Test the Worker domain in a private browser window. Unauthorized users should not pass Access.
4. Sign in with the approved admin and load the dashboard. It should call `/api/records` successfully and show an empty records table (if D1 is empty).
5. Test a non-admin identity, missing/invalid JWT, record creation, reload and updates. `/api/records` must return 401 with no verified token.
6. Check your D1 binding is `DB` and points to database `5739d3aa-217f-4e2c-8f08-de5bdf10957d`.
7. Do not add real MyKad or banking data before validating authorization, secure backups, retention policies, and operational access controls.

Notes: Logging out of the app requires `/cdn-cgi/access/logout` under the Cloudflare Access-protected hostname. Existing ChatGPT routes should no longer be used. This patch has not been built or end-to-end tested against the production account. Existing records keyed to a former ChatGPT user ID may not appear under the new Cloudflare Access subject; migration would be required if legacy records exist.
