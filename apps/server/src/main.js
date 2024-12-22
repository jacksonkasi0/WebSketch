const puppeteer = require("puppeteer");

const {
  get_document_info,
  collect_page_data,
} = require("../helpers/dom_helper");
const { get_text_node_info } = require("../helpers/extract_text");
const { write_to_json } = require("../utils/file_utils");
const {
  viewport_configurations,
  target_url,
} = require("../config/puppeteer_config");
const { get_node_info } = require("../helpers/extract_node_info");

async function set_color_scheme(page, scheme) {
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: scheme },
  ]);
}

(async () => {
    const chosen_config = viewport_configurations[2]; // Desktop config
    let browser;
    try {
      browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
  
      await page.setViewport({
        width: chosen_config.width,
        height: chosen_config.height,
      });
      await set_color_scheme(page, chosen_config.mode);
  
      console.log(`Testing ${chosen_config.name} with ${chosen_config.mode} mode`);
      await page.goto(target_url, { waitUntil: "networkidle2" });
  
      // Expose helper functions directly
      await page.exposeFunction("getNodeInfo", get_node_info);
      await page.exposeFunction("getDocumentInfo", get_document_info);
      await page.exposeFunction("collectPageData", collect_page_data);
      await page.exposeFunction("getTextNodeInfo", get_text_node_info);
  
      // Set up nodeUtils object in browser context
      await page.evaluate(() => {
        window.nodeUtils = {
          getNodeInfo: (args) => window.getNodeInfo(args),
          getDocumentInfo: (args) => window.getDocumentInfo(args),
          collectPageData: () => window.collectPageData(),
          getTextNodeInfo: (args) => window.getTextNodeInfo(args),
        };
      });
  
      // Verify the functions are available
      const debugUtils = await page.evaluate(() => Object.keys(window.nodeUtils));
      console.log("Available functions in window.nodeUtils:", debugUtils);
  
      // Execute the data collection
      const result = await page.evaluate(async () => {
        try {
          console.log("Collecting page data...");
          return await window.nodeUtils.collectPageData();
        } catch (error) {
          console.error("Error in collectPageData:", error);
          throw error;
        }
      });
  
      // Save results to output.json
      await write_to_json("output.json", result);
    } catch (err) {
      console.error("Error during Puppeteer script execution:", err);
      console.error(err.stack); // Add stack trace for better debugging
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  })();
  