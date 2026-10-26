# 14. Known limitations

Things that don't work the way you might expect, with a workaround for each. Most are candidates for future improvements.

## Content

**Unpublishing a module, unit or lesson doesn't hide it.**
Only the course's own draft/published status is checked. Pages inside a published course are shown even when they are drafts.
*Workaround:* remove the page from its parent's list (unit from module, lesson from unit) to hide it.

**Module `content`, unit `menuTitle`, lesson `shortTitle`, video `transcript` and the course fields `modules`, `users` and `global` are not used.**
Changing them has no effect on the site.

**At most 250 interface texts are loaded.**
The site reads the first 250 **Translation** keys. There are about 150 today.

## Languages

**Enrolling, payments, completion and certificates use the course's default-language version.**
If, for example, only the English version of a Catalan-default course has a product, the course is free.
*Workaround:* keep the default-language version complete (modules, units and lessons with the same structure, product, certificate) and link the same relations in every language.

**The dashboard only lists courses that exist in the learner's current language.**
*Workaround:* translate the course (at least the learning space entry) into every language the site offers.

**The course managers' Admin tab shows titles in English.**

## Visibility and access

**The `public` setting only hides the catalogue card.**
Anyone with a course's address can open its landing page and see its outline (module, unit and lesson titles), but not the content of units and lessons.

## Completion and certificates

**A Monitoring module with lesson-less units blocks the certificate.**
Those units can't be marked as completed but still count as pending.
*Workaround:* in courses with a certificate, give monitoring units at least one lesson, or use Content modules.

**Certificates are not regenerated.**
A design change, or a name correction, only applies to certificates issued afterwards.
*Workaround:* delete the learner's **UserCertificate** entry ([10](10-certificates.md#testing-a-design)).

## Emails and payments

**A missing email template for a language makes the email fail.**
*Workaround:* create both templates for every enabled language ([5](05-emails.md)).

**Price changes are not checked against Stripe.**
If updating Stripe fails, the admin panel doesn't show an error.
*Workaround:* after changing a product, check it in the Stripe dashboard.

**Private messages between learners are switched off** on the site, even though the profile setting exists.
