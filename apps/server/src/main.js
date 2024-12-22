/**
 * @file main.js
 * @description Main script entry point. Launches Puppeteer, navigates to a URL, collects layout/style data, and saves output.
 */

const puppeteer = require("puppeteer");
const { viewport_configurations, target_url } = require(
    "../config/puppeteer_config",
);
const { write_to_json } = require("../utils/file_utils");
const { get_node_info } = require("../helpers/extract_node_info");

/**
 * Sets the color scheme (light or dark) for Puppeteer page emulation.
 * @param {import('puppeteer').Page} page - Puppeteer Page object.
 * @param {string} scheme - "light" or "dark".
 */
async function set_color_scheme(page, scheme) {
    await page.emulateMediaFeatures([{
        name: "prefers-color-scheme",
        value: scheme,
    }]);
}

/**
 * Gathers document-level style information (e.g., background, baseURI, etc.).
 * @returns {object} An object containing relevant document style metadata.
 */
function get_document_info() {
    const doc_style_keys = [
        "background",
        "backgroundAttachment",
        "backgroundBlendMode",
        "backgroundClip",
        "backgroundColor",
        "backgroundImage",
        "backgroundOrigin",
        "backgroundPosition",
        "backgroundPositionX",
        "backgroundPositionY",
        "backgroundRepeat",
        "backgroundSize",
    ];
    const doc_computed_style = window.getComputedStyle(
        document.documentElement,
    );
    const doc_styles_raw = {};

    doc_style_keys.forEach((key) => {
        const value = doc_computed_style.getPropertyValue(key);
        if (value && value.trim() !== "") {
            // For demonstration, just store them in camel form:
            const camel_key = key.replace(
                /-([a-z])/g,
                (_, letter) => letter.toUpperCase(),
            );
            doc_styles_raw[camel_key] = value;
        }
    });

    const body_bg = window.getComputedStyle(document.body).backgroundColor;

    return {
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        fontSize: parseFloat(doc_computed_style.fontSize),
        baseURI: document.baseURI,
        bgColor: body_bg,
        styles: doc_styles_raw,
    };
}

/**
 * Collects overall page data by grabbing doc info and recursively extracting DOM node info.
 * @returns {object} A structured object containing document metadata, DOM structure, etc.
 */
function collect_page_data() {
    const doc_info = get_document_info();
    const body_info = get_node_info(document.body) || {};

    return {
        doc: doc_info,
        frame: body_info,
        fonts: [],
        assets: {},
        name: window.location.href,
        width: window.innerWidth,
        height: window.innerHeight,
        theme: "light",
    };
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
            `Testing ${chosen_config.name} with ${chosen_config.mode} mode`,
        );
        await page.goto(target_url, { waitUntil: "networkidle2" });

        const result = await page.evaluate(collect_page_data);
        write_to_json("output.json", result);
    } catch (err) {
        console.error("Error during Puppeteer script execution:", err);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
