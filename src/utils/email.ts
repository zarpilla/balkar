/**
 * Email templates with a fallback chain, so a missing translation never stops an email:
 * Email Template in the learner's language → in the site's default language → in English →
 * the built-in text below.
 */

declare const strapi: any;

export type TemplateType =
  | "email_confirmation"
  | "reset_password"
  | "notification_digest"
  | "announcement"
  | "course_reminder";

export const escapeHtml = (text: any) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Plain text → HTML paragraphs (escaped, newlines kept). */
export const textToHtml = (text: string) =>
  escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

const layout = (body: string) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:600px">
{{LOGO_BLOCK}}
${body}
<p style="font-size:12px;color:#777;margin-top:32px">{{FOOTER}}</p>
</div>`;

const button = (label: string) =>
  `<p><a href="{{URL}}" style="display:inline-block;padding:10px 18px;background:#222;color:#fff;text-decoration:none;border-radius:4px">${label}</a></p>`;

/** Built-in templates: used only when no Email Template entry exists for the type. */
const BUILT_IN: Record<string, Record<string, { subject: string; content: string }>> = {
  notification_digest: {
    en: {
      subject: "News in your courses on {{SITE}}",
      content: layout(`<p>Hello {{NAME}},</p><p>Here is what happened while you were away:</p>{{ITEMS}}`),
    },
    ca: {
      subject: "Novetats als teus cursos a {{SITE}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Això és el que ha passat mentre no hi eres:</p>{{ITEMS}}`),
    },
    es: {
      subject: "Novedades en tus cursos en {{SITE}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Esto es lo que ha pasado mientras no estabas:</p>{{ITEMS}}`),
    },
  },
  announcement: {
    en: {
      subject: "{{COURSE}}: {{SUBJECT}}",
      content: layout(`<p>Hello {{NAME}},</p><p>A message from the team of <strong>{{COURSE}}</strong>:</p><h2 style="font-size:18px">{{SUBJECT}}</h2>{{TEXT}}${button("Go to the course")}`),
    },
    ca: {
      subject: "{{COURSE}}: {{SUBJECT}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Un missatge de l'equip de <strong>{{COURSE}}</strong>:</p><h2 style="font-size:18px">{{SUBJECT}}</h2>{{TEXT}}${button("Ves al curs")}`),
    },
    es: {
      subject: "{{COURSE}}: {{SUBJECT}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Un mensaje del equipo de <strong>{{COURSE}}</strong>:</p><h2 style="font-size:18px">{{SUBJECT}}</h2>{{TEXT}}${button("Ir al curso")}`),
    },
  },
  course_reminder: {
    en: {
      subject: "Continue {{COURSE}}",
      content: layout(`<p>Hello {{NAME}},</p><p>You have completed {{COMPLETED}} of {{TOTAL}} pages of <strong>{{COURSE}}</strong>. Pick up where you left off:</p>${button("Continue the course")}`),
    },
    ca: {
      subject: "Continua {{COURSE}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Has completat {{COMPLETED}} de {{TOTAL}} pàgines de <strong>{{COURSE}}</strong>. Continua on ho vas deixar:</p>${button("Continua el curs")}`),
    },
    es: {
      subject: "Continúa {{COURSE}}",
      content: layout(`<p>Hola {{NAME}},</p><p>Has completado {{COMPLETED}} de {{TOTAL}} páginas de <strong>{{COURSE}}</strong>. Sigue donde lo dejaste:</p>${button("Continuar el curso")}`),
    },
  },
};

/** Footer of notification emails (where to switch them off). */
const FOOTER: Record<string, string> = {
  en: 'You receive this email because you are enrolled in a course on {{SITE}}. <a href="{{SETTINGS_URL}}">Email settings</a>',
  ca: 'Reps aquest correu perquè estàs inscrit/a en un curs de {{SITE}}. <a href="{{SETTINGS_URL}}">Preferències de correu</a>',
  es: 'Recibes este correo porque estás inscrito/a en un curso de {{SITE}}. <a href="{{SETTINGS_URL}}">Preferencias de correo</a>',
};

/** Short texts used inside the notification digest. */
export const STRINGS: Record<string, Record<string, string>> = {
  en: {
    mention: "{{FROM}} mentioned you in {{WHERE}}",
    reply: "{{FROM}} replied to your message in {{WHERE}}",
    review: "Your submission in {{WHERE}} has been reviewed",
    grade: "Grade",
    open: "Open",
  },
  ca: {
    mention: "{{FROM}} t'ha mencionat a {{WHERE}}",
    reply: "{{FROM}} ha respost el teu missatge a {{WHERE}}",
    review: "La teva entrega a {{WHERE}} ha estat revisada",
    grade: "Nota",
    open: "Obre",
  },
  es: {
    mention: "{{FROM}} te ha mencionado en {{WHERE}}",
    reply: "{{FROM}} ha respondido a tu mensaje en {{WHERE}}",
    review: "Tu entrega en {{WHERE}} ha sido revisada",
    grade: "Nota",
    open: "Abrir",
  },
};

export const t = (locale: string, key: string, vars: Record<string, string> = {}) =>
  fill((STRINGS[locale] || STRINGS.en)[key] || STRINGS.en[key] || key, vars);

const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{\{([A-Z_]+)\}\}/g, (all, name) => (name in vars ? vars[name] : all));

let siteCache: { at: number; value: any } | null = null;

/** Site name, logo and default language from Administration (cached for a minute). */
export const getSite = async () => {
  if (siteCache && Date.now() - siteCache.at < 60_000) return siteCache.value;
  const admin = await strapi.entityService.findMany("api::administration.administration", {
    populate: ["logo"],
  });
  const serverUrl = strapi.config.get("server.url");
  const frontendUrl = frontendUrlFrom(admin);
  const logo = admin?.logo?.url || "";
  let host = "";
  try {
    host = new URL(frontendUrl).host;
  } catch (e) {
    // not a valid URL
  }
  const value = {
    // Without a site name, emails use the site's address ("edu.example.org").
    name: admin?.siteName || host,
    logoUrl: !logo ? "" : /^https?:\/\//.test(logo) ? logo : `${serverUrl}${logo}`,
    defaultLocale: admin?.defaultLocale || "en",
    frontendUrl,
  };
  siteCache = { at: Date.now(), value };
  return value;
};

/** The learner site's address: FRONTEND_URL, else the origin of the reset-password page. */
const frontendUrlFrom = (admin: any) => {
  const env = process.env.FRONTEND_URL;
  if (env) return env.replace(/\/+$/, "");
  try {
    if (admin?.resetPasswordFrontUrl) return new URL(admin.resetPasswordFrontUrl).origin;
  } catch (e) {
    // not a valid URL
  }
  return String(strapi.config.get("server.url") || "").replace(/\/+$/, "");
};

/**
 * The Email Template entry for this type, trying the learner's language, the site's default
 * language and English. Null when none exists.
 */
export const findTemplate = async (type: TemplateType, locale?: string) => {
  const site = await getSite();
  const locales = [...new Set([locale, site.defaultLocale, "en"].filter(Boolean))];
  for (const loc of locales) {
    const found = await strapi.entityService.findMany("api::email-template.email-template", {
      filters: { type },
      locale: loc,
    });
    if (found?.length && found[0].content) return found[0];
  }
  return null;
};

/**
 * Builds subject and HTML for a template type. `vars` values are inserted as they are: escape
 * anything typed by users before passing it.
 */
export const renderEmail = async (type: TemplateType, locale: string, vars: Record<string, string>) => {
  const site = await getSite();
  const lang = locale || site.defaultLocale;
  const all: Record<string, string> = {
    SITE: escapeHtml(site.name),
    LOGO: site.logoUrl,
    SETTINGS_URL: `${site.frontendUrl}/account/profile`,
    LOGO_BLOCK: site.logoUrl
      ? `<p><img src="${site.logoUrl}" alt="${escapeHtml(site.name)}" style="max-height:60px"></p>`
      : "",
    ...vars,
  };
  all.FOOTER = fill(FOOTER[lang] || FOOTER.en, all);

  const template = await findTemplate(type, lang);
  const builtIn = BUILT_IN[type]?.[lang] || BUILT_IN[type]?.en;
  const subject = template?.subject || builtIn?.subject || "";
  const content = template?.content || builtIn?.content || "";
  return {
    // The subject is plain text: undo the escaping of the variables.
    subject: fill(subject, all).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
    html: fill(content, all),
  };
};

export const sendEmail = async (to: string, subject: string, html: string) =>
  strapi.plugins["email"].services.email.send({ to, subject, html });
