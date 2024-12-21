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

module.exports = {
  shouldSkipElement,
  getNodeInfo,
};
