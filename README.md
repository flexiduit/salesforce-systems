# FlexiDuit — top navigation, sidebar and About Company

Contains a non-destructive patch for an existing `flexiduit/salesforce-systems` React/Vinext application.

## Changes
- Keeps the existing fixed sidebar; adds an **About Company** navigation item.
- Keeps the top navigation, existing working notification bell and sign-out icon; adds quick links to Dashboard / Customers / About Company.
- Changes visual theme from dark green to purple and lavender, without changing records API or D1.
- Adds About Company editable cards (company name, description, website, mission, services).
- Changes old ChatGPT sign-out links to `/cdn-cgi/access/logout` (Cloudflare Access logout endpoint).
- The company editor saves text in browser localStorage only, not server-wide. Do not treat it as a production-wide CMS.

## Install (developer / Codespaces)
Unzip the patch, then run:

```
python install.py /path/to/salesforce-systems
cd /path/to/salesforce-systems
npm run build
```

Review `git diff` and backup `.bak` files. Commit only when the build and UI tests pass. Cloudflare may auto-deploy on new commits.

## Caution
Do not overwrite production `app/chatgpt-auth.ts`, database migration files or Wrangler settings with older ZIP snapshots. The existing JWT authentication must remain in place. Cloudflare Access must protect all production traffic and the backend must verify its JWT.
