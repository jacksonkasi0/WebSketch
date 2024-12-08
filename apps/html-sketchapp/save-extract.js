const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = 'https://example.com/';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const result = await page.evaluate(() => {
    // List of doc-level background style keys
    const docStyleKeys = [
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
      "backgroundSize"
    ];

    // List of frame-level style keys as per the sample structure
    // (Includes box model, typography, positioning, etc.)
    const frameStyleKeys = [
      // Box Model:
      "width", "height",
      "left", "top", "right", "bottom",
      "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
      "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
      "borderStyle", "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
      "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",

      // Positioning and Layout:
      "position", "zIndex", "display", "flexDirection", "alignItems", "justifyContent", "flexGrow", "flexShrink", "order",

      // Typography:
      "fontFamily", "fontSize", "fontStyle", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "textDecoration", "textTransform",

      // Colors and Background:
      "color", "backgroundColor", "backgroundImage", "backgroundPosition", "backgroundSize", "backgroundRepeat", "boxShadow",

      // Other Styles:
      "opacity", "overflow", "overflowX", "overflowY", "visibility", "cursor",
      "boxSizing", "listStyleType", "outlineColor", "minHeight", "minWidth",
      // Include margin, padding, etc. even if they appear redundant.
    ];

    function getElementType(tagName) {
      const t = tagName.toLowerCase();
      if (t === 'img') return 'IMAGE';
      if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(t)) return 'TEXT';
      if (t === 'a') return 'LINK';
      if (t === 'button') return 'BUTTON';
      if (['input', 'textarea'].includes(t)) return 'INPUT';
      if (t === 'svg') return 'SVG';
      if (t === 'video') return 'VIDEO';
      if (t === 'audio') return 'AUDIO';
      return 'FRAME'; // default
    }

    function getNodeInfo(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.nodeValue.trim();
        if (!textContent) return null;
        return {
          type: "TEXT",
          content: textContent
        };
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        // Extract attributes
        const attr = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attribute = el.attributes[i];
          attr[attribute.name] = attribute.value;
        }

        const classList = Array.from(el.classList);
        const elementType = getElementType(el.tagName);

        // Extract the allowed frame styles
        const styles = {};
        frameStyleKeys.forEach(key => {
          const val = computedStyle.getPropertyValue(key);
          if (val !== null) {
            styles[key] = val;
          }
        });

        // Children
        const children = [];
        el.childNodes.forEach(child => {
          const childInfo = getNodeInfo(child);
          if (childInfo) children.push(childInfo);
        });

        // If this is a TEXT element with a single TEXT child, move content up
        let content;
        if (elementType === "TEXT" && children.length === 1 && children[0].type === "TEXT") {
          content = children[0].content;
          children.length = 0; // Remove the text child node
        }

        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          quad: [rect.x, rect.y, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height],
          type: elementType,
          tag: el.tagName.toLowerCase(),
          attr,
          classList,
          ...(content ? { content } : {}),
          styles,
          ...(children.length > 0 ? { children } : {})
        };
      }

      return null;
    }

    // Document styles
    const docComputedStyle = window.getComputedStyle(document.documentElement);
    const docStyleObj = {};
    docStyleKeys.forEach(key => {
      docStyleObj[key] = docComputedStyle.getPropertyValue(key);
    });

    const docInfo = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      fontSize: parseFloat(window.getComputedStyle(document.documentElement).fontSize),
      baseURI: document.baseURI,
      bgColor: window.getComputedStyle(document.body).backgroundColor,
      styles: docStyleObj
    };

    const frame = getNodeInfo(document.documentElement);

    // fonts and assets can be implemented later if needed
    const fonts = [];
    const assets = {};

    return {
      doc: docInfo,
      frame,
      fonts,
      assets,
      name: window.location.href,
      width: window.innerWidth,
      height: window.innerHeight,
      theme: "light"
    };
  });

  fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('Output saved to output.json');

  await browser.close();
})();
