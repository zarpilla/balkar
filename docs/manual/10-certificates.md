# 10. Certificates

> Content types: **Certificate** (the design), **UserCertificate** (issued certificates), **CertificatePayment**

A course with a **certificate** gets a *Certificate* tab. When a learner has completed **every** lesson (and every unit without lessons), the tab offers a **Download** button that creates a PDF with their name.

![Certificate page before the course is completed](images/10-certificates/urr-certificate-page.png)

Once everything is completed, the page offers the download:

![Certificate page of a completed course](images/10-certificates/urr-certificate-ready.png)

The text on that page above the button is the course's **certificateLesson** ([6. Courses](06-learning-spaces.md)). Use it to explain the requirements. Until the course is completed, the page shows the `certificate-explanation-not-completed` text ([4. Interface texts](04-translations.md)).

## Designing the certificate

![Certificate design in the admin panel](images/10-certificates/urr-admin-certificate.png)

The PDF is an **A4 landscape** page (**842 × 595 points**, origin at the **top-left** corner). The **background** image fills the whole page; prepare it at that proportion (e.g. 3508 × 2480 px) with everything that doesn't change: logos, borders, signatures, fixed texts.

On top of it the platform writes up to four texts:

| Text | Fields | Content |
|---|---|---|
| Recipient | `to_x`, `to_y`, `to_fontsize`, `to_align`, `to_font` | The learner's **name** and **last name** |
| Course | `course_x`, `course_y`, `course_fontsize`, `course_align`, `course_font` | The course **name** (default language). Only if **course** is ticked. |
| Date | `date_x`, `date_y`, `date_fontsize`, `date_align`, `date_font` | The issue date, `dd/mm/yyyy` |
| Hours | `hours_x`, `hours_y`, `hours_fontsize`, `hours_align`, `hours_font` | The **hours** field as written (e.g. `12 hours`). Only if it is filled in. |

For each text:

- **x / y**: position in points from the left / top edge.
- **fontsize**: size in pixels (defaults: 30 recipient, 20 course, 15 date and hours).
- **align**: `left`, `center` or `right`, within the space from *x* to the right margin (50 points from the right edge). **To centre a text on the page, set x to 50 and align to center.** Long texts wrap onto a new line at the right margin.
- **font**: `font1` = Inter (sans-serif), `font2` = Lora italic.

**color** sets the colour of all texts, as a hex code (`#020034`). Default is black.

![Where the fields go on the page](images/10-certificates/certificate-layout.png)

And the PDF a learner downloads with these settings:

![A downloaded certificate](images/10-certificates/urr-certificate-pdf.png)

## Testing a design

A learner's PDF is created the first time they download it. It is created again, with the **same issue date and verification code**, the next time they download it if the design (the Certificate entry), the course name or the learner's name changed.

To check a new design, use a test account that has completed the course: download the certificate, change the design, and download it again.

When a learner asks to correct their name, they fix it in their profile (or you do it in **User**) and download the certificate again.

## Verification

Every issued certificate has a **verification code** (10 letters and digits, e.g. `96V2NVR5VK`). After downloading, the certificate page shows the verification link, `https://<site>/verify/<code>`, with a *Copy link* button. Anyone can open it without an account and see the name, the course, the date, the hours and the site.

To print a **QR code** with the verification link on the PDF, fill in the certificate's **qr_x** and **qr_y** (top-left corner, in points, like the other positions) and optionally **qr_size** (default 80 points). The code is written in small letters under the QR. Leave qr_x empty for no QR code.

## Issued certificates

**Content Manager › UserCertificate** lists every certificate issued: learner, course, date, the name printed on it, the file name and the verification **code**. The PDF itself is at `https://<api address>/certificates/<filename>.pdf`.

## Paid certificates

If the course has a **certificateProduct**, the certificate page shows a *Pay* button first. After paying, a **CertificatePayment** entry (email + course uid) is created and the download is unlocked. To give a certificate for free to someone, create a CertificatePayment yourself with their **email**, the course **uid** and **payment** ticked. See [11. Enrollment and payments](11-enrollment-payments.md).
