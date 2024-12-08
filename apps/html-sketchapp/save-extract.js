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
    const docStyleKeys = [
      "background", "backgroundAttachment", "backgroundBlendMode", "backgroundClip",
      "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPosition",
      "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundSize"
    ];

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
      if (!val || val === 'none') return '';
      const firstShadow = val.split(',')[0].trim().split(/\s+/);
      let colorPart = '';
      const offsets = [];

      for (let i = 0; i < firstShadow.length; i++) {
        if (firstShadow[i].includes('rgb')) {
          colorPart = firstShadow[i];
        } else {
          offsets.push(firstShadow[i]);
        }
      }

      if (!colorPart) return '';
      if (offsets.length < 3) return '';
      if (offsets.length === 3) offsets.push('0px');

      return [colorPart, offsets.join(' ')].join(' ');
    }

    function measureTextLine(textNode, lineText, startOffset, endOffset) {
      // Create a sub-range for this line
      const range = document.createRange();
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);

      const rects = range.getClientRects();
      if (!rects.length) return null;
      const rect = rects[0];

      const parentEl = textNode.parentNode;
      const computedStyle = window.getComputedStyle(parentEl);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = computedStyle.lineHeight;
      const exactLineHeight = lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(lineHeight);

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
        value: lineText,
        exactLineHeight,
        font: fontFamily.replace(/['"]/g,'').split(',')[0].trim(),
        platformFont
      };
    }

    function getTextNodeInfo(textNode) {
      let rawText = textNode.nodeValue;
      if (!rawText || !rawText.trim()) return [];

      rawText = rawText.replace(/\r\n/g, '\n'); // normalize line endings
      const lines = rawText.split('\n');

      // If there's only one line, measure directly
      if (lines.length === 1) {
        const singleLine = lines[0].trim();
        if (!singleLine) return [];
        return measureSingleTextLine(textNode, singleLine);
      }

      // Multiple lines: measure each line separately
      // We'll measure each line by calculating offsets
      const results = [];
      let currentOffset = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        const lineLength = line.length;
        if (trimmed) {
          // Find start and end offset of the trimmed line inside the raw line
          const lineStartIndex = rawText.indexOf(line, currentOffset);
          const lineEndIndex = lineStartIndex + lineLength;

          const measured = measureTextLine(textNode, trimmed, lineStartIndex, lineEndIndex);
          if (measured) results.push(measured);
        }
        currentOffset += lineLength + 1; // +1 for the newline char
      }
      return results;
    }

    function measureSingleTextLine(textNode, singleLine) {
      // Measure the entire text node (which has a single line)
      const parentEl = textNode.parentNode;
      if (!parentEl) return [];

      // Create a range for the entire text node
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();
      if (!rects.length) return [];

      const rect = rects[0];
      const computedStyle = window.getComputedStyle(parentEl);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = computedStyle.lineHeight;
      const exactLineHeight = lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(lineHeight);

      const x = rect.x;
      const y = rect.y;
      const width = rect.width;
      const height = rect.height;
      const quad = [x, y, x+width, y, x+width, y+height, x, y+height];

      const platformFont = {
        familyName: fontFamily.replace(/['"]/g,'').split(',')[0].trim(),
        postScriptName: fontFamily.replace(/['"\s]/g,'').replace(/,/g,'-')
      };

      return [{
        type: "TEXT",
        x,
        y,
        width,
        height,
        quad,
        value: singleLine,
        exactLineHeight,
        font: fontFamily.replace(/['"]/g,'').split(',')[0].trim(),
        platformFont
      }];
    }

    function getNodeInfo(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parentTag = node.parentNode && node.parentNode.tagName ? node.parentNode.tagName.toLowerCase() : '';
        if (parentTag === 'style' || parentTag === 'script') {
          return null;
        }
        // Return an array of TEXT nodes if multiline
        const textResults = getTextNodeInfo(node);
        // getTextNodeInfo returns an array, but we need to return them to the parent as children
        return textResults.length ? textResults : null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (shouldSkipElement(el)) return null;

        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        const attr = {};
        for (let i=0; i<el.attributes.length; i++) {
          const attribute = el.attributes[i];
          attr[attribute.name] = attribute.value;
        }

        const classList = Array.from(el.classList);
        const elementType = getElementType(el.tagName);

        const rawStyles = {};
        for (const key of frameStyleKeys) {
          let val = computedStyle.getPropertyValue(key);
          if (key === 'boxShadow' && val && val !== 'none') {
            val = formatBoxShadow(val);
          }
          rawStyles[key] = val;
        }
        const styles = filterEmptyProps(rawStyles);

        // Process children
        const childrenNodes = [];
        el.childNodes.forEach(child => {
          const childInfo = getNodeInfo(child);
          if (childInfo) {
            // childInfo might be an array (for TEXT nodes with multiple lines) or a single object
            if (Array.isArray(childInfo)) {
              childrenNodes.push(...childInfo);
            } else {
              childrenNodes.push(childInfo);
            }
          }
        });

        const nodeInfo = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          quad: [
            rect.x, rect.y,
            rect.x + rect.width, rect.y,
            rect.x + rect.width, rect.y + rect.height,
            rect.x, rect.y + rect.height
          ],
          type: elementType,
          tag: el.tagName.toLowerCase()
        };

        if (Object.keys(attr).length > 0) nodeInfo.attr = attr;
        if (classList.length > 0) nodeInfo.classList = classList;
        if (Object.keys(styles).length > 0) nodeInfo.styles = styles;
        if (childrenNodes.length > 0) nodeInfo.children = childrenNodes;
        if (el === document.scrollingElement) nodeInfo.isScrollingElt = true;

        return nodeInfo;
      }

      return null;
    }

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
