import { parseColor } from './parse-color';
import { StyleMap } from '../types';

export function applyStyles(node: SceneNode, styles: StyleMap) {
    console.log('Applying styles to node:', node.name, styles);
    for (const [key, value] of Object.entries(styles)) {
        try {
            if (!value) continue;
            switch (key) {
                case 'backgroundColor':
                    if ('fills' in node) {
                        const color = parseColor(value);
                        node.fills = [{ type: 'SOLID', color }];
                        console.log(`Applied background color: ${JSON.stringify(color)}`);
                    }
                    break;

                case 'color':
                    if (node.type === 'TEXT') {
                        const color = parseColor(value);
                        node.fills = [{ type: 'SOLID', color }];
                        console.log(`Applied text color: ${JSON.stringify(color)}`);
                    }
                    break;

                case 'fontSize':
                    if (node.type === 'TEXT') {
                        (node as TextNode).fontSize = parseFloat(value);
                        console.log(`Applied font size: ${value}`);
                    }
                    break;

                case 'fontFamily':
                    if (node.type === 'TEXT') {
                        (node as TextNode).fontName = { family: value, style: 'Regular' };
                        console.log(`Applied font family: ${value}`);
                    }
                    break;

                case 'fontWeight':
                    if (node.type === 'TEXT') {
                        const textNode = node as TextNode;
                        textNode.fontName = {
                            family: (textNode.fontName as FontName).family,
                            style: value.toString(),
                        };
                        console.log(`Applied font weight: ${value}`);
                    }
                    break;

                case 'textAlign':
                    if (node.type === 'TEXT') {
                        (node as TextNode).textAlignHorizontal = value.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
                        console.log(`Applied text alignment: ${value}`);
                    }
                    break;

                case 'lineHeight':
                    if (node.type === 'TEXT') {
                        (node as TextNode).lineHeight = { value: parseFloat(value), unit: 'PIXELS' };
                        console.log(`Applied line height: ${value}`);
                    }
                    break;

                case 'letterSpacing':
                    if (node.type === 'TEXT') {
                        (node as TextNode).letterSpacing = { value: parseFloat(value), unit: 'PIXELS' };
                        console.log(`Applied letter spacing: ${value}`);
                    }
                    break;

                case 'opacity':
                    if ('opacity' in node) {
                        node.opacity = parseFloat(value);
                        console.log(`Applied opacity: ${value}`);
                    }
                    break;

                case 'cornerRadius':
                case 'borderRadius':
                    if ('cornerRadius' in node && typeof node.cornerRadius !== 'undefined') {
                        (node as any).cornerRadius = parseFloat(value);
                        console.log(`Applied corner radius: ${value}`);
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