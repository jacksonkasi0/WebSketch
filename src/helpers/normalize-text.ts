export function normalizeTextNodes(element: any): any {
  // Base case: If the element has no children, return it as is
  if (!element.children || element.children.length === 0) {
    return element;
  }

  // Handle merging of text nodes for specific tags
  const textContainerTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a'];

  if (textContainerTags.includes(element.tag.toLowerCase())) {
    // Check if `p` contains an `a` tag and prioritize the `a` tag
    const hasAnchorTag = element.children.some(
      (child: any) => child.tag && child.tag.toLowerCase() === 'a'
    );

    if (hasAnchorTag) {
      const anchorChild = element.children.find(
        (child: any) => child.tag && child.tag.toLowerCase() === 'a'
      );

      // Process the `a` tag recursively
      return normalizeTextNodes(anchorChild);
    }

    // Combine all child TEXT nodes into one content string
    const combinedText = element.children
      .filter((child: any) => child.type === 'TEXT')
      .map((child: any) => child.value)
      .join('\n'); // Separate lines with `\n`

    // Update the parent element to have a single TEXT node
    element.type = 'TEXT';
    element.content = combinedText;
    element.children = []; // Clear children as they've been merged
    return element;
  }

  // Recursively process children for other tags
  element.children = element.children.map((child: any) => normalizeTextNodes(child));
  return element;
}
