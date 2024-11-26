import { parseColor } from './parse-color';
import { StyleMap } from '../types';

export function applyStyles(node: SceneNode, styles: StyleMap, tag?: string) {
  // List of tags to exclude `backgroundColor`
  const excludedBackgroundTags = ['html', 'p', 'a', 'span'];

  for (const [key, value] of Object.entries(styles)) {
    if (!value) continue;

    // Skip `backgroundColor` for excluded tags
    if (key === 'backgroundColor' && tag && excludedBackgroundTags.includes(tag.toLowerCase())) {
      console.log(`Skipping backgroundColor for tag: ${tag}`);
      continue;
    }

    try {
      switch (key) {
        case 'backgroundColor':
          if ('fills' in node) {
            const color = parseColor(value);
            node.fills = [{ type: 'SOLID', color }];
          }
          break;

        case 'color':
          if (node.type === 'TEXT') {
            const color = parseColor(value);
            node.fills = [{ type: 'SOLID', color }];
          }
          break;

        case 'fontSize':
          if (node.type === 'TEXT') {
            (node as TextNode).fontSize = parseFloat(value);
          }
          break;

        case 'fontFamily':
          if (node.type === 'TEXT') {
            (node as TextNode).fontName = { family: value, style: 'Regular' };
          }
          break;

        case 'fontWeight':
          if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            textNode.fontName = {
              family: (textNode.fontName as FontName).family,
              style: value.toString(),
            };
          }
          break;

        case 'textAlign':
          if (node.type === 'TEXT') {
            (node as TextNode).textAlignHorizontal = value.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
          }
          break;

        case 'lineHeight':
          if (node.type === 'TEXT') {
            (node as TextNode).lineHeight = { value: parseFloat(value), unit: 'PIXELS' };
          }
          break;

        case 'letterSpacing':
          if (node.type === 'TEXT') {
            (node as TextNode).letterSpacing = { value: parseFloat(value), unit: 'PIXELS' };
          }
          break;

        case 'opacity':
          if ('opacity' in node) {
            node.opacity = parseFloat(value);
          }
          break;

        case 'cornerRadius':
        case 'borderRadius':
          if ('cornerRadius' in node && typeof node.cornerRadius !== 'undefined') {
            (node as any).cornerRadius = parseFloat(value);
          }
          break;

        // Add more style mappings as needed

        default:
          console.warn(`Unsupported style "${key}" ignored`);
          break;
      }
    } catch (err) {
      console.error(`Error applying style "${key}":`, err);
    }
  }
}
