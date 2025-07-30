
const fs = require("fs");
// const { createEmailTemplates: importCreateEmailTemplates } = require("./email-templates");


async function isFirstRun() {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: "type",
      name: "setup",
    });
    const initHasRun = await pluginStore.get({ key: "initHasRun" });
    await pluginStore.set({ key: "initHasRun", value: true });
    return !initHasRun;
  }

async function start() {

    try {

      console.log('Starting import process...');

        const shouldImportSeedData = await isFirstRun();
        if (!shouldImportSeedData) {
            return
        }
        
        // Create default email templates
        // await importCreateEmailTemplates();
        
        return {
            success: true,
            // records
        }
    }
    catch (e) {
        console.error('Error importing file (1)', e)
        return {
            messsage: 'Error importing file',
            success: false,
            e
        }
    }
}


module.exports = async () => {
    try {
      await start();
      // Always ensure email templates exist
      // await createEmailTemplates();
    } catch (error) {
      console.log("Could not import seed data");
      console.error(error);
    }
  };