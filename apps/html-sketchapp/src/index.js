// index.js
const fs = require("fs");
const { viewportConfigurations } = require("./config/viewport");
const { createBrowser, setupPage } = require("./utils/browser");
const { getCachedAssets } = require("./utils/assets");
const { getPageScript } = require("./utils/pageScripts");

const url = "https://example.com/";

async function main() {
  const browser = await createBrowser();
  const config = viewportConfigurations[2];
  const page = await setupPage(browser, config);

  console.log(`Testing ${config.name} with ${config.mode} mode`);
  await page.goto(url, { waitUntil: "networkidle2" });

  console.time("Asset Collection");
  const assets = await getCachedAssets(page);
  console.timeEnd("Asset Collection");

  console.log(`Collected ${assets.length} assets`);

  // Inject all required functions
  await page.evaluate(getPageScript());

  const result = await page.evaluate(() => {
    const docInfo = getDocInfo();
    const frame = getNodeInfo(document.body) || {};

    const fonts = [];

    return {
      doc: docInfo,
      frame,
      fonts,
      name: window.location.href,
      width: window.innerWidth,
      height: window.innerHeight,
      theme: "light",
    };
  });

  result.assets = assets;

  fs.writeFileSync("output.json", JSON.stringify(result, null, 2), "utf-8");
  console.log("Output saved to output.json");

  await browser.close();
}

main().catch(console.error);