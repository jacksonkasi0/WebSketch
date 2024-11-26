import { applyStyles } from '../helpers/apply-styles';
import { fetchImage } from '../helpers/fetch-images';
import { loadFontForTextNode } from './load-font';
import { ElementNode } from '../types';

export async function createNode(element: ElementNode, parent: BaseNode, parentAbsX: number, parentAbsY: number): Promise<BaseNode | undefined> {
    console.log('Creating node for element:', element.tag || element.type, `at x: ${element.x}, y: ${element.y}`);
    let node: SceneNode | undefined;

    try {
        switch (element.type.toUpperCase()) {
            case 'FRAME':
            case 'DIV':
                node = figma.createFrame();
                break;

            case 'BUTTON':
            case 'INPUT':
            case 'LINK':
            case 'VIDEO':
            case 'AUDIO':
                node = figma.createFrame();
                break;

            case 'TEXT':
                node = figma.createText();
                if (element.value || element.content) {
                    await loadFontForTextNode(node as TextNode, element);
                    (node as TextNode).characters = element.value || element.content || '';
                }
                break;

            case 'IMAGE':
                node = figma.createRectangle();
                break;

            case 'SVG':
                if (element.svg) {
                    node = figma.createNodeFromSvg(element.svg);
                }
                break;

            case 'RECTANGLE':
                node = figma.createRectangle();
                break;

            default:
                console.warn(`Unsupported element type: ${element.type}`);
                return;
        }

        if (node) {
            // Calculate relative position
            const relativeX = element.x - parentAbsX;
            const relativeY = element.y - parentAbsY;
            node.x = relativeX;
            node.y = relativeY;
            console.log(`Node positioned at relative x: ${relativeX}, y: ${relativeY}`);

            // Set size if provided
            if (element.width && element.height) {
                node.resize(element.width, element.height);
                console.log(`Node resized to width: ${element.width}, height: ${element.height}`);
            }

            // Ensure text nodes are auto-resizing correctly
            if (node.type === 'TEXT') {
                (node as TextNode).textAutoResize = 'WIDTH_AND_HEIGHT';
            }

            // Apply styles
            if (element.styles) {
                applyStyles(node, element.styles);
            }

            // Set name
            if (element.tag) {
                node.name = element.tag;
                console.log(`Node name set to: ${element.tag}`);
            }

            // Append to parent
            if ('appendChild' in parent) {
                (parent as ChildrenMixin).appendChild(node);
                console.log(`Node appended to parent: ${parent.name}`);
            }

            // Handle images
            if (element.type === 'IMAGE' && element.attr?.src) {
                const imageHash = await fetchImage(element.attr.src);
                if (imageHash) {
                    (node as RectangleNode).fills = [{ type: 'IMAGE', imageHash, scaleMode: 'FILL' }];
                    console.log(`Image fill applied to node from URL: ${element.attr.src}`);
                }
            }

            // Recursively create children if present
            if (element.children && element.children.length > 0) {
                console.log(`Creating ${element.children.length} child(ren) for node: ${node.name}`);
                for (const child of element.children) {
                    await createNode(child, node, element.x, element.y);
                }
            }
        }
    } catch (err) {
        console.warn('Error on layer:', element, err);
    }

    return node;
}