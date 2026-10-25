'use strict';

/**
 * Sets Balkar's branding in the `administration` single type:
 * site name, header/footer logo, Resilience Earth logo in the footer,
 * default locale (ca), login-first home page,
 * and the "Balkar" global theme (scripts/data/balkar-theme.css).
 *
 *   npm run build
 *   node scripts/balkar-branding.js
 *
 * Safe to run again: it updates the theme CSS and only uploads the logo once.
 * Logos and other fields can be changed later from the Strapi admin.
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data');
const THEME_NAME = 'Balkar';

const log = (...args) => console.log('[branding]', ...args);

async function uploadSvg(fileName, alt) {
  const filePath = path.join(DATA, fileName);
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: fileName }, orderBy: { id: 'desc' } });
  // Reuse it unless the file in scripts/data has changed (e.g. a new logo version)
  if (existing && existing.size === Math.round((fs.statSync(filePath).size / 1000) * 100) / 100) {
    return existing;
  }

  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name: fileName, alternativeText: alt } },
      files: { path: filePath, name: fileName, type: 'image/svg+xml', size: fs.statSync(filePath).size },
    });
  log(`${fileName} uploaded`);
  return file;
}

const keepOrOurs = (current, ours) =>
  current && !(current.name || '').startsWith('balkar-logo') ? current.id : ours.id;

async function main() {
  const strapiFactory = require('@strapi/strapi');
  const appDir = path.resolve(__dirname, '..');
  const app = await strapiFactory({ appDir, distDir: path.join(appDir, 'dist') }).load();
  app.log.level = 'error';

  try {
    const styles = fs.readFileSync(path.join(DATA, 'balkar-theme.css'), 'utf8');
    let theme = await strapi.db.query('api::theme.theme').findOne({ where: { name: THEME_NAME } });
    if (theme) {
      theme = await strapi.db
        .query('api::theme.theme')
        .update({ where: { id: theme.id }, data: { styles } });
      log('theme updated');
    } else {
      theme = await strapi.db.query('api::theme.theme').create({ data: { name: THEME_NAME, styles } });
      log('theme created');
    }

    const logo = await uploadSvg('balkar-logo.svg', 'Balkar');
    const resilienceLogo = await uploadSvg('resilience-earth-logo.svg', 'Resilience Earth');
    const admin = await strapi.entityService.findMany('api::administration.administration', {
      populate: ['logo', 'logoHeader', 'logoFooter', 'footerLogos', 'footerLogos.image'],
    });

    const data = {
      siteName: (admin && admin.siteName) || 'Balkar',
      defaultLocale: (admin && admin.defaultLocale) || 'ca',
      publicHome: false,
      theme: theme.id,
      // Keep logos set by hand in the admin; replace the ones this script set.
      logoHeader: keepOrOurs(admin && admin.logoHeader, logo),
      logoFooter: keepOrOurs(admin && admin.logoFooter, logo),
      logo: keepOrOurs(admin && admin.logo, logo),
      footerLogos:
        admin && admin.footerLogos && admin.footerLogos.length
          ? admin.footerLogos.map((l) => ({ image: l.image && l.image.id, url: l.url, alt: l.alt }))
          : [{ image: resilienceLogo.id, url: 'https://resilience.earth', alt: 'Resilience Earth' }],
    };
    if (admin) {
      await strapi.entityService.update('api::administration.administration', admin.id, { data });
    } else {
      await strapi.entityService.create('api::administration.administration', { data });
    }
    log('administration updated:', JSON.stringify({ ...data, theme: THEME_NAME, footerLogos: data.footerLogos.length }));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
  await app.destroy();
  process.exit();
}

main();
