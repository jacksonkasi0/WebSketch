const puppeteer = require("puppeteer");

async function createBrowser() {
  return await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function setupPage(browser, config) {
  const page = await browser.newPage();

  await page.setViewport({
    width: config.width,
    height: config.height,
  });

  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: config.mode },
  ]);

  return page;
}

module.exports = {
  createBrowser,
  setupPage,
};
