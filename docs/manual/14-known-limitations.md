# 14. Known limitations

Things that don't work the way you might expect, with a workaround for each. Most are candidates for future improvements.

## Content

**Module `content`, unit `menuTitle`, lesson `shortTitle` and video `transcript` are not used.**
Changing them has no effect on the site.

Draft modules, units and lessons of a published course are hidden from learners and don't count for completion or the certificate.

## Languages

**Enrolling, payments, completion and certificates use the course's default-language version.**
If, for example, only the English version of a Catalan-default course has a product, the course is free.
*Workaround:* keep the default-language version complete (modules, units and lessons with the same structure, product, certificate) and link the same relations in every language.

Courses that exist in only one language are shown in that language to everyone ([6](06-learning-spaces.md#who-can-see-a-course)).

## Visibility and access

**The `public` setting only hides the catalogue card.**
Anyone with a course's address can open its landing page and see its outline (module, unit and lesson titles), but not the content of units and lessons. This is on purpose, so a course can be shared by sending its link.

## Completion and certificates

Monitoring modules don't count for the certificate (nor for the progress bar).

## Emails and payments

**Notification emails need two technical settings.**
Forum notifications, reviews, announcements and reminders are only created when the server has `NOTIFICATIONS_ENABLED=true`, and sent by a task that runs every 5 minutes only with `CRON_ENABLED=true`. Without the second one they stay *pending* in **Notification**.

If Stripe refuses a product change (price, name), saving the product fails with Stripe's message and nothing is changed.

**Private messages between learners are switched off** on the site, even though the profile setting exists.
