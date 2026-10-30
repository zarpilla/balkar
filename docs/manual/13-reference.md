# 13. All content types at a glance

**Who creates it**: *Admin* = you, in the admin panel; *Platform* = created automatically by the site; *Learner* = created by learners' actions.

**Edit?**: ✅ normal admin work · ⚠️ only in the cases described in the chapter · ⛔ leave alone.

| Content type | What it is | Who creates it | Edit? | Translatable | Draft/publish | Chapter |
|---|---|---|---|---|---|---|
| **Administration** | Site settings: logos, theme, default language, public home, email settings | Admin | ✅ | – | – | [3](03-site-settings.md) |
| **Theme** | CSS colour theme for the site or a course | Admin | ✅ | – | – | [3](03-site-settings.md#theme-colours) |
| **Translation** | Fixed texts of the site | Admin | ✅ | ✓ | – | [4](04-translations.md) |
| **Email Template** | Texts of the emails sent to learners | Admin | ✅ | ✓ | – | [5](05-emails.md) |
| **Learning space** | A course | Admin | ✅ | ✓ | ✓ | [6](06-learning-spaces.md) |
| **Module** | Section of a course (left-hand menu) | Admin | ✅ | ✓ | ✓ | [7](07-course-structure.md) |
| **Unit** | Page inside a module | Admin | ✅ | ✓ | ✓ | [7](07-course-structure.md) |
| **Lesson** | Page inside a unit; also public and certificate lessons | Admin | ✅ | ✓ | ✓ | [7](07-course-structure.md) |
| **Quiz** | Multiple-choice questions for a Quiz block | Admin | ✅ | ✓ | ✓ | [8](08-content-blocks.md#quiz) |
| **Subtitle** | Video subtitles (WebVTT) and transcript | Admin | ✅ | ✓ | – | [8](08-content-blocks.md#subtitles-and-transcripts) |
| **Forum** | A course's forum | Admin | ✅ | ✓ | – | [9](09-forum.md) |
| **Channel** | A topic in a forum | Admin | ✅ | ✓ | – | [9](09-forum.md) |
| **Message** | A forum message | Learner | ⚠️ moderation | – | – | [9](09-forum.md#moderating) |
| **Mention** | (not used) | – | ⛔ | – | – | – |
| **Quiz attempt** | A learner's answers and score for a quiz | Platform | ⛔ | – | – | [12](12-progress-managers.md#quiz-results) |
| **Announcement** | A message from a course manager to the enrolled learners | Platform (Admin tab) | ⛔ | – | – | [12](12-progress-managers.md#announcements) |
| **Notification** | Email queue: mentions, replies, reviews, announcements, reminders | Platform | ⛔ | – | – | [5](05-emails.md#notifications) |
| **User Channel Read** | Last message read per learner and channel | Platform | ⛔ | – | – | [9](09-forum.md) |
| **Certificate** | Certificate design | Admin | ✅ | – | – | [10](10-certificates.md) |
| **UserCertificate** | A certificate issued to a learner | Platform | ⚠️ delete to regenerate | – | – | [10](10-certificates.md#testing-a-design) |
| **CertificatePayment** | Paid (or waived) certificate for an email + course | Platform / Admin | ⚠️ to waive the fee | – | – | [10](10-certificates.md#paid-certificates) |
| **Product** | A price in Stripe | Admin | ✅ | – | ✓ | [11](11-enrollment-payments.md#paid-courses-and-stripe) |
| **PaymentIntent** | Stripe events and payment-page sessions | Platform | ⛔ | – | – | [11](11-enrollment-payments.md#what-happens-when-a-learner-pays) |
| **PreEnrollement** | "Enroll this email in this course when they log in" | Platform / Admin | ⚠️ to invite | – | – | [11](11-enrollment-payments.md#enrolling-someone-yourself) |
| **Enrollment** | A learner enrolled in a course | Platform / Admin | ⚠️ to add or remove | – | – | [11](11-enrollment-payments.md#enrolling-in-a-course) |
| **User** | A learner account | Learner | ⚠️ confirm, block, manager, name | – | – | [11](11-enrollment-payments.md#the-user-entry) |
| **UserAvatar** | A learner's profile picture | Learner | ⛔ | – | – | [11](11-enrollment-payments.md) |
| **Interest** | (not used at the moment) | – | ⛔ | – | – | – |
| **Progress** | A page completed by a learner | Learner | ⛔ | – | – | [12](12-progress-managers.md) |
| **Bookmark** | A page bookmarked by a learner | Learner | ⛔ | – | – | [12](12-progress-managers.md) |
| **Submission** | A file uploaded by a learner | Learner | ⚠️ review | – | – | [12](12-progress-managers.md#submissions) |
| **SpaceManager** | Gives a manager the Admin tab of a course | Admin | ✅ | – | – | [12](12-progress-managers.md#course-managers) |

## Components

Components are groups of fields inside an entry. They don't appear as content types in the menu.

| Component | Used in | Chapter |
|---|---|---|
| Text, Markdown, Image, Video, Accordion, Slider, Quiz | **content** of Unit and Lesson | [8](08-content-blocks.md) |
| Footer logo | **footerLogos** of Administration | [3](03-site-settings.md) |
