'use strict';

/**
 * One-off data migration: Balkar database (branch main) -> mooc structure.
 *
 * Run it once, after starting the mooc backend at least once against the
 * database (so the schema is synced and
 * database/migrations/2026.10.25T00.00.00.backup-main-translations.js has
 * saved the old translations):
 *
 *   npm run build
 *   node scripts/migrate-from-main.js            # dry run (rolls back)
 *   node scripts/migrate-from-main.js --apply    # writes the changes
 *   node scripts/migrate-from-main.js --apply --regenerate-cards
 *                                                # also redo the dashboard card images
 *
 * Every step skips work that is already done, so it is safe to run again.
 *
 * What it does:
 *  1. translations: rebuilds the localized rows (en + ca) from _main_translations.
 *  2. forums / channels: sets locale + uid, and creates a copy for each other
 *     language of the learning space, sharing the uid (messages are read by
 *     channel uid, so all languages see the same conversation).
 *  3. dashboard card images cut from the banners (see below).
 *  4. progresses: links each progress to the new module / unit.
 *
 * It also converted each learning space's old `modules` component (module ->
 * topics -> contents) into Module -> Unit entities, keeping the old moduleId /
 * topicId as uids. That step ran on Balkar on 2026-10-25 and was removed with
 * the `modules` field on 2026-10-30; it is in the git history if needed.
 *  5. branding: optional, see scripts/balkar-branding.js.
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');

const APPLY = process.argv.includes('--apply');
const DEFAULT_LOCALE = process.env.MIGRATION_DEFAULT_LOCALE || 'ca';

const log = (...args) => console.log('[migrate]', ...args);

class DryRun extends Error {}

async function linkLocalizations(trx, uid, ids) {
  // Each entry lists all the other entries as its localizations.
  for (const id of ids) {
    await strapi.db
      .query(uid)
      .update({ where: { id }, data: { localizations: ids.filter((x) => x !== id) } });
  }
}

// ---------------------------------------------------------------------------
// 1. Translations
// ---------------------------------------------------------------------------
const TRANSLATIONS_BACKUP_KEY = 'migration_main_translations';

async function migrateTranslations(knex) {
  const backup = await knex('strapi_core_store_settings')
    .where({ key: TRANSLATIONS_BACKUP_KEY })
    .first();
  if (!backup) {
    log('translations: no backup of the old translations, skipping');
    return;
  }
  const old = JSON.parse(backup.value);
  const T = 'api::translation.translation';
  let migrated = 0;
  for (const row of old) {
    // After the schema sync the old row keeps its id and key, and the i18n
    // plugin gives it the default locale (ca). The front reads the English
    // entry as the main one, so each key needs an en row linked to a ca row.
    // `key` is unique in the database, and the front only reads the key of
    // the en row, so the ca row gets a suffix (as URR does with "-1").
    const existing = await strapi.db.query(T).findOne({ where: { id: row.id } });
    const caId = existing ? existing.id : (await strapi.db.query(T).create({ data: {} })).id;
    await strapi.db.query(T).update({
      where: { id: caId },
      data: { key: `${row.key}-ca`, locale: 'ca', text: row.ca, textHtml: row.ca_html },
    });
    const en = await strapi.db.query(T).create({
      data: { key: row.key, locale: 'en', text: row.en, textHtml: row.en_html },
    });
    await linkLocalizations(null, T, [en.id, caId]);
    migrated++;
  }
  // Mark the backup as used so a second run does not duplicate the en rows.
  await knex('strapi_core_store_settings')
    .where({ key: TRANSLATIONS_BACKUP_KEY })
    .update({ key: `${TRANSLATIONS_BACKUP_KEY}_done` });
  log(`translations: ${migrated} keys migrated to en + ca`);
}

// UI keys used by the mooc front that the old Balkar database does not have.
async function addNewTranslations() {
  const T = 'api::translation.translation';
  const entries = require('./data/balkar-new-translations.json');
  let added = 0;
  for (const { key, en, ca } of entries) {
    const exists = await strapi.db.query(T).findOne({ where: { key, locale: 'en' } });
    if (exists) continue;
    const enRow = await strapi.db.query(T).create({ data: { key, locale: 'en', text: en } });
    const caRow = await strapi.db
      .query(T)
      .create({ data: { key: `${key}-ca`, locale: 'ca', text: ca } });
    await linkLocalizations(null, T, [enRow.id, caRow.id]);
    added++;
  }
  log(`translations: ${added} new keys added for the mooc front`);
}

// ---------------------------------------------------------------------------
// 2. Forums and channels
// ---------------------------------------------------------------------------
async function migrateForums() {
  const forums = await strapi.db.query('api::forum.forum').findMany({
    where: { $or: [{ locale: null }, { uid: null }] },
    populate: {
      learning_space: { populate: { localizations: true } },
      channels: { populate: { users_permissions_users: true } },
    },
  });

  let forumCopies = 0;
  let channelCount = 0;
  for (const forum of forums) {
    const space = forum.learning_space;
    const locale = (space && space.locale) || DEFAULT_LOCALE;
    const forumUid = forum.uid || uuidv4();
    await strapi.db
      .query('api::forum.forum')
      .update({ where: { id: forum.id }, data: { locale, uid: forumUid } });

    // Channels of the original forum
    const channels = [];
    for (const channel of forum.channels || []) {
      const channelUid = channel.uid || uuidv4();
      await strapi.db
        .query('api::channel.channel')
        .update({ where: { id: channel.id }, data: { locale, uid: channelUid } });
      channels.push({ ...channel, uid: channelUid });
      channelCount++;
    }

    // One copy per other language of the learning space
    const forumIds = [forum.id];
    const channelIdsByUid = Object.fromEntries(channels.map((c) => [c.uid, [c.id]]));
    for (const loc of (space && space.localizations) || []) {
      if (loc.locale === locale) continue;
      const copy = await strapi.db.query('api::forum.forum').create({
        data: {
          name: forum.name,
          description: forum.description,
          uid: forumUid,
          locale: loc.locale,
          learning_space: loc.id,
        },
      });
      forumIds.push(copy.id);
      forumCopies++;
      for (const channel of channels) {
        const channelCopy = await strapi.db.query('api::channel.channel').create({
          data: {
            name: channel.name,
            order: channel.order,
            uid: channel.uid,
            locale: loc.locale,
            forum: copy.id,
            users_permissions_users: (channel.users_permissions_users || []).map((u) => u.id),
          },
        });
        channelIdsByUid[channel.uid].push(channelCopy.id);
      }
    }
    await linkLocalizations(null, 'api::forum.forum', forumIds);
    for (const ids of Object.values(channelIdsByUid)) {
      if (ids.length > 1) await linkLocalizations(null, 'api::channel.channel', ids);
    }
  }

  // Channels that do not belong to any forum still need a uid and a locale
  const orphanChannels = await strapi.db.query('api::channel.channel').findMany({
    where: { $or: [{ locale: null }, { uid: null }] },
  });
  for (const channel of orphanChannels) {
    await strapi.db.query('api::channel.channel').update({
      where: { id: channel.id },
      data: { locale: channel.locale || DEFAULT_LOCALE, uid: channel.uid || uuidv4() },
    });
  }

  log(
    `forums: ${forums.length} updated, ${forumCopies} language copies created; ` +
      `channels: ${channelCount} updated, ${orphanChannels.length} without forum`
  );
}

// ---------------------------------------------------------------------------
// 3. Dashboard card images
// ---------------------------------------------------------------------------
// The mooc dashboard cards show `bannerOther` (about 5:4), which Balkar spaces
// do not have. Their banners are very wide (up to 5:1) and full of text, so a
// plain crop cuts the text. scripts/data/balkar-card-crops.json lists, per
// banner, a part of it without text. Other banners get a generic version: the
// banner over a blurred, enlarged copy of itself.
const CARD_WIDTH = 1000;
const CARD_HEIGHT = 800;
const CARD_CROPS = require('./data/balkar-card-crops.json');

async function cardFromCrop(sharp, source, crop) {
  const { width, height } = await sharp(source).metadata();
  const left = Math.round(crop.left * width);
  const top = Math.round(crop.top * height);
  const region = {
    left,
    top,
    width: Math.min(Math.round(crop.width * width), width - left),
    height: Math.min(Math.round(crop.height * height), height - top),
  };
  // Transparent PNGs would turn black in the JPEG
  let img = sharp(source).flatten({ background: crop.background || '#ffffff' }).extract(region);
  if (crop.blur) img = img.blur(crop.blur);
  if (crop.fit === 'contain') {
    return img
      .resize(CARD_WIDTH - 120, CARD_HEIGHT - 120, { fit: 'inside' })
      .extend({ top: 60, bottom: 60, left: 60, right: 60, background: crop.background || '#ffffff' })
      .resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'contain', background: crop.background || '#ffffff' });
  }
  return img.resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover' });
}

async function genericCard(sharp, source) {
  const background = await sharp(source)
    .flatten({ background: '#ffffff' })
    .resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 1.05 })
    .toBuffer();
  const front = await sharp(source)
    .flatten({ background: '#ffffff' })
    .resize(CARD_WIDTH, CARD_WIDTH / 2, { fit: 'cover', position: sharp.strategy.attention })
    .toBuffer();
  return sharp(background).composite([{ input: front, gravity: 'centre' }]);
}

async function makeCardImage(banner) {
  const sharp = require('sharp');
  const os = require('os');
  const fs = require('fs');
  const source = path.join(strapi.dirs.static.public, banner.url);
  const crop = CARD_CROPS[banner.hash];
  const img = crop ? await cardFromCrop(sharp, source, crop) : await genericCard(sharp, source);
  const name = `card-${path.parse(banner.name || banner.hash).name}.jpg`;
  const out = path.join(os.tmpdir(), name);
  await img.jpeg({ quality: 85 }).toFile(out);
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name, alternativeText: banner.alternativeText || '' } },
      files: { path: out, name, type: 'image/jpeg', size: fs.statSync(out).size },
    });
  fs.unlinkSync(out);
  log(`card image for ${banner.name}: ${crop ? crop.label : 'generic'}`);
  return file;
}

async function generateCardImages() {
  const spaces = await strapi.entityService.findMany('api::learning-space.learning-space', {
    locale: 'all',
    publicationState: 'preview',
    limit: -1,
    populate: { banner: true, bannerOther: true },
  });
  // Spaces with no card image, or one that is just a copy of the banner.
  // --regenerate-cards also redoes the ones this script generated before.
  const regenerate = process.argv.includes('--regenerate-cards');
  const todo = spaces.filter(
    (s) =>
      s.banner &&
      (!s.bannerOther ||
        s.bannerOther.id === s.banner.id ||
        (regenerate && (s.bannerOther.name || '').startsWith('card-')))
  );
  if (!APPLY) {
    log(`card images: ${todo.length} spaces would get a card image made from their banner`);
    return;
  }
  const cardByBanner = {}; // localizations often share the same banner
  for (const space of todo) {
    if (!cardByBanner[space.banner.id]) {
      cardByBanner[space.banner.id] = await makeCardImage(space.banner);
    }
    await strapi.entityService.update('api::learning-space.learning-space', space.id, {
      data: { bannerOther: cardByBanner[space.banner.id].id },
    });
  }
  log(
    `card images: ${Object.keys(cardByBanner).length} generated for ${todo.length} spaces`
  );
}

// ---------------------------------------------------------------------------
// 4. Progress
// ---------------------------------------------------------------------------
async function migrateProgress() {
  const progresses = await strapi.db.query('api::progress.progress').findMany({
    where: { unit: null, moduleId: { $notNull: true } },
    populate: { learning_space: true },
  });
  let linked = 0;
  const unmatched = [];
  for (const p of progresses) {
    const locale = p.learning_space && p.learning_space.locale;
    const moduleWhere = { uid: p.moduleId };
    if (locale) moduleWhere.locale = locale;
    const mod = await strapi.db.query('api::module.module').findOne({ where: moduleWhere });
    if (!mod) {
      unmatched.push(p.id);
      continue;
    }
    const unitUid = p.topicId || `${p.moduleId}-main`;
    const unit = await strapi.db
      .query('api::unit.unit')
      .findOne({ where: { uid: unitUid, module: mod.id } });
    if (!unit) {
      unmatched.push(p.id);
      continue;
    }
    await strapi.db
      .query('api::progress.progress')
      .update({ where: { id: p.id }, data: { module: mod.id, unit: unit.id } });
    linked++;
  }
  log(`progress: ${linked} linked to the new units, ${unmatched.length} without a match`);
  if (unmatched.length) log(`progress: unmatched ids: ${unmatched.join(', ')}`);
}

// ---------------------------------------------------------------------------
async function main() {
  const strapiFactory = require('@strapi/strapi');
  const appDir = path.resolve(__dirname, '..');
  const app = await strapiFactory({ appDir, distDir: path.join(appDir, 'dist') }).load();
  app.log.level = 'error';

  log(APPLY ? 'APPLY mode: changes will be saved' : 'DRY RUN: changes will be rolled back');
  const knex = strapi.db.connection;

  try {
    // strapi.db.transaction makes every query (db.query, entityService) use the
    // same transaction, so a dry run can roll everything back.
    await strapi.db.transaction(async ({ trx }) => {
      await migrateTranslations(trx);
      await addNewTranslations();
      await migrateForums();
      await generateCardImages();
      await migrateProgress();
      if (!APPLY) throw new DryRun();
    });
    log('done');
  } catch (e) {
    if (e instanceof DryRun) log('dry run finished, nothing saved');
    else {
      console.error(e);
      process.exitCode = 1;
    }
  }
  await app.destroy();
  process.exit();
}

main();
