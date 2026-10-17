# FlexiDuit loan management

Private English-language admin dashboard with a D1 database. Live records belong to the signed-in owner. The sample preview is fictional and never saved into the database.

Features: create/edit records, full name, MyKad, phone, bank/account, application ID, status, loan principal, due date, automatic Malaysia time display, optimistic concurrency protection, immutable record snapshots, customer loan history grouped by MyKad, masked CSV export, search, filtering, pagination, derived portfolio summary, and in-app notifications.

The requested 99+ badge is displayed only in sample mode; live mode counts pending and overdue records. Active loans past their due date display as Overdue. Paid is an administrator-set status, not a payment reconciliation result. Amounts are original loan principal, not outstanding balances. Notifications are in-app only. The supplied Salesforce logo is a visual asset; no Salesforce integration is configured.

## Hosting
This application uses Sites private authentication headers and the D1 binding DB. Do not deploy the Worker directly without equivalent access enforcement. The current project is private. GitHub Pages cannot host this database/API application directly. The user's original GitHub Pages website has not been changed.

## Checks
- `node node_modules/typescript/bin/tsc --noEmit`
- `python3 tests/database.py`
- `node tests/api.mjs`
- `npm run build`

Migrations are in drizzle/. Sample data remains in the frontend only. Personal data is never included in source, logs, or sample fixtures. MyKad and account values remain available to the authorized owner in the details dialog; masking is a display default, not encryption.

## Sidebar and customer names
Use **Hide sidebar** in the top bar or inside the sidebar. Use **Show sidebar** in the top bar to reopen it. The preference is remembered in this browser. In **Live database**, use **Edit name** in the Actions column, change Full name and select **Save changes**. This updates the selected loan record and records a history snapshot. Other applications for the same customer are separate records. Sample records are read-only.

## Upload the complete source to GitHub
1. Extract this ZIP and upload the contents (including hidden configuration files) to your repository root, preserving folders. Do not upload the ZIP itself as the website.
2. This is a React/Vinext server application, not a single index.html website. GitHub stores the code; GitHub Pages alone cannot run its authenticated API or database.
3. The working hosted version uses Sites authentication and Cloudflare D1. Hosting elsewhere requires equivalent server-side authentication, a DB binding, and the SQL migrations in drizzle/. Do not expose the current Worker directly: its identity headers depend on the trusted Sites gateway.
4. Install dependencies with `npm run install:ci`, then run `npm run build` in the supported environment. The .openai/hosting.json file identifies the existing Sites project.
5. Customer records live in the database and are not included in this source archive. Never commit real customer records or secrets into GitHub.

Changed UI files: app/dashboard.tsx and app/globals.css. All original source files, migrations and local image assets are included.
