'use strict';

/**
 * Progress from the old course content (before October 2026) was stored by
 * `moduleId` / `topicId`. scripts/migrate-from-main.js linked it to the new
 * modules and units, but only looked in the language version of the course the
 * progress was saved with. On Balkar, some topics had a different id in each
 * language, and learners who followed the English version had their progress
 * saved on the Catalan course: 28 entries (9 learners) were left unlinked and
 * stopped showing. This links them to the unit with that uid in any language.
 *
 * The remaining unlinked entries point to topics that no longer exist (or to
 * module-level completion of modules that have topics, which never counted);
 * they are deleted. Then Strapi drops the `moduleId` / `topicId` columns.
 *
 * Runs before the schema sync, while the old columns still exist.
 */
module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasColumn('progresses', 'topic_id'))) return;

    const unlinked = await knex('progresses as p')
      .select('p.id', 'p.module_id', 'p.topic_id')
      .where((q) => q.whereNotNull('p.module_id').orWhereNotNull('p.topic_id'))
      .whereNotExists(knex('progresses_unit_links').whereRaw('progress_id = p.id'))
      .whereNotExists(knex('progresses_lesson_links').whereRaw('progress_id = p.id'));

    const orphans = [];
    for (const p of unlinked) {
      const unitUid = p.topic_id || `${p.module_id}-main`;
      const match = await knex('units as u')
        .join('units_module_links as um', 'um.unit_id', 'u.id')
        .join('modules as m', 'm.id', 'um.module_id')
        .where({ 'u.uid': unitUid, 'm.uid': p.module_id })
        .select('u.id as unit_id', 'm.id as module_id')
        .orderBy('u.id')
        .first();
      if (!match) {
        orphans.push(p.id);
        continue;
      }
      await knex('progresses_unit_links').insert({ progress_id: p.id, unit_id: match.unit_id });
      await knex('progresses_module_links').where({ progress_id: p.id }).del();
      await knex('progresses_module_links').insert({ progress_id: p.id, module_id: match.module_id });
    }

    if (orphans.length) {
      for (const table of [
        'progresses_learning_space_links',
        'progresses_users_permissions_user_links',
        'progresses_module_links',
      ]) {
        await knex(table).whereIn('progress_id', orphans).del();
      }
      await knex('progresses').whereIn('id', orphans).del();
    }
    console.log(
      `[migration] old progress: ${unlinked.length - orphans.length} linked, ${orphans.length} deleted`
    );
  },
};
