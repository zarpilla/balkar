'use strict';

/**
 * Balkar (branch main) -> mooc.
 *
 * On main, `translations` had one row per key with `ca`, `en`, `ca_html`,
 * `en_html` columns. On mooc it is localized (`locale`, `text`, `text_html`),
 * and Strapi drops the old columns when it syncs the schema, right after this
 * migration. It also drops any table it does not know, so the old values are
 * saved as JSON in strapi_core_store_settings (key below), which Strapi keeps.
 * scripts/migrate-from-main.js rebuilds the localized rows from it.
 *
 * Does nothing on databases that already have the mooc structure.
 */
const BACKUP_KEY = 'migration_main_translations';

module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('translations'))) return;
    if (!(await knex.schema.hasColumn('translations', 'ca'))) return;
    if (await knex('strapi_core_store_settings').where({ key: BACKUP_KEY }).first()) return;

    const rows = await knex('translations')
      .select('id', 'key', 'ca', 'en', 'ca_html', 'en_html')
      .orderBy('id');

    await knex('strapi_core_store_settings').insert({
      key: BACKUP_KEY,
      value: JSON.stringify(rows),
      type: 'object',
      environment: null,
      tag: null,
    });
  },
};
