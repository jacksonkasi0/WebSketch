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

module.exports = {
  measureSingleTextLine,
  measureTextLine,
};
