# Course administrator manual

This manual is for the people who run courses on the e-learning platform shared by two sites:

| Site | Learners use | Administrators use |
|---|---|---|
| **URR**: Urban Resilience Research Network | <https://edu.urbanresilienceresearch.net> | <https://api.urbanresilienceresearch.net/admin> |
| **Balkar** | <https://area.balkar.earth> | <https://api.balkar.earth/admin> |

Both sites run the same software. Everything a learner sees comes from the **Strapi admin panel**: the logo and colours, the courses and their lessons, the texts on the buttons, the emails, the certificates. Each chapter explains one part of the admin panel. It shows the admin screen and the page that learners see, and where possible the page before and after a change.

All screenshots come from the live sites. Learners' email addresses are blurred.

## Chapters

**Getting started**

1. [The platform in one page](01-overview.md): the two sites, how a course is built, glossary.
2. [Working in the Strapi admin panel](02-admin-basics.md): logging in, Content Manager, drafts, languages, the media library.

**Setting up the site**

3. [Site settings and theme](03-site-settings.md): `Administration` and `Theme`: logos, colours, language, public home page.
4. [Interface texts and languages](04-translations.md): `Translation` and the language list.
5. [Emails](05-emails.md): `Email Template` and the notification addresses.

**Building a course**

6. [Courses (learning spaces)](06-learning-spaces.md): `Learning space`: catalogue card, landing page, visibility.
7. [Course structure: modules, units and lessons](07-course-structure.md): `Module`, `Unit`, `Lesson`.
8. [Content blocks](08-content-blocks.md): text, markdown, image, video and subtitles, accordion, slider, quiz.
9. [Forum](09-forum.md): `Forum`, `Channel`, `Message`.
10. [Certificates](10-certificates.md): `Certificate` and how the PDF is laid out.

**Running a course**

11. [Learners, enrollment and payments](11-enrollment-payments.md): `User`, `Enrollment`, `PreEnrollement`, `Product`, Stripe.
12. [Following learners: progress, managers and uploads](12-progress-managers.md): `Progress`, `Bookmark`, `Submission`, `SpaceManager`, the course Admin tab.

**Reference**

13. [All content types at a glance](13-reference.md): every entity, who creates it, whether you should edit it.
14. [Known limitations](14-known-limitations.md): things that don't work the way you might expect, and how to work around them.

## Updating the screenshots

The screenshots are taken by scripts in [capture/](capture/). See [capture/README.md](capture/README.md).
