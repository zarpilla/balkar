# Manual screenshots

The scripts here take the manual's screenshots from the **live** sites with Playwright (Chromium) and save them to `../images/<chapter>/<site>-<name>.png`.

## Setup

```bash
cd balkar-back/docs/manual/capture
npm install
npx playwright install chromium     # only if Chromium isn't installed yet
cp .env.manual.example .env.manual  # then fill in the logins (git-ignored)
```

## Scripts

| Command | Takes |
|---|---|
| `node public.mjs [filter]` | Pages anyone can see: home, login, register, landing page. No login needed. |
| `node check-images.mjs` | Lists images the chapters reference that are missing, and images nobody references. |

`[filter]` is a regular expression on `chapter/site-name`, e.g. `node public.mjs balkar`.

## Safety rules

The scripts work on production, so `helpers.mjs` enforces two rules:

- **Read-only.** Every request that could change data (POST, PUT, PATCH, DELETE) is blocked and logged as `[blocked …]`, except logging in. Only the before/after steps may save, on the **test course** given in `.env.manual`. They call `allowWrites(page)` and put the original value back afterwards.
- **Privacy.** Email addresses on screen are blurred before every screenshot, except the sites' own contact addresses. Pass `blur: ['selector']` to `shot()` to blur anything else, such as learners' names in lists.

Before committing new screenshots, look through them for personal data.
