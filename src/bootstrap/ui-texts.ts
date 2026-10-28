/**
 * Creates the interface texts (Translation entries) used by new features, from the JSON files in
 * ./ui-texts ({ "key": { "en": "...", "ca": "...", "es": "..." } }).
 *
 * Only missing entries are created: texts edited in the admin panel are never overwritten.
 * Languages not enabled on the site are skipped; the site falls back to English for them.
 */

import fs from "fs";
import path from "path";

declare const strapi: any;

const UID = "api::translation.translation";

const loadTexts = (): Record<string, Record<string, string>> => {
  const dir = path.join(__dirname, "ui-texts");
  if (!fs.existsSync(dir)) return {};
  const texts = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    Object.assign(texts, JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  }
  return texts;
};

export const seedUiTexts = async () => {
  try {
    const texts = loadTexts();
    const keys = Object.keys(texts);
    if (!keys.length) return;

    const enabled: string[] = (await strapi.plugin("i18n").service("locales").find()).map(
      (l: any) => l.code
    );
    if (!enabled.includes("en")) return; // the site reads keys from the English entries

    const existing = await strapi.entityService.findMany(UID, {
      filters: { key: { $in: keys } },
      fields: ["key", "locale"],
      populate: { localizations: { fields: ["locale"] } },
      locale: "en",
      limit: -1,
    });
    const byKey = new Map<string, any>(existing.map((t: any) => [t.key, t]));

    let created = 0;
    for (const key of keys) {
      let en = byKey.get(key);
      if (!en) {
        if (!texts[key].en) continue;
        en = await strapi.entityService.create(UID, {
          data: { key, text: texts[key].en, locale: "en" },
          populate: ["localizations"],
        });
        created++;
      }
      const have = new Set((en.localizations || []).map((l: any) => l.locale));
      for (const locale of enabled) {
        if (locale === "en" || have.has(locale) || !texts[key][locale]) continue;
        // Keys are unique across languages; the site only reads the English entry's key, so
        // the other language versions get "<key>-<locale>".
        // All the existing versions must be listed, or the links to the others are dropped.
        const siblings = [en.id, ...(en.localizations || []).map((l: any) => l.id)];
        const created_ = await strapi.entityService.create(UID, {
          data: { key: `${key}-${locale}`, text: texts[key][locale], locale, localizations: siblings },
          populate: ["localizations"],
        });
        en.localizations = [...(en.localizations || []), { id: created_.id, locale }];
        created++;
      }
    }
    if (created) console.log(`Created ${created} interface text(s)`);
  } catch (error) {
    console.error("Could not create interface texts", error);
  }
};
