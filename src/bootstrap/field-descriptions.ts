/**
 * Help texts shown under each field in the Strapi admin edit forms
 * (Content Manager › Configure the view › field › Description).
 *
 * They are written to the Content Manager configuration on every start. A text
 * someone changed by hand in the admin is kept: only empty descriptions, or the
 * ones this file wrote before, are replaced. Texts follow docs/manual.
 */

const NOT_USED = "Not used.";
const BY_PLATFORM = "Filled in by the platform. Don't edit.";
const UID_COURSE =
  "Identifier in web addresses (/space/<uid>). Optional on creation: a short readable one (words-joined-by-hyphens) or empty for a random code. Shared by all languages. Never change it once learners use the course.";
const UID_AUTO =
  "Leave empty: generated automatically and shared by all languages. Never change it once learners use it (progress and bookmarks depend on it).";
const EMAILS = "Comma-separated addresses, e.g. ana@example.org, joan@example.org.";
const COLOR =
  "Theme colour: primary, secondary, tertiary (default) or loop (each item in turn).";

type Descriptions = Record<string, Record<string, string>>;

export const contentTypeDescriptions: Descriptions = {
  "api::administration.administration": {
    siteName: "Browser tab title and logos' alternative text. Empty: Urban Resilience Research Network.",
    logoHeader: "Logo at the top left of every page. Empty: the built-in URR logo.",
    logoFooter: "First logo in the footer. Empty: the built-in URR, UP2030 and EC logos.",
    footerLogos: "Extra footer logos (partners, funders). Only shown when Logo footer is set.",
    favicon: "Small icon in the browser tab. Empty: the built-in icon.",
    theme: "Colour theme of the whole site. A course's own theme takes priority on its pages.",
    defaultLocale: "Language for visitors who haven't chosen one, e.g. ca or en. Also the version used for enrolling, payments and certificates when a course isn't translated. Empty: en.",
    publicHome: "On: visitors see the course catalogue on the home page. Off: visitors are sent to the login page.",
    logo: "Logo used in the emails ({{LOGO}}). Not shown on the site.",
    paymentEmails: `Receive the periodic summary of Stripe payments. ${EMAILS}`,
    resetPasswordFrontUrl: "Start of the link in the password-reset email. Must end with /reset?code=, e.g. https://area.balkar.earth/reset?code=",
  },
  "api::theme.theme": {
    name: "Name to choose the theme in Administration or in a course.",
    styles: "CSS that overrides the --theme-* variables inside :root { … }. Variables ending in -rgb take three numbers (243, 200, 87), not #hex. Keep a copy before changing it: there is no history.",
  },
  "api::translation.translation": {
    key: "Identifier used by the site (e.g. dashboard-intro-guest). Only the English entry's key matters; other languages must be localizations of it.",
    text: "Plain text. Used when filled in.",
    textHtml: "Formatted text (bold, links, paragraphs). Used only when Text is empty.",
  },
  "api::email-template.email-template": {
    type: "Which email this is. Every language needs email_confirmation and reset_password; the others are optional (built-in texts are used).",
    subject: "Email subject. Placeholders are not replaced here.",
    content: "Email body in HTML. Placeholders: {{NAME}}, {{USER}}, {{EMAIL}}, {{URL}}, {{LOGO}}; and depending on the type {{SITE}}, {{FOOTER}}, {{ITEMS}}, {{COURSE}}, {{SUBJECT}}, {{TEXT}}, {{COMPLETED}}, {{TOTAL}}.",
  },
  "api::learning-space.learning-space": {
    name: "Course title: catalogue card, landing page and course banner.",
    nameMore: "Subtitle under the title on the catalogue card.",
    uid: UID_COURSE,
    bannerOther: "Catalogue card image (about 5:4). Empty: the card shows only text.",
    bannerIntro: "Large image at the top of the landing page. Without it the top area, including the Enroll / Pay button, is not shown.",
    banner: "Narrow banner at the top of every course page. Hidden if empty.",
    publicLesson: "Lesson shown as the landing page body (a preview of the course). Don't add it to a unit.",
    publicDescription: "Shown on the landing page only when there is no public lesson, and only to logged-in learners not yet enrolled. Prefer the public lesson.",
    privateDescription: "Welcome text for enrolled learners. Rarely seen: the first module opens automatically.",
    content_modules: "The course modules, in left-hand menu order. Drag to reorder.",
    forum: "Adds the Community tab. Link a forum in every language.",
    certificate: "Certificate design. Adds the Certificate tab.",
    certificateLesson: "Lesson shown on the certificate page above the download button (e.g. the requirements).",
    certificateProduct: "Makes the certificate paid: learners pay this product before downloading.",
    product: "Makes the course paid: learners pay before enrolling. Link it in every language.",
    free: "Only chooses the label free course / paid course. The product decides whether it is paid.",
    public: "On: the card appears in the catalogue for everyone. Off: only for enrolled learners (the landing page still works with its link).",
    theme: "Colour theme for this course's pages only, on top of the site theme.",
    enrollmentEmails: `Notified of every new enrollment. ${EMAILS}`,
    reminderDays: "Email learners who stopped for this many days without finishing (e.g. 14). Empty: no reminders.",
    users: NOT_USED,
    global: NOT_USED,
  },
  "api::module.module": {
    menuTitle: "Entry in the course's left-hand menu.",
    shortTitle: "Small uppercase heading above the page content (MODULE › UNIT).",
    title: "Shown on the Progress and Bookmarks pages and in the managers' statistics.",
    units: "The module's units, in order. Drag to reorder.",
    learning_space: "The course this module belongs to.",
    moduleType: "Content: normal. Monitoring: follow-up activities; lesson-less units have no Mark as completed button and the module doesn't count for progress. Don't combine Monitoring with a certificate.",
    uploadFiles: "Shows a file upload box on the module's pages so learners can hand in work (reviewed in the course's Admin › Submissions).",
    content: "Not shown on the site. Put introductory content in the first unit.",
    uid: UID_AUTO,
  },
  "api::unit.unit": {
    title: "Page heading, menu entry under the open module, Progress, Bookmarks and Previous / Next buttons.",
    shortTitle: "Small heading (MODULE › UNIT) when one of its lessons is open.",
    content: "Content blocks of the page, followed by links to its lessons.",
    lessons: "The unit's lessons, in order. With lessons, the unit is completed when they all are; without, it has its own Mark as completed button.",
    module: "The module this unit belongs to.",
    menuTitle: NOT_USED,
    uid: UID_AUTO,
  },
  "api::lesson.lesson": {
    title: "Page heading, menu entry, Progress and Bookmarks.",
    content: "Content blocks of the page.",
    unit: "The unit it belongs to. A lesson in no unit is not part of the course (use it as public or certificate lesson).",
    shortTitle: NOT_USED,
    uid: UID_AUTO,
  },
  "api::quiz.quiz": {
    title: "Only to find the quiz in the admin list. Not shown on the site.",
    introduction: "Text above the questions.",
    questions: "The questions. Tick correct on the right options; Answer is the explanation shown after submitting.",
    minToPass: "Percentage of correct answers needed to pass (e.g. 70). Empty: every answer must be correct. While not passed, Mark as completed stays disabled.",
    uid: UID_AUTO,
  },
  "api::subtitle.subtitle": {
    name: "Name to find it in the list; also used in the transcript file name.",
    text: "Subtitles in WebVTT format (starts with WEBVTT). Add each language as a localization of this entry.",
    transcript: "Plain-text transcript that learners can download.",
  },
  "api::forum.forum": {
    name: "Forum name.",
    description: "Shown at the top of the forum page.",
    learning_space: "The course (in this language) this forum belongs to.",
    channels: "The forum's channels (topics).",
    uid: UID_AUTO,
  },
  "api::channel.channel": {
    name: "Channel (topic) name.",
    order: "Position in the list: lower numbers first.",
    forum: "The forum this channel belongs to.",
    users_permissions_users: "Empty: every learner enrolled in the course sees the channel. With learners selected: only they see it (working groups).",
    uid: "Leave empty. Shared by all languages, so everyone reads the same conversation.",
  },
  "api::message.message": {
    text: "Message written by the learner. To remove an inappropriate message, delete the entry (check its replies too).",
    children: "Replies to this message.",
    parent: "The message this one replies to.",
    message_order: BY_PLATFORM,
  },
  "api::certificate.certificate": {
    name: "Name to choose the design in a course.",
    background: "Fills the whole A4 landscape page (842 × 595 points), e.g. a 3508 × 2480 px image with logos, borders and fixed texts.",
    color: "Colour of all texts as hex, e.g. #020034. Empty: black.",
    to_x: "Learner's name: points from the left edge. To centre on the page: x = 50 and align center.",
    to_y: "Learner's name: points from the top edge.",
    to_fontsize: "Learner's name: size (default 30).",
    to_align: "left, center or right, between x and the right margin.",
    to_font: "font1 = Inter, font2 = Lora italic.",
    course: "Print the course name.",
    course_x: "Course name: points from the left edge.",
    course_y: "Course name: points from the top edge.",
    course_fontsize: "Course name: size (default 20).",
    course_align: "left, center or right, between x and the right margin.",
    course_font: "font1 = Inter, font2 = Lora italic.",
    date_x: "Issue date (dd/mm/yyyy): points from the left edge.",
    date_y: "Issue date: points from the top edge.",
    date_fontsize: "Issue date: size (default 15).",
    date_align: "left, center or right, between x and the right margin.",
    date_font: "font1 = Inter, font2 = Lora italic.",
    hours: "Printed as written, e.g. 12 hours. Empty: not printed.",
    hours_x: "Hours: points from the left edge.",
    hours_y: "Hours: points from the top edge.",
    hours_fontsize: "Hours: size (default 15).",
    hours_align: "left, center or right, between x and the right margin.",
    hours_font: "font1 = Inter, font2 = Lora italic.",
    qr_x: "QR code with the verification link: top-left corner, points from the left edge. Empty: no QR code.",
    qr_y: "QR code: points from the top edge.",
    qr_size: "QR code size in points (default 80).",
  },
  "api::user-certificate.user-certificate": {
    code: "Verification code, checked at /verify/<code>.",
    filename: "The PDF is at <api address>/certificates/<filename>.pdf.",
    issuedTo: "Name printed on the certificate. Downloading again after the learner fixes their name regenerates it.",
    signature: BY_PLATFORM,
  },
  "api::certificate-payment.certificate-payment": {
    email: "Learner's email.",
    uid: "Course uid.",
    payment: "Ticked: the certificate is paid (or waived), download unlocked. To give one for free, create an entry with email, uid and this ticked.",
  },
  "api::product.product": {
    name: "Shown on the Stripe payment page.",
    description: "Shown on the Stripe payment page.",
    image: "Shown on the Stripe payment page.",
    price: "In euros, e.g. 49.00. A new price applies to new payments only.",
    paymentEmails: `Notified right after each payment. ${EMAILS}`,
    stripeProductId: "Filled in automatically on save. Don't edit.",
    stripePriceId: "Filled in automatically on save. Don't edit.",
  },
  "api::pre-enrollement.pre-enrollement": {
    email: "When someone logs in or registers with this email, they are enrolled and this entry is deleted.",
    uid: "Course uid.",
    payment: "Required for paid courses: without it the pre-enrollment is ignored. Tick it to invite someone to a paid course for free.",
  },
  "api::enrollment.enrollment": {
    users_permissions_user: "The learner.",
    learning_space: "The course, in its default-language version. Delete the enrollment to remove someone (their progress is kept).",
  },
  "api::space-manager.space-manager": {
    user: "Account with manager ticked. It must also be enrolled in the course.",
    learning_space: "Course whose Admin tab this manager sees.",
  },
  "api::submission.submission": {
    moduleId: "uid of the module the file was uploaded to.",
    feedback: "Manager's comment, shown to the learner (who gets an email).",
    grade: "Free text, e.g. 9/10 or Pass.",
  },
  "api::progress.progress": {
    topicId: "Old progress (before October 2026). Not used.",
    moduleId: "Old progress (before October 2026). Not used.",
  },
  "api::payment-intent.payment-intent": {
    state: "intent: payment page opened · received: paid · handled: included in a summary email · error.",
  },
  "api::notification.notification": {
    status: "sent, cancelled (reason in error) or failed.",
  },
  "api::announcement.announcement": {
    text: "Written by a course manager in the course's Admin tab. Don't edit here.",
  },
  "api::interest.interest": { name_ca: NOT_USED, name_en: NOT_USED },
  "api::mention.mention": { message: BY_PLATFORM },
  "plugin::users-permissions.user": {
    name: "Shown in the header and the forum, and printed on the certificate.",
    lastname: "Shown in the header and the forum, and printed on the certificate.",
    email: "Used to log in.",
    confirmed: "Ticked once the learner clicked the confirmation link. Tick it yourself if the email never arrived.",
    blocked: "Prevents the learner from logging in.",
    locale: "Language of their emails. Updated when they change language on the site.",
    manager: "Teacher / course manager: Teacher badge in the forum, and the course Admin tab when there is also a SpaceManager entry.",
    emailNotifications: "Off: no emails about mentions, replies and reminders (set by the learner in their profile).",
    role: "Leave it as Authenticated.",
    organization: "Filled in by the learner in their profile.",
    occupation: "Filled in by the learner in their profile.",
    nationality: "Filled in by the learner in their profile.",
    age: "Filled in by the learner in their profile.",
    motivation: "Filled in by the learner in their profile.",
    location: NOT_USED,
    country: NOT_USED,
    interests: NOT_USED,
    allowPrivateMessages: NOT_USED,
    avatar: NOT_USED,
    learning_spaces: NOT_USED,
  },
};

export const componentDescriptions: Descriptions = {
  "content.text": {
    title: "Heading above the text (optional).",
    text: "Paragraphs, headings, lists, quotes, links (they open in a new tab).",
  },
  "content.markdown": {
    title: "Heading (optional).",
    text: "Markdown, may include HTML. Links to media files (/uploads/…) work as they are. For new content the Text block is easier.",
  },
  "content.image": {
    caption: "Text under the picture. Empty: the media library caption.",
    alternativeText: "Description for screen readers. Empty: the media library one.",
    cssClass: "Optional styling. certificate-image: white framed card with shadow.",
  },
  "content.video": {
    title: "Shown on the thumbnail, with the course name and unit title.",
    thumbnail: "Image shown before playing.",
    overlay: "Tint over the thumbnail: green (primary, default), yellow (secondary) or blue (light accent, dark text).",
    video: "Uploaded video file.",
    url: "Used when Video is empty: an embed address, e.g. https://www.youtube.com/embed/VIDEO_ID or https://player.vimeo.com/video/123456 (a normal YouTube page address doesn't work).",
    subtitle: "Subtitle entry with the subtitles in each language and the transcript.",
    transcript: "Not used: the transcript comes from the Subtitle entry.",
  },
  "content.accordion": {
    items: "Each has a title (always visible) and a text (shown when opened).",
    color: COLOR,
  },
  "content.slider": {
    title: "Shown on every slide.",
    items: "The slides.",
    color: `${COLOR} With loop, a slide's own colour overrides its turn.`,
  },
  "content.quiz": {
    quiz: "The Quiz entry to show.",
  },
  "sub.slider-item": {
    imageSize: "cover: fills the slide · contain: whole image · initial: real size.",
    image: "Background image.",
    logo: "Logo shown on top.",
    color: "This slide's colour (used with loop on the slider).",
  },
  "sub.quiz-item": {
    title: "Shown as 1. Title.",
    question: "The question text.",
    answer: "Explanation shown after the learner submits.",
  },
  "sub.quiz-question-item": {
    correct: "Tick the right options.",
  },
  "site.footer-logo": {
    url: "Opens in a new tab.",
    alt: "Alternative text of the logo.",
  },
};

const APPLIED_KEY = "field_descriptions";

export async function setFieldDescriptions(strapi: any) {
  const appliedStore = strapi.store({ type: "core", name: "admin_help", key: APPLIED_KEY });
  const applied: Record<string, string> = (await appliedStore.get()) || {};
  const nowApplied: Record<string, string> = {};
  let changed = 0;

  const apply = async (kind: "content_types" | "components", uid: string, texts: Record<string, string>) => {
    const store = strapi.store({ type: "plugin", name: "content_manager", key: `configuration_${kind}::${uid}` });
    const config = await store.get();
    if (!config?.metadatas) return;
    let dirty = false;
    for (const [field, text] of Object.entries(texts)) {
      const edit = config.metadatas[field]?.edit;
      if (!edit) continue;
      const id = `${uid}.${field}`;
      nowApplied[id] = text;
      const current = edit.description || "";
      // Keep texts changed by hand in the admin.
      if (current === text || (current && current !== applied[id])) continue;
      edit.description = text;
      dirty = true;
      changed++;
    }
    if (dirty) await store.set({ value: config });
  };

  for (const [uid, texts] of Object.entries(contentTypeDescriptions)) await apply("content_types", uid, texts);
  for (const [uid, texts] of Object.entries(componentDescriptions)) await apply("components", uid, texts);

  await appliedStore.set({ value: nowApplied });
  if (changed) strapi.log.info(`Field help texts: ${changed} updated`);
}
