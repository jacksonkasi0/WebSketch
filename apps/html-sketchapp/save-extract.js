const puppeteer = require("puppeteer");
const fs = require("fs");

const viewportConfigurations = [
  {
    name: "Mobile",
    width: 375,
    height: 667,
    mode: "light", // Options: "light" or "dark"
  },
  {
    name: "Tablet",
    width: 768,
    height: 1024,
    mode: "dark", // Options: "light" or "dark"
  },
  {
    name: "Desktop",
    width: 1920,
    height: 1080,
    mode: "light", // Options: "light" or "dark"
  },
  {
    name: "Wide Desktop",
    width: 2560,
    height: 1440,
    mode: "dark", // Options: "light" or "dark"
  },
];

(async () => {
  const url = "https://example.com/";
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const config = viewportConfigurations[3];

  // Set the viewport size
  await page.setViewport({
    width: config.width,
    height: config.height,
  });

  // Apply light or dark mode using the `prefers-color-scheme` CSS media query
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: config.mode },
  ]);

  console.log(`Testing ${config.name} with ${config.mode} mode`);
  await page.goto(url, { waitUntil: "networkidle2" });

  const result = await page.evaluate(() => {
    // Convert kebab-case CSS properties to camelCase
    function toCamelCase(prop) {
      return prop.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Reconstruct shorthand properties from their four sides if applicable
    function addShorthands(styles) {
      // Margin
      if (
        "marginTop" in styles &&
        "marginRight" in styles &&
        "marginBottom" in styles &&
        "marginLeft" in styles
      ) {
        const mt = styles.marginTop;
        const mr = styles.marginRight;
        const mb = styles.marginBottom;
        const ml = styles.marginLeft;
        // If top/bottom are equal and left/right are equal, form a shorthand
        if (mt === mb && ml === mr) {
          styles.margin = mt === mb && mt === mr ? mt : `${mt} ${mr}`;
        } else {
          // At least a top/bottom and left/right might form a pattern
          // If not symmetrical, fallback to a four-value margin:
          styles.margin = `${mt} ${mr} ${mb} ${ml}`;
        }
      }

      // Padding
      if (
        "paddingTop" in styles &&
        "paddingRight" in styles &&
        "paddingBottom" in styles &&
        "paddingLeft" in styles
      ) {
        const pt = styles.paddingTop;
        const pr = styles.paddingRight;
        const pb = styles.paddingBottom;
        const pl = styles.paddingLeft;
        if (pt === pb && pl === pr) {
          styles.padding = pt === pb && pt === pr ? pt : `${pt} ${pr}`;
        } else {
          styles.padding = `${pt} ${pr} ${pb} ${pl}`;
        }
      }

      // Border Width
      if (
        "borderTopWidth" in styles &&
        "borderRightWidth" in styles &&
        "borderBottomWidth" in styles &&
        "borderLeftWidth" in styles
      ) {
        const btw = styles.borderTopWidth;
        const brw = styles.borderRightWidth;
        const bbw = styles.borderBottomWidth;
        const blw = styles.borderLeftWidth;
        if (btw === bbw && blw === brw) {
          styles.borderWidth =
            btw === bbw && btw === brw ? btw : `${btw} ${brw}`;
        } else {
          styles.borderWidth = `${btw} ${brw} ${bbw} ${blw}`;
        }
      }

      // Border Style
      if (
        "borderTopStyle" in styles &&
        "borderRightStyle" in styles &&
        "borderBottomStyle" in styles &&
        "borderLeftStyle" in styles
      ) {
        const bts = styles.borderTopStyle;
        const brs = styles.borderRightStyle;
        const bbs = styles.borderBottomStyle;
        const bls = styles.borderLeftStyle;
        if (bts === bbs && bls === brs) {
          styles.borderStyle =
            bts === bbs && bts === brs ? bts : `${bts} ${brs}`;
        } else {
          styles.borderStyle = `${bts} ${brs} ${bbs} ${bls}`;
        }
      }

      // Border Color
      if (
        "borderTopColor" in styles &&
        "borderRightColor" in styles &&
        "borderBottomColor" in styles &&
        "borderLeftColor" in styles
      ) {
        const btc = styles.borderTopColor;
        const brc = styles.borderRightColor;
        const bbc = styles.borderBottomColor;
        const blc = styles.borderLeftColor;
        if (btc === bbc && blc === brc) {
          styles.borderColor =
            btc === bbc && btc === brc ? btc : `${btc} ${brc}`;
        } else {
          styles.borderColor = `${btc} ${brc} ${bbc} ${blc}`;
        }
      }

      // Border Radius
      if (
        "borderTopLeftRadius" in styles &&
        "borderTopRightRadius" in styles &&
        "borderBottomRightRadius" in styles &&
        "borderBottomLeftRadius" in styles
      ) {
        const tlr = styles.borderTopLeftRadius;
        const trr = styles.borderTopRightRadius;
        const brr = styles.borderBottomRightRadius;
        const blr = styles.borderBottomLeftRadius;
        // If all four corners are same:
        if (tlr === trr && trr === brr && brr === blr) {
          styles.borderRadius = tlr;
        } else {
          // We won't combine into shorter forms; snippet shows all four anyway.
          // If needed, we could form a shorthand, but snippet shows them individually.
        }
      }
    }

    function formatBoxShadow(val) {
      if (!val || val === "none") return "";
      const firstShadow = val.split(",")[0].trim().split(/\s+/);
      let colorPart = "";
      const offsets = [];
      for (let i = 0; i < firstShadow.length; i++) {
        if (firstShadow[i].includes("rgb")) {
          colorPart = firstShadow[i];
        } else {
          offsets.push(firstShadow[i]);
        }
      }
      if (!colorPart) return "";
      if (offsets.length < 3) return "";
      if (offsets.length === 3) offsets.push("0px");
      return [colorPart, offsets.join(" ")].join(" ");
    }

    function extractAllStyles(el) {
      const computedStyle = window.getComputedStyle(el);
      const styles = {};
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle.item(i);
        let val = computedStyle.getPropertyValue(prop);
        if (prop === "box-shadow" && val && val !== "none") {
          val = formatBoxShadow(val);
        }

        // Convert to camelCase
        const camelProp = toCamelCase(prop);

        // Keep only non-empty and non-null
        if (val != null && val !== "") {
          // Attempt to quote fontFamily if it contains spaces
          if (camelProp === "fontFamily" && val && !val.startsWith('"')) {
            if (val.indexOf(" ") > -1 || val.indexOf(",") > -1) {
              // Wrap entire fontFamily in quotes to mimic snippet formatting
              val = `"${val}"`;
            }
          }

          styles[camelProp] = val;
        }
      }

      // Reconstruct common shorthands if possible
      addShorthands(styles);
      return styles;
    }

    function shouldSkipElement(el) {
      const tagName = el.tagName.toLowerCase();
      return tagName === "style" || tagName === "script";
    }

    function getNodeInfo(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parentTag =
          node.parentNode && node.parentNode.tagName
            ? node.parentNode.tagName.toLowerCase()
            : "";
        if (parentTag === "style" || parentTag === "script") return null;

        const textResults = getTextNodeInfo(node);
        return textResults.length ? textResults : null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (shouldSkipElement(el)) return null;

        const rect = el.getBoundingClientRect();

        // Extract attributes
        const attr = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attribute = el.attributes[i];
          attr[attribute.name] = attribute.value;
        }

        const classList = Array.from(el.classList);
        // Always treat element nodes as FRAME
        const elementType =
          el.tagName.toLowerCase() === "img"
            ? "IMAGE"
            : el.tagName.toLowerCase() === "svg"
            ? "SVG"
            : "FRAME";

        const styles = extractAllStyles(el);

        // Process children
        const childrenNodes = [];
        el.childNodes.forEach((child) => {
          const childInfo = getNodeInfo(child);
          if (childInfo) {
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
            rect.x,
            rect.y,
            rect.x + rect.width,
            rect.y,
            rect.x + rect.width,
            rect.y + rect.height,
            rect.x,
            rect.y + rect.height,
          ],
          type: elementType,
          tag: el.tagName.toLowerCase(),
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

    function getTextNodeInfo(textNode) {
      let rawText = textNode.nodeValue;
      if (!rawText || !rawText.trim()) return [];

      rawText = rawText.replace(/\r\n/g, "\n");
      const lines = rawText.split("\n");

      if (lines.length === 1) {
        const singleLine = lines[0].trim();
        if (!singleLine) return [];
        return measureSingleTextLine(textNode, singleLine);
      }

      const results = [];
      let currentOffset = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        const lineLength = line.length;
        if (trimmed) {
          const lineStartIndex = rawText.indexOf(line, currentOffset);
          const lineEndIndex = lineStartIndex + lineLength;
          const measured = measureTextLine(
            textNode,
            trimmed,
            lineStartIndex,
            lineEndIndex
          );
          if (measured) results.push(measured);
        }
        currentOffset += lineLength + 1;
      }
      return results;
    }

    function measureSingleTextLine(textNode, singleLine) {
      const parentEl = textNode.parentNode;
      if (!parentEl) return [];

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();
      if (!rects.length) return [];

      const rect = rects[0];
      const computedStyle = window.getComputedStyle(parentEl);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = computedStyle.lineHeight;
      const exactLineHeight =
        lineHeight === "normal" ? fontSize * 1.2 : parseFloat(lineHeight);

      const x = rect.x;
      const y = rect.y;
      const width = rect.width;
      const height = rect.height;
      const quad = [x, y, x + width, y, x + width, y + height, x, y + height];

      const platformFont = {
        familyName: fontFamily.replace(/['"]/g, "").split(",")[0].trim(),
        postScriptName: fontFamily.replace(/['"\s]/g, "").replace(/,/g, "-"),
      };

      // Attempt to add quotes if needed for font consistency
      let displayedFont = fontFamily.replace(/['"]/g, "").split(",")[0].trim();
      if (displayedFont.indexOf(" ") > -1 || displayedFont.indexOf(",") > -1) {
        displayedFont = `"${displayedFont}"`;
      }

      return [
        {
          type: "TEXT",
          x,
          y,
          width,
          height,
          quad,
          value: singleLine,
          exactLineHeight,
          font: displayedFont,
          platformFont,
        },
      ];
    }

    function measureTextLine(textNode, lineText, startOffset, endOffset) {
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
      const exactLineHeight =
        lineHeight === "normal" ? fontSize * 1.2 : parseFloat(lineHeight);

      const x = rect.x;
      const y = rect.y;
      const width = rect.width;
      const height = rect.height;
      const quad = [x, y, x + width, y, x + width, y + height, x, y + height];

      const platformFont = {
        familyName: fontFamily.replace(/['"]/g, "").split(",")[0].trim(),
        postScriptName: fontFamily.replace(/['"\s]/g, "").replace(/,/g, "-"),
      };

      let displayedFont = fontFamily.replace(/['"]/g, "").split(",")[0].trim();
      if (displayedFont.indexOf(" ") > -1 || displayedFont.indexOf(",") > -1) {
        displayedFont = `"${displayedFont}"`;
      }

      return {
        type: "TEXT",
        x,
        y,
        width,
        height,
        quad,
        value: lineText,
        exactLineHeight,
        font: displayedFont,
        platformFont,
      };
    }

    // Extract doc-level styles using docStyleKeys
    // If you want all doc styles, do the same full extraction.
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
      "backgroundSize",
    ];
    const docComputedStyle = window.getComputedStyle(document.documentElement);
    const docStylesRaw = {};
    docStyleKeys.forEach((k) => {
      const val = docComputedStyle.getPropertyValue(k);
      if (val && val.trim() !== "") {
        const camelProp = toCamelCase(k);
        docStylesRaw[camelProp] = val;
      }
    });

    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const docInfo = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      fontSize: parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      ),
      baseURI: document.baseURI,
      bgColor: bodyBg,
      styles: docStylesRaw,
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
      theme: "light",
    };
  });

  fs.writeFileSync("output.json", JSON.stringify(result, null, 2), "utf-8");
  console.log("Output saved to output.json");

  await browser.close();
})();
