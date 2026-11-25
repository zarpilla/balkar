# Balkar email templates

Paste into the Strapi admin: **Content Manager › Email template › Create new entry**.

| Locale | type | subject | content |
|---|---|---|---|
| ca | `email_confirmation` | Confirma el teu correu electrònic | `email_confirmation_ca.html` |
| en (localization of the ca entry) | `email_confirmation` | Confirm your email address | `email_confirmation_en.html` |
| es (localization of the ca entry) | `email_confirmation` | Confirma tu correo electrónico | `email_confirmation_es.html` |

Placeholders filled in by the platform: `{{URL}}` (confirmation link) and `{{NAME}}`.

The logo is a PNG (`balkar-logo-email.png`, from the media library's `balkar-logo.svg` at 2×):
Gmail and Outlook don't show SVG images in emails. It's served at
`https://api.balkar.earth/uploads/balkar_logo_email.png` (copied into the uploads folder, not
registered in the media library). Upload it to the media library and update the `src` if it
ever moves.
