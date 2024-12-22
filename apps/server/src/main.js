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

    console.log(
      `Testing ${chosen_config.name} with ${chosen_config.mode} mode`
    );
    await page.goto(target_url, { waitUntil: "networkidle2" });

    // First, inject all helper functions into the page context
    await page.evaluateOnNewDocument(() => {
      window.nodeUtils = {};
    });

    // Expose helper functions one by one
    await page.exposeFunction("get_node_info", (...args) =>
      get_node_info(...args)
    );
    await page.exposeFunction("get_document_info", (...args) =>
      get_document_info(...args)
    );
    await page.exposeFunction("collect_page_data", (...args) =>
      collect_page_data(...args)
    );
    await page.exposeFunction("get_text_node_info", (...args) =>
      get_text_node_info(...args)
    );

    // Set up the nodeUtils object in the browser context
    await page.evaluate(() => {
      window.nodeUtils = {
        get_node_info: (...args) => window.get_node_info(...args),
        get_document_info: (...args) => window.get_document_info(...args),
        collect_page_data: (...args) => window.collect_page_data(...args),
        get_text_node_info: (...args) => window.get_text_node_info(...args),
      };
    });

    // Verify the functions are available
    const debugUtils = await page.evaluate(() => Object.keys(window.nodeUtils));
    console.log("Available functions in window.nodeUtils:", debugUtils);

    // Execute the data collection
    const result = await page.evaluate(async () => {
      try {
        console.log("Collecting page data...");
        if (window !== undefined) {
          return await window.nodeUtils.collect_page_data();
        }
      } catch (error) {
        console.error("Error in collect_page_data:", error);
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
