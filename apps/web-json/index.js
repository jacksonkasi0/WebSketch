import { chromium } from 'playwright';
import fs from 'fs-extra';

const convertWebsiteToSketchJSON = async (url, selector, outputFile) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url);
    
    const sketchJSON = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`No element found for selector "${sel}"`);
      }

      // Basic element to JSON conversion
      return {
        type: 'sketch',
        content: {
          tagName: element.tagName,
          attributes: Array.from(element.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          style: window.getComputedStyle(element),
          dimensions: element.getBoundingClientRect()
        }
      };
    }, selector);

    await fs.writeFile(outputFile, JSON.stringify(sketchJSON, null, 2), 'utf-8');
    console.log(`Sketch-like JSON saved to ${outputFile}`);

  } catch (error) {
    console.error('Conversion error:', error);
  } finally {
    await browser.close();
  }
};

convertWebsiteToSketchJSON('https://example.com', 'body', 'output.json')
  .catch(console.error);