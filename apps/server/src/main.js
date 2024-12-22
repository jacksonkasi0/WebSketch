/**
 * One common issue is that addScriptTag runs each script in its own scope, and sometimes
 * the order of script execution can conflict. Below is an example showing how to merge
 * your helper scripts into a single string, then inject them all at once. After this,
 * the functions should be accessible on window.nodeUtils:
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

const { get_document_info, collect_page_data } = require("../helpers/dom_helper");
const { get_text_node_info } = require("../helpers/extract_text");
const { write_to_json } = require("../utils/file_utils");
const { viewport_configurations, target_url } = require("../config/puppeteer_config");
const { get_node_info } = require("../helpers/extract_node_info");

/**
 * Example function to set color scheme in Puppeteer.
 */
async function set_color_scheme(page, scheme) {
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: scheme }
  ]);
}

/**
 * Main entry function. Configures Puppeteer, navigates to target URL, extracts data, and saves to output.json.
 */
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

    // Expose helper functions to the browser context
    await page.exposeFunction("getNodeInfo", get_node_info);
    await page.exposeFunction("getDocumentInfo", get_document_info);
    await page.exposeFunction("collectPageData", collect_page_data);
    await page.exposeFunction("getTextNodeInfo", get_text_node_info);

    // Attach exposed functions to window.nodeUtils
    await page.evaluate(() => {
      window.nodeUtils = {
        get_node_info: window.getNodeInfo,
        get_document_info: window.getDocumentInfo,
        collect_page_data: window.collectPageData,
        get_text_node_info: window.getTextNodeInfo,
      };
    });

    // Debugging: Log window.nodeUtils in browser context
    const debugUtils = await page.evaluate(() => {
      return Object.keys(window.nodeUtils || {});
    });
    console.log("Available functions in window.nodeUtils:", debugUtils);

    // Execute the injected functions
    const result = await page.evaluate(() => {
      if (!window.nodeUtils.collect_page_data) {
        throw new Error("collect_page_data is not defined in window.nodeUtils");
      }
      return window.nodeUtils.collect_page_data();
    });

    // Save results to output.json
    write_to_json("output.json", result);
  } catch (err) {
    console.error("Error during Puppeteer script execution:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
