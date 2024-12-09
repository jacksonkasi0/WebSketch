const {
  measureSingleTextLine,
  measureTextLine,
} = require("../helpers/measureText");

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

module.exports = {
  getTextNodeInfo,
};
