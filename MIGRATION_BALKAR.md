# Moving area.balkar.earth (branch `main`) to the `mooc` code

The `mooc` code now serves both sites. Per-site differences live in Strapi data
(`administration` single type) and env vars, not in code.

## What changes in the data

| Old (main) | New (mooc) | Done by |
|---|---|---|
| `translations` with `ca` / `en` columns | localized rows (`en` + `ca`, linked) | `database/migrations/…backup-main-translations.js` + `scripts/migrate-from-main.js` |
| — | 65 new UI keys used by the mooc front | `scripts/data/balkar-new-translations.json` |
| forums / channels without locale | localized; one copy per language of the space, sharing the `uid` (messages are read by channel uid, so all languages see the same conversation) | `scripts/migrate-from-main.js` |
| learning space `modules` component (module → topics → contents) | `Module` → `Unit` entities; text as `content.markdown`, media as `content.image` / `content.video` / file link | `scripts/migrate-from-main.js` |
| progress by `moduleId` / `topicId` | progress linked to module / unit (old ids are reused as uids) | `scripts/migrate-from-main.js` |
| submissions by `moduleId` | unchanged (module uid = old moduleId) | — |
| no dashboard card image (`bannerOther`) | card image cut from each banner where there is no text | `scripts/migrate-from-main.js` + `scripts/data/balkar-card-crops.json` |

The old `modules` component was kept until every module, topic, text and file
was checked against the new modules and units on a copy of the production
database (2026-10-30: 111 modules, 204 units, 270 content blocks, no
differences); the field and its tables were then removed, along with the
content step of `scripts/migrate-from-main.js`.
About 47 old progress rows do not match any current topic (they point to topics
deleted from the courses or to a much older id format); they were already
invisible before and stay unlinked.

## Steps on the server

Balkar runs the same Docker images as URR. The full runbook (backup, switch
over, checks, rollback) is in `deploy/balkar/DEPLOY.md`. In short, once the
backend container is up:

```
docker compose exec strapi node scripts/migrate-from-main.js            # dry run
docker compose exec strapi node scripts/migrate-from-main.js --apply
docker compose exec strapi node scripts/balkar-branding.js
```

Both scripts can run again safely; they skip what is already done.

### Dashboard card images

The mooc dashboard cards need a roughly 5:4 image, and Balkar's banners are
very wide (up to 5:1) with text inside. `scripts/data/balkar-card-crops.json`
holds, for each current banner (by file hash), a hand-picked area with no text;
the migration cuts it out and saves it as the space's `bannerOther`. The files
are the same on the server, so the real migration produces the same images
with no extra work. Banners added later, or not in the list, get a generic
version (whole banner over a blurred copy); a better image can always be
uploaded by hand in the space's `bannerOther` field.

To redo the card images after editing the crops:
```
node scripts/migrate-from-main.js --apply --regenerate-cards
```

## Per-site settings (Strapi admin → administration)

- `siteName`, `logoHeader`, `logoFooter`, `favicon`
- `theme`: a Theme entry whose CSS overrides the `--theme-*` variables
- `defaultLocale`: language for visitors with no saved choice
- `publicHome`: `false` sends guests from `/` to the login page

The front reads them from `GET /api/site-config` (public, only these fields).
