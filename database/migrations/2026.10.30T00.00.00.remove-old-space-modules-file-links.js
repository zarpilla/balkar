'use strict';

/**
 * The old `modules` field of learning spaces (components spaces.module /
 * spaces.topic / spaces.content) was removed on 2026-10-30, after checking
 * that all its content had been copied to the new modules and units. Strapi
 * drops the component tables but not their links to media files, so this
 * removes those links. The files stay in the media library: the new units
 * still use them (images directly, PDFs as links in the text).
 */
module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('files_related_morphs'))) return;
    await knex('files_related_morphs')
      .whereIn('related_type', ['spaces.module', 'spaces.topic', 'spaces.content'])
      .del();
  },
};
