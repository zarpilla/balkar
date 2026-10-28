/**
 * certificate controller
 */

/**
 * learning-space controller
 */

import { factories } from "@strapi/strapi";

// const PDFDocument   = require("pdfkit");
import PDFDocument from "pdfkit";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import QRCode from "qrcode";
import { isEnrolled, hasCertificatePayment } from "../../../utils/access";
import { courseCompletion, findSpaceWithFallback, removeDrafts } from "../../../utils/content";
import { getSite } from "../../../utils/email";

/** Verification codes: no 0/O/1/I/L to avoid misreading. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const newCode = () =>
  Array.from(crypto.randomBytes(10), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");

/** What the PDF depends on: when it changes, the PDF is generated again. */
const pdfSignature = (issuedTo: string, courseName: string, certificate: any) =>
  crypto
    .createHash("sha1")
    .update(JSON.stringify([issuedTo, courseName, certificate.id, certificate.updatedAt, certificate.background?.url]))
    .digest("hex");

// learningSpaceCertificate contains to_x, to_y, course_x, course_y, date_x, date_y that are the position in pixels for the dynamic fields on the certificate background
// learningSpaceCertificate also contains the background image in learningSpaceCertificate.background.url, relative to the Strapi server base URL

interface LearningSpaceCertificate {
  color?: string; // e.g. "#000000"
  to_x: number;
  to_y: number;
  to_align?: "left" | "center" | "right";
  to_fontsize?: number;
  to_font?: "font1" | "font2";
  course?: boolean; // whether to include the course name
  course_x: number;
  course_y: number;
  course_align?: "left" | "center" | "right";  
  course_fontsize?: number;
  course_font?: "font1" | "font2";
  date_x: number;
  date_y: number;
  date_align?: "left" | "center" | "right";
  date_fontsize?: number;
  date_font?: "font1" | "font2";
  hours?: string; // e.g. "5 hours"
  hours_x?: number;
  hours_y?: number;
  hours_align?: "left" | "center" | "right";
  hours_fontsize?: number;
  hours_font?: "font1" | "font2";
  background: {
    url: string; // URL of the background image
  };
  qr_x?: number; // QR code with the verification link (only when qr_x and qr_y are set)
  qr_y?: number;
  qr_size?: number; // points, default 80
}

interface VerificationQr {
  png: Buffer;
  code: string;
}

// Helper function to convert pixels to points
const pxToPt = (px: number): number => {
  return px * 0.75; // 1px = 0.75pt (at 96 DPI)
};


const generateCertificatePDF = (
  issuedTo: string,
  learningSpaceName: string,
  issuedAt: Date,
  learningSpaceCertificate: LearningSpaceCertificate,
  filename: string,
  qr?: VerificationQr
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Register custom fonts
    const fontsPath = "./src/api/certificate/fonts";
    doc.registerFont("font1", `${fontsPath}/Inter-VariableFont_opsz,wght.ttf`);
    doc.registerFont("font2", `${fontsPath}/Lora-Italic.ttf`);

    // Ensure the certificates directory exists
    if (!fs.existsSync("./public/certificates")) {
      fs.mkdirSync("./public/certificates", { recursive: true });
    }

    // Define the path to save the PDF using the UUID filename
    const outputPath = `./public/certificates/${filename}.pdf`;

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Add background image
    const backgroundPath = `./public${learningSpaceCertificate.background.url}`;
    if (fs.existsSync(backgroundPath)) {
      doc.image(backgroundPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    }    

    // Set text color if specified
    const textColor = learningSpaceCertificate.color || "#000000";
    doc.fillColor(textColor);

    // Add "Issued to" text
    const toFont = learningSpaceCertificate.to_font || "font1";
    doc
      .font(toFont)
      .fontSize(pxToPt(learningSpaceCertificate.to_fontsize || 30))
      .text(issuedTo, learningSpaceCertificate.to_x, learningSpaceCertificate.to_y, { align: learningSpaceCertificate.to_align || "left" });

    // Add "For completing" text
    if (learningSpaceCertificate.course) {
      const courseFont = learningSpaceCertificate.course_font || "font1";
      doc
        .font(courseFont)
        .fontSize(pxToPt(learningSpaceCertificate.course_fontsize || 20))
        .text(`${learningSpaceName}`, learningSpaceCertificate.course_x, learningSpaceCertificate.course_y, {
          align: learningSpaceCertificate.course_align || "left",
        });
      }

    // Add "Date" text
    const formattedDate = `${issuedAt.getDate().toString().padStart(2, '0')}/${(issuedAt.getMonth() + 1).toString().padStart(2, '0')}/${issuedAt.getFullYear()}`;    
    const dateFont = learningSpaceCertificate.date_font || "font1";

    console.log('learningSpaceCertificate.date_align', learningSpaceCertificate.date_align);
    doc
      .font(dateFont)
      .fontSize(pxToPt(learningSpaceCertificate.date_fontsize || 15))
      .text(`${formattedDate}`, learningSpaceCertificate.date_x, learningSpaceCertificate.date_y, { align: learningSpaceCertificate.date_align || "left" });

    // Add "Hours" text (optional)
    if (learningSpaceCertificate.hours && learningSpaceCertificate.hours_x !== undefined && learningSpaceCertificate.hours_y !== undefined) {
      const hoursFont = learningSpaceCertificate.hours_font || "font1";
      doc
        .font(hoursFont)
        .fontSize(pxToPt(learningSpaceCertificate.hours_fontsize || 15))        
        .text(learningSpaceCertificate.hours, learningSpaceCertificate.hours_x, learningSpaceCertificate.hours_y, { align: learningSpaceCertificate.hours_align || "left" });
    }

    // Verification QR code, with the code under it
    if (qr) {
      const size = learningSpaceCertificate.qr_size || 80;
      const x = learningSpaceCertificate.qr_x;
      const y = learningSpaceCertificate.qr_y;
      doc.image(qr.png, x, y, { width: size, height: size });
      doc
        .font("font1")
        .fontSize(7)
        .text(qr.code, x, y + size + 2, { width: size, align: "center", lineBreak: false });
    }

    // Finalize the PDF and end the stream
    doc.end();

    writeStream.on("finish", () => {
      console.log("PDF generated successfully:", outputPath);
      resolve(filename);
    });

    writeStream.on("error", (error) => {
      console.error("Error generating PDF:", error);
      reject(error);
    });
  });
};

export default factories.createCoreController(
  "api::certificate.certificate",
  ({ strapi }) => ({
    issue: async (ctx, next) => {
      const { uid } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized(
          "You must be logged in to issue a certificate."
        );
      }

      const learningSpaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: uid,
          },
          populate: [
            "certificate",
            "certificate.background",
            "content_modules",
            "content_modules.units",
            "content_modules.units.lessons",
            "localizations",
          ],
        }
      );

      if (!learningSpaces || learningSpaces.length === 0) {
        return ctx.notFound("Learning space not found.");
      }

      const learningSpace: any = learningSpaces[0];

      if (!learningSpace.certificate) {
        return ctx.badRequest(
          "This learning space does not have a certificate."
        );
      }

      if (!(await isEnrolled(user.id, learningSpace.uid))) {
        return ctx.forbidden("You are not enrolled in this course.");
      }

      // The certificate is paid if any localization of the space has a certificate product.
      const allLocales = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        { filters: { uid: learningSpace.uid }, populate: ["certificateProduct"], locale: "all" }
      );
      const certificateIsPaid = allLocales.some((s: any) => !!s.certificateProduct);
      if (
        certificateIsPaid &&
        !(await hasCertificatePayment(user.email, learningSpace.uid))
      ) {
        return ctx.forbidden("The certificate has not been paid.");
      }

      // Check that the learner completed every required page (drafts and Monitoring modules
      // don't count).
      const spacesLocalized = [
        learningSpace.id,
        ...learningSpace.localizations.map((l: any) => l.id),
      ];

      const progresses = await strapi.entityService.findMany(
        "api::progress.progress",
        {
          filters: {
            users_permissions_user: user.id,
            learning_space: {
              id: {
                $in: spacesLocalized,
              },
            },
          },
          populate: ["module", "unit", "lesson"],
          limit: -1,
        }
      );

      const completion = courseCompletion(removeDrafts(learningSpace), progresses);
      if (!completion.isComplete) {
        return ctx.badRequest(
          `Certificate cannot be issued. Please complete all lessons first. Progress: ${completion.completed}/${completion.total} completed.`
        );
      }

      const userData = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        user.id
      );

      if (!userData) {
        return ctx.notFound("User not found.");
      }

      const learningSpaceCertificate = learningSpace.certificate;
      const issuedTo = [userData.name, userData.lastname].filter(Boolean).join(" ");
      const signature = pdfSignature(issuedTo, learningSpace.name, learningSpaceCertificate);

      const existing = await strapi.entityService.findMany(
        "api::user-certificate.user-certificate",
        {
          filters: {
            user: user.id,
            learning_space: { id: { $in: spacesLocalized } },
          },
          sort: { id: "asc" },
        }
      );

      let userCertificate: any = existing[0];
      if (!userCertificate) {
        userCertificate = await strapi.entityService.create(
          "api::user-certificate.user-certificate",
          {
            data: {
              user: user.id,
              learning_space: learningSpace.id,
              issuedAt: new Date(),
              issuedTo,
              code: newCode(),
            },
          }
        );
      } else if (!userCertificate.code) {
        // Certificates issued before verification codes existed.
        userCertificate = await strapi.entityService.update(
          "api::user-certificate.user-certificate",
          userCertificate.id,
          { data: { code: newCode() } }
        );
      }

      const site = await getSite();
      const serverUrl = String(strapi.config.get("server.url") || "").replace(/\/+$/, "");
      const origin = ctx.request.headers.origin;
      const frontendUrl =
        site.frontendUrl !== serverUrl || !origin ? site.frontendUrl : origin;
      const verifyUrl = `${frontendUrl}/verify/${userCertificate.code}`;

      // Generate the PDF again when the name, the course name or the design changed, or when
      // the file is missing. The issue date stays the same.
      const pdfMissing =
        !userCertificate.filename ||
        !fs.existsSync(`./public/certificates/${userCertificate.filename}.pdf`);
      if (pdfMissing || userCertificate.signature !== signature) {
        const oldFilename = userCertificate.filename;
        const pdfFilename = uuidv4();
        const hasQr =
          learningSpaceCertificate.qr_x !== null && learningSpaceCertificate.qr_x !== undefined &&
          learningSpaceCertificate.qr_y !== null && learningSpaceCertificate.qr_y !== undefined;
        try {
          const qr = hasQr
            ? {
                png: await QRCode.toBuffer(verifyUrl, {
                  margin: 1,
                  width: Math.max(160, (learningSpaceCertificate.qr_size || 80) * 4),
                  color: { dark: learningSpaceCertificate.color || "#000000", light: "#ffffff" },
                }),
                code: userCertificate.code,
              }
            : undefined;
          await generateCertificatePDF(
            issuedTo,
            learningSpace.name,
            new Date(userCertificate.issuedAt),
            learningSpaceCertificate,
            pdfFilename,
            qr
          );
        } catch (error) {
          console.error("Error generating certificate PDF:", error);
          return ctx.internalServerError("Failed to generate certificate PDF.");
        }
        userCertificate = await strapi.entityService.update(
          "api::user-certificate.user-certificate",
          userCertificate.id,
          { data: { filename: pdfFilename, issuedTo, signature } }
        );
        if (oldFilename && oldFilename !== pdfFilename) {
          fs.rm(`./public/certificates/${oldFilename}.pdf`, { force: true }, () => {});
        }
      }

      ctx.body = {
        ...userCertificate,
        signature: undefined,
        learning_space_name: learningSpace.name,
        learning_space_certificate: learningSpaceCertificate,
        pdfUrl: `/certificates/${userCertificate.filename}.pdf`,
        pdfFilename: userCertificate.filename,
        verifyUrl,
        hours: learningSpaceCertificate.hours || null,
        siteName: site.name || null,
      };
    },

    /** Public check of a certificate by its verification code (link or QR code on the PDF). */
    verify: async (ctx) => {
      const code = String(ctx.params.code || "").trim().toUpperCase();
      const found = code
        ? await strapi.entityService.findMany("api::user-certificate.user-certificate", {
            filters: { code },
            populate: {
              learning_space: { fields: ["uid", "name"], populate: { certificate: { fields: ["hours"] } } },
            },
            limit: 1,
          })
        : [];
      const certificate: any = found[0];
      if (!certificate) {
        ctx.status = 404;
        ctx.body = { valid: false };
        return;
      }

      const spaceUid = certificate.learning_space?.uid;
      const space: any = spaceUid
        ? await findSpaceWithFallback(spaceUid, (ctx.query.locale as string) || undefined, {
            fields: ["name"],
            populate: { certificate: { fields: ["hours"] } },
          })
        : null;
      const site = await getSite();

      ctx.body = {
        valid: true,
        code: certificate.code,
        issuedTo: certificate.issuedTo,
        course: space?.name || certificate.learning_space?.name || null,
        issuedAt: certificate.issuedAt,
        // Other language versions may not link the certificate: use the issued course's.
        hours: space?.certificate?.hours || certificate.learning_space?.certificate?.hours || null,
        siteName: site.name || null,
      };
    },
  })
);
