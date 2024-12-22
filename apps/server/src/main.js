/**
 * @file main.js
 * @description Main script entry point. Launches Puppeteer, navigates to a URL, collects layout/style data, and saves output.
 */

const puppeteer = require("puppeteer");

const path = require('path');
const fs = require('fs').promises;

const {
  viewport_configurations,
  target_url,
} = require("../config/puppeteer_config");

const { write_to_json } = require("../utils/file_utils");

const { get_document_info, collect_page_data } = require("../helpers/dom_helper");

/**
 * Sets the color scheme (light or dark) for Puppeteer page emulation.
 * @param {import('puppeteer').Page} page - Puppeteer Page object.
 * @param {string} scheme - "light" or "dark".
 */
async function set_color_scheme(page, scheme) {
  await page.emulateMediaFeatures([
    {
      name: "prefers-color-scheme",
      value: scheme,
    },
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

    console.log(
      `Testing ${chosen_config.name} with ${chosen_config.mode} mode`
    );
    await page.goto(target_url, { waitUntil: "networkidle2" });

    const scriptPath = path.join(__dirname, "..", "helpers", "extract_node_info.js");
    const nodeInfoScript = await fs.readFile(scriptPath, "utf8");

    const injectedScript = `
      ${nodeInfoScript}
      ${get_document_info.toString()}
      ${collect_page_data.toString()}
      ${get_text_node_info.toString()} // Ensure it is defined here
      window.nodeUtils = { 
        get_node_info, 
        get_document_info,
        collect_page_data,
        get_text_node_info // Add it to the object
      };
    `;

    await page.addScriptTag({ content: injectedScript });

    // Execute the injected functions
    const result = await page.evaluate(() => {
      return window.nodeUtils.collect_page_data();
    });

    write_to_json("output.json", result);
  } catch (err) {
    console.error("Error during Puppeteer script execution:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
