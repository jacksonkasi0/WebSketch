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
    // Keys for doc-level background style extraction
    const docStyleKeys = [
      "background", "backgroundAttachment", "backgroundBlendMode", "backgroundClip", 
      "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPosition", 
      "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundSize"
    ];

    // Keys for frame-level style extraction
    const frameStyleKeys = [
      "width", "height", "left", "top", "right", "bottom",
      "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
      "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
      "borderStyle", "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
      "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
      "position", "zIndex", "display", "flexDirection", "alignItems", "justifyContent", 
      "flexGrow", "flexShrink", "order",
      "fontFamily", "fontSize", "fontStyle", "fontWeight", "lineHeight", "letterSpacing", 
      "textAlign", "textDecoration", "textTransform",
      "color", "backgroundColor", "backgroundImage", "backgroundPosition", 
      "backgroundSize", "backgroundRepeat", "boxShadow",
      "opacity", "overflow", "overflowX", "overflowY", "visibility", "cursor",
      "boxSizing", "listStyleType", "outlineColor", "minHeight", "minWidth"
    ];

    function getElementType(tagName) {
      const t = tagName.toLowerCase();
      if (t === 'img') return 'IMAGE';
      if (['p','span','h1','h2','h3','h4','h5','h6'].includes(t)) return 'TEXT';
      if (t === 'a') return 'LINK';
      if (t === 'button') return 'BUTTON';
      if (['input','textarea'].includes(t)) return 'INPUT';
      if (t === 'svg') return 'SVG';
      if (t === 'video') return 'VIDEO';
      if (t === 'audio') return 'AUDIO';
      return 'FRAME';
    }

    function shouldSkipElement(el) {
      const tagName = el.tagName.toLowerCase();
      return tagName === 'style' || tagName === 'script';
    }

    function filterEmptyProps(obj) {
      const result = {};
      for (const k in obj) {
        if (obj[k] !== "" && obj[k] != null) {
          result[k] = obj[k];
        }
      }
      return result;
    }

    function formatBoxShadow(val) {
      // Convert computed boxShadow to the expected format: 
      // rgba(r,g,b,a) xpx ypx blurpx spreadpx
      // If multiple shadows, take the first.
      // If spread not available, assume 0px.
      if (!val || val === 'none') return '';
      const parts = val.split(',')[0].trim().split(/\s+/);
      // parts might look like: ["rgba(0,0,0,0.2)","2px","3px","7px","2px"]
      // or ["rgb(0,0,0)","2px","3px","7px","2px"]
      let colorPart = '';
      let offsets = [];
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes('rgb')) {
          // colorPart might be rgb(...) or rgba(...)
          // Join if it spans multiple tokens due to spaces (unlikely but safe)
          const colorEnd = parts[i].indexOf(')') > -1;
          colorPart = parts[i];
          // If colorPart incomplete and next token is still part of color, concatenate (rare)
        } else {
          offsets.push(parts[i]);
        }
      }

      if (!colorPart) return '';

      // offsets should now contain something like ["2px","3px","7px","2px"]
      // Ensure we have at least x,y,blur. If spread missing, set it to 0px.
      if (offsets.length < 3) return ''; 
      if (offsets.length === 3) offsets.push('0px'); // Add spread if missing

      return [colorPart, offsets.join(' ')].join(' ');
    }

    function getTextNodeInfo(textNode) {
      const parentEl = textNode.parentNode;
      if (!parentEl) return null;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();
      if (!rects.length) return null;
      const rect = rects[0];

      const computedStyle = window.getComputedStyle(parentEl);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = parseFloat(computedStyle.fontSize);
      let lineHeight = computedStyle.lineHeight;
      let exactLineHeight = lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(lineHeight);
      const value = textNode.nodeValue.trim();

      const x = rect.x;
      const y = rect.y;
      const width = rect.width;
      const height = rect.height;
      const quad = [x, y, x+width, y, x+width, y+height, x, y+height];

      const platformFont = {
        familyName: fontFamily.replace(/['"]/g,'').split(',')[0].trim(),
        postScriptName: fontFamily.replace(/['"\s]/g,'').replace(/,/g,'-')
      };

      return {
        type: "TEXT",
        x,
        y,
        width,
        height,
        quad,
        value,
        exactLineHeight,
        font: fontFamily.replace(/['"]/g,'').split(',')[0].trim(),
        platformFont
      };
    }

    function getNodeInfo(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (!text) return null;
        const parentTag = node.parentNode && node.parentNode.tagName ? node.parentNode.tagName.toLowerCase() : '';
        if (parentTag === 'style' || parentTag === 'script') {
          return null;
        }
        const textInfo = getTextNodeInfo(node);
        return textInfo ? textInfo : { type: "TEXT", content: text };
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (shouldSkipElement(el)) return null;

        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        // Extract attributes
        const attr = {};
        for (let i=0; i<el.attributes.length; i++) {
          const attribute = el.attributes[i];
          attr[attribute.name] = attribute.value;
        }

        const classList = Array.from(el.classList);
        const elementType = getElementType(el.tagName);

        // Extract styles
        const rawStyles = {};
        for (const key of frameStyleKeys) {
          let val = computedStyle.getPropertyValue(key);
          if (key === 'boxShadow' && val && val !== 'none') {
            val = formatBoxShadow(val);
          }
          rawStyles[key] = val;
        }
        const styles = filterEmptyProps(rawStyles);

        const children = [];
        el.childNodes.forEach(child => {
          const childInfo = getNodeInfo(child);
          if (childInfo) children.push(childInfo);
        });

        let content;
        // If it's a TEXT element with a single TEXT child, move that child's value up
        if (elementType === "TEXT" && children.length === 1 && children[0].type === "TEXT" && children[0].value) {
          content = children[0].value;
          children.length = 0;
        } else if (elementType === "TEXT" && children.length === 1 && children[0].type === "TEXT" && children[0].content) {
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
          tag: el.tagName.toLowerCase()
        };

        if (Object.keys(attr).length > 0) nodeInfo.attr = attr;
        if (classList.length > 0) nodeInfo.classList = classList;
        if (Object.keys(styles).length > 0) nodeInfo.styles = styles;
        if (content) nodeInfo.content = content;
        if (children.length > 0) nodeInfo.children = children;
        if (el === document.scrollingElement) nodeInfo.isScrollingElt = true;

        return nodeInfo;
      }

      return null;
    }

    // Extract doc-level styles
    const docComputedStyle = window.getComputedStyle(document.documentElement);
    const docStylesRaw = {};
    docStyleKeys.forEach(k => {
      docStylesRaw[k] = docComputedStyle.getPropertyValue(k);
    });
    const docStyles = filterEmptyProps(docStylesRaw);

    const docInfo = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      fontSize: parseFloat(window.getComputedStyle(document.documentElement).fontSize),
      baseURI: document.baseURI,
      bgColor: window.getComputedStyle(document.body).backgroundColor,
      styles: docStyles
    };

    // Start from document.body only
    const frame = getNodeInfo(document.body) || {};

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
