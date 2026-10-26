# 12. Following learners: progress, managers and uploads

> Content types: **Progress**, **Bookmark**, **Submission**, **SpaceManager**

## What learners see

Each time a learner clicks *Mark as completed*, a **Progress** entry is saved. The platform uses these entries for:

- the progress bar under the course banner and the check marks in the menu,
- the **Progress** tab, listing every module, unit and lesson with its status,
- unlocking the **certificate** when everything is completed.

![The Progress tab](images/12-progress-managers/urr-progress.png)

With *Bookmark this page* learners save pages to find them later in the **Bookmarks** tab (**Bookmark** entries).

![The Bookmarks tab](images/12-progress-managers/urr-bookmarks.png)

You don't need to create or edit Progress or Bookmark entries. If a learner completed a page by mistake, they can click *Mark as not completed* themselves.

## Course managers

A **course manager** (teacher, tutor) is a learner account that also sees the course's statistics in an extra **Admin** tab. It needs three things:

1. In **User**, tick **manager** on their account.
2. Create a **SpaceManager** entry with that **user** and the **learning space**.
3. The manager must also be **enrolled** in the course (the tabs are only shown to enrolled accounts).

![SpaceManager entry](images/12-progress-managers/urr-admin-spacemanager.png)

The **Admin** tab has two views:

- **Users Progress**: every enrolled learner with their overall percentage and, for each module, unit and lesson, whether and when they completed it.
- **Content Progress**: for each module, unit and lesson, how many learners completed it and who.

![The Admin tab: users progress](images/12-progress-managers/urr-course-admin.png)

The manager is also counted as a learner in these statistics. Their forum messages show a **Teacher** badge ([9. Forum](09-forum.md)).

> The course Admin tab is not the same as the Strapi admin panel. Course managers don't need a Strapi account.

## Submissions

When a module has **uploadFiles** ticked ([7. Course structure](07-course-structure.md#module)), its pages show an upload box. Learners can upload files and delete their own.

![Upload box in a module](images/12-progress-managers/balkar-upload.png)

Uploaded files are listed in **Content Manager › Submission** with the learner, the course and the module (**moduleId** is the module's uid). There is no page on the site to review them: open each Submission in the admin panel to download the file.
