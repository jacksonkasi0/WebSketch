/**
 * @file puppeteer_config.js
 * @description Stores configuration objects and constants used throughout the application.
 */

const viewport_configurations = [
    {
        name: "mobile",
        width: 375,
        height: 667,
        mode: "light", // Options: "light" or "dark"
    },
    {
        name: "tablet",
        width: 768,
        height: 1024,
        mode: "dark",
    },
    {
        name: "desktop",
        width: 1920,
        height: 1080,
        mode: "light",
    },
    {
        name: "wide-desktop",
        width: 2560,
        height: 1440,
        mode: "dark",
    },
];

const target_url = "https://www.wikipedia.org";

module.exports = {
    viewport_configurations,
    target_url,
};
