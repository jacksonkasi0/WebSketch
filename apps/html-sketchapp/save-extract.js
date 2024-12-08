const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = 'https://www.peacockindia.in/'; // Change to any website you want to crawl
  // const url = 'https://example.com/'; // Change to any website you want to crawl
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // The function that will run inside the browser context
  const result = await page.evaluate(() => {
    function getNodeInfo(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Text node
        return {
          type: 'TEXT',
          value: node.nodeValue.trim(),
        };
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        const rect = el.getBoundingClientRect();

        // Get computed styles
        const computedStyle = window.getComputedStyle(el);
        const styles = {};
        for (let i = 0; i < computedStyle.length; i++) {
          const prop = computedStyle.item(i);
          styles[prop] = computedStyle.getPropertyValue(prop);
        }

        // Gather attributes
        const attr = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attribute = el.attributes[i];
          attr[attribute.name] = attribute.value;
        }

        // Children
        const children = [];
        el.childNodes.forEach(child => {
          const childInfo = getNodeInfo(child);
          if (childInfo && (childInfo.type !== 'TEXT' || childInfo.value)) {
            children.push(childInfo);
          }
        });

        return {
          type: 'FRAME',
          tag: el.tagName.toLowerCase(),
          attr,
          classList: Array.from(el.classList),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          quad: [rect.x, rect.y, rect.x + rect.width, rect.y,
                 rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height],
          styles,
          children
        };
      }

      return null;
    }

    const docInfo = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      fontSize: parseFloat(window.getComputedStyle(document.documentElement).fontSize),
      baseURI: document.baseURI,
      bgColor: window.getComputedStyle(document.body).backgroundColor,
      styles: (() => {
        const docStyles = window.getComputedStyle(document.documentElement);
        const s = {};
        for (let i = 0; i < docStyles.length; i++) {
          const prop = docStyles.item(i);
          s[prop] = docStyles.getPropertyValue(prop);
        }
        return s;
      })()
    };

    const frame = getNodeInfo(document.documentElement);

    // You can also gather fonts, assets, etc.:
    // For example, fonts loaded can be inspected via document.fonts
    const fonts = []; 
    // For images, you have them in the DOM structure as <img> tags with their src attributes.
    const assets = {}; // Extend this as needed.

    return {
      doc: docInfo,
      frame,
      fonts,
      assets,
      name: window.location.href,
      width: window.innerWidth,
      height: window.innerHeight,
      theme: 'light' // or detect via prefers-color-scheme if desired
    };
  });

  // Save the result into output.json
  fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('Output saved to output.json');

  await browser.close();
})();
