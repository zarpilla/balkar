/**
 * uid lifecycle shared by courses, modules, units, lessons, quizzes, forums and channels.
 *
 * The uid is shared by all language versions of an entry, so it may repeat across locales, but
 * never within one locale. "Duplicate" in the admin panel copies every field of the original,
 * uid included, and also its links to the original's translations: the copy then answered the
 * original's web address (/space/<uid>) and counted its enrollments and progress. A new entry
 * whose uid already exists in its own locale (a duplicate, or a uid typed by hand that's taken)
 * gets a random uid and no translations instead. New translations keep the uid: their locale is
 * new for that uid.
 */
import { v4 as uuidv4 } from "uuid";
import { errors } from "@strapi/utils";

declare const strapi: any;

const takenInLocale = async (model: string, uid: string, locale: string | undefined, exceptId?: number) => {
  const where: any = { uid };
  if (locale) where.locale = locale;
  if (exceptId) where.id = { $ne: exceptId };
  return (await strapi.db.query(model).count({ where })) > 0;
};

export const uniqueUidLifecycles = {
  async beforeCreate(event: any) {
    const data = event.params.data;
    if (data.uid && !(await takenInLocale(event.model.uid, data.uid, data.locale))) return;
    if (data.uid) {
      strapi.log.info(
        `${event.model.uid}: uid ${data.uid} already exists in locale ${data.locale}; new entry gets a new uid`
      );
      // A duplicate isn't a translation of the original's translations.
      data.localizations = { set: [] };
    }
    data.uid = uuidv4();
  },

  async beforeUpdate(event: any) {
    const data = event.params.data;
    const id = event.params.where?.id;
    if (!data?.uid || !id) return;
    const current = await strapi.db.query(event.model.uid).findOne({ where: { id }, select: ["uid", "locale"] });
    if (!current || current.uid === data.uid) return;
    if (await takenInLocale(event.model.uid, data.uid, current.locale, id)) {
      throw new errors.ValidationError(
        `The uid "${data.uid}" is already used by another entry in this language. Leave the original uid or choose another one.`
      );
    }
  },
};
