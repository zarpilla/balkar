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
  filename: string
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

      // Check if user has completed all lessons
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

      // Helper function to match progress by UID across all localizations
      const findProgressByUid = (lesson: any) => {
        return progresses.find((progress: any) => {
          if (!progress.lesson) return false;
          // If the lesson UID matches directly
          if (progress.lesson.uid === lesson.uid) return true;
          // If no UID on progress lesson, fall back to ID matching (backward compatibility)
          return progress.lesson.id === lesson.id;
        });
      };

      const findUnitProgressByUid = (unit: any) => {
        return progresses.find((progress: any) => {
          if (!progress.unit) return false;
          // If the unit UID matches directly
          if (progress.unit.uid === unit.uid) return true;
          // If no UID on progress unit, fall back to ID matching (backward compatibility)
          return progress.unit.id === unit.id;
        });
      };

      // Check completion status
      let allLessonsCompleted = true;
      let totalLessons = 0;
      let completedLessons = 0;

      if (
        learningSpace.content_modules &&
        learningSpace.content_modules.length > 0
      ) {
        for (const module of learningSpace.content_modules) {
          for (const unit of module.units) {
            if (unit.lessons && unit.lessons.length > 0) {
              // Unit has lessons - check each lesson
              for (const lesson of unit.lessons) {
                totalLessons++;
                const progress = findProgressByUid(lesson);
                if (progress) {
                  completedLessons++;
                } else {
                  allLessonsCompleted = false;
                }
              }
            } else {
              // Unit without lessons - check unit completion directly
              totalLessons++;
              const progress = findUnitProgressByUid(unit);
              if (progress) {
                completedLessons++;
              } else {
                allLessonsCompleted = false;
              }
            }
          }
        }
      }

      if (!allLessonsCompleted) {
        return ctx.badRequest(
          `Certificate cannot be issued. Please complete all lessons first. Progress: ${completedLessons}/${totalLessons} completed.`
        );
      }

      // Check if certificate already issued
      const existingCertificate = await strapi.entityService.findMany(
        "api::user-certificate.user-certificate",
        {
          filters: {
            user: user.id,
            learning_space: { id: learningSpace.id },
          },
        }
      );

      // if (existingCertificate.length > 0) {
      //   return ctx.badRequest("Certificate already issued.");
      // }

      const userData = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        user.id
      );

      if (!userData) {
        return ctx.notFound("User not found.");
      }

      // Issue certificate
      let pdfFilename: string;
      let userCertificate: any;
      let shouldGeneratePDF = false;

      if (existingCertificate && existingCertificate.length > 0) {
        userCertificate = existingCertificate[0];
        
        if (userCertificate.filename) {
          // Use existing filename
          pdfFilename = userCertificate.filename;
          
          // Check if PDF file actually exists on filesystem
          const pdfPath = `./public/certificates/${pdfFilename}.pdf`;
          if (!fs.existsSync(pdfPath)) {
            // File doesn't exist, need to regenerate
            shouldGeneratePDF = true;
          }
        } else {
          // Existing certificate but no filename stored, generate new one
          pdfFilename = uuidv4();
          shouldGeneratePDF = true;
          
          // Update the existing certificate with the new filename
          userCertificate = await strapi.entityService.update(
            "api::user-certificate.user-certificate",
            userCertificate.id,
            {
              data: {
                filename: pdfFilename,
              },
            }
          );
        }
      } else {
        // Create new certificate
        pdfFilename = uuidv4();
        shouldGeneratePDF = true;
        
        userCertificate = await strapi.entityService.create(
          "api::user-certificate.user-certificate",
          {
            data: {
              user: user.id,
              learning_space: learningSpace.id,
              issuedAt: new Date(),
              issuedTo: `${userData.name} ${userData.lastname}`,
              filename: pdfFilename,
            },
          }
        );
      }

      const learningSpaceCertificate = learningSpace.certificate;

      // Generate PDF only if needed
      if (shouldGeneratePDF) {
        try {
          await generateCertificatePDF(
            userCertificate.issuedTo,
            learningSpace.name,
            new Date(userCertificate.issuedAt),
            learningSpaceCertificate,
            pdfFilename
          );
        } catch (error) {
          console.error("Error generating certificate PDF:", error);
          return ctx.internalServerError("Failed to generate certificate PDF.");
        }
      }

      // return the certificate data with pdf url
      const certificateData = {
        ...userCertificate,
        learning_space_name: learningSpace.name,
        learning_space_certificate: learningSpaceCertificate,
        pdfUrl: `/certificates/${pdfFilename}.pdf`,
        pdfFilename: pdfFilename,
      };

      ctx.body = certificateData;
    },
  })
);
