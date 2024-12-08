const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = 'https://example.com/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const result = await page.evaluate(() => {
    // Properties for doc-level styles
    const docStyleKeys = [
      "background", "backgroundAttachment", "backgroundBlendMode", "backgroundClip", 
      "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPosition", 
      "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundSize"
    ];

    // Properties for frame-level styles (as per sample structure)
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
      "position", "zIndex", "display", "flexDirection", "alignItems", "justifyContent", 
      "flexGrow", "flexShrink", "order",

      // Typography:
      "fontFamily", "fontSize", "fontStyle", "fontWeight", "lineHeight", "letterSpacing", 
      "textAlign", "textDecoration", "textTransform",

      // Colors and Background:
      "color", "backgroundColor", "backgroundImage", "backgroundPosition", 
      "backgroundSize", "backgroundRepeat", "boxShadow",

      // Other Styles:
      "opacity", "overflow", "overflowX", "overflowY", "visibility", "cursor",
      "boxSizing", "listStyleType", "outlineColor", "minHeight", "minWidth"
    ];

    // Determine element type based on tagName
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

    // Decide if we should skip an element entirely (e.g. <style>, <script>)
    function shouldSkipElement(el) {
      const tagName = el.tagName.toLowerCase();
      return tagName === 'style' || tagName === 'script';
    }

    function getNodeInfo(node) {
      // If it's a text node
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (!text) return null; // skip empty text nodes
        // Check if parent is style or script
        const parentTag = node.parentNode && node.parentNode.tagName ? node.parentNode.tagName.toLowerCase() : '';
        if (parentTag === 'style' || parentTag === 'script') {
          return null; // skip text inside style/script
        }
        return {
          type: "TEXT",
          content: text
        };
      }

      // If it's an element node
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;

        if (shouldSkipElement(el)) {
          // Skip entire element (e.g. style or script) and its children
          return null;
        }

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

        // Extract specified frame styles
        const styles = {};
        frameStyleKeys.forEach(key => {
          const val = computedStyle.getPropertyValue(key);
          styles[key] = val;
        });

        // Collect children
        const children = [];
        el.childNodes.forEach(child => {
          const childInfo = getNodeInfo(child);
          if (childInfo) children.push(childInfo);
        });

        let content;
        if (elementType === "TEXT" && children.length === 1 && children[0].type === "TEXT") {
          // Pull up text content and remove the text node child
          content = children[0].content;
          children.length = 0;
        }

        const nodeInfo = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          quad: [rect.x, rect.y, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height],
          type: elementType,
          tag: el.tagName.toLowerCase(),
          attr,
          classList,
          styles
        };

        if (content) nodeInfo.content = content;
        if (children.length > 0) nodeInfo.children = children;

        // If this element is the scrolling element, add isScrollingElt
        if (el === document.scrollingElement) {
          nodeInfo.isScrollingElt = true;
        }

        return nodeInfo;
      }

      return null;
    }

    // Extract doc-level styles
    const docComputedStyle = window.getComputedStyle(document.documentElement);
    const docStyles = {};
    docStyleKeys.forEach(key => {
      docStyles[key] = docComputedStyle.getPropertyValue(key);
    });

    const docInfo = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      fontSize: parseFloat(window.getComputedStyle(document.documentElement).fontSize),
      baseURI: document.baseURI,
      bgColor: window.getComputedStyle(document.body).backgroundColor,
      styles: docStyles
    };

    const frame = getNodeInfo(document.documentElement) || {};

    // For now, fonts and assets are left empty or can be implemented as needed
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
