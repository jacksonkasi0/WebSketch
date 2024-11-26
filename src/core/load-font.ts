import { ElementNode } from '../types';

export async function loadFontForTextNode(node: TextNode, element: ElementNode) {
    console.log('Loading font for text node:', element.fontFamily || 'Default Font');
    try {
        const fontName: FontName = {
            family: element.fontFamily || element.font || element.platformFont?.familyName || 'Roboto',
            style: element.fontWeight ? element.fontWeight.toString() : 'Regular',
        };
        await figma.loadFontAsync(fontName);
        node.fontName = fontName;
        console.log(`Font loaded and applied: ${fontName.family}, ${fontName.style}`);
    } catch (err) {
        console.error('Failed to load font:', err);
        await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
        node.fontName = { family: 'Roboto', style: 'Regular' };
        console.log('Fallback font applied: Roboto, Regular');
    }
}
