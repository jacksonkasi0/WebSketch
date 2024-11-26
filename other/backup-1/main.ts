import { showUI } from '@create-figma-plugin/utilities'
import { DocumentData, ElementNode, StyleMap } from './types';
import { getJSONData } from './core/get-data';

export default function () {
  showUI({
    height: 160,
    width: 240
  })
}



// Helper function to parse color strings into Figma RGB format
function parseColor(color: string): RGB {
  const rgba = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
  return { r: rgba[0] / 255, g: rgba[1] / 255, b: rgba[2] / 255 };
}

// Function to assign styles to Figma nodes
function applyStyles(node: SceneNode, styles: StyleMap) {
  for (const [key, value] of Object.entries(styles)) {
    try {
      switch (key) {
        case 'backgroundColor':
          if ('fills' in node && value) {
            const color = parseColor(value);
            node.fills = [{ type: 'SOLID', color }];
          }
          break;

        case 'color':
          if (node.type === 'TEXT' && value) {
            const color = parseColor(value);
            node.fills = [{ type: 'SOLID', color }];
          }
          break;

        case 'fontSize':
          if (node.type === 'TEXT' && value) {
            (node as TextNode).fontSize = parseFloat(value);
          }
          break;

        case 'fontFamily':
          if (node.type === 'TEXT' && value) {
            (node as TextNode).fontName = { family: value, style: 'Regular' };
          }
          break;

        case 'fontWeight':
          if (node.type === 'TEXT' && value) {
            const textNode = node as TextNode;
            textNode.fontName = {
              family: (textNode.fontName as FontName).family,
              style: value.toString(),
            };
          }
          break;

        case 'textAlign':
          if (node.type === 'TEXT' && value) {
            (node as TextNode).textAlignHorizontal = value.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
          }
          break;

        case 'lineHeight':
          if (node.type === 'TEXT' && value) {
            (node as TextNode).lineHeight = { value: parseFloat(value), unit: 'PIXELS' };
          }
          break;

        case 'letterSpacing':
          if (node.type === 'TEXT' && value) {
            (node as TextNode).letterSpacing = { value: parseFloat(value), unit: 'PIXELS' };
          }
          break;

        case 'opacity':
          if ('opacity' in node) {
            (node as any).opacity = parseFloat(value);
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
          // Handle other styles if necessary
          break;
      }
    } catch (err) {
      console.warn(`Error applying style "${key}":`, err);
    }
  }
}

// Helper function to fetch and upload images to Figma
async function fetchImage(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const image = figma.createImage(new Uint8Array(buffer));
    return image.hash;
  } catch (err) {
    console.warn(`Failed to fetch image: ${url}`, err);
    return undefined;
  }
}

// Recursive function to create Figma nodes from JSON elements
async function createNode(element: ElementNode, parent: BaseNode): Promise<BaseNode | undefined> {
  let node: BaseNode | undefined;

  try {
    switch (element.type) {
      case 'FRAME':
      case 'BUTTON':
      case 'INPUT':
      case 'LINK':
      case 'VIDEO':
      case 'AUDIO':
        node = figma.createFrame();
        (node as FrameNode).resizeWithoutConstraints(element.width || 100, element.height || 100);
        break;

      case 'TEXT':
        node = figma.createText();
        if (element.value) {
          await loadFontForTextNode(node as TextNode, element);
          (node as TextNode).characters = element.value;
        }
        break;

      case 'IMAGE':
        node = figma.createRectangle();
        (node as RectangleNode).resizeWithoutConstraints(element.width || 100, element.height || 100);
        if (element.attr?.src) {
          const imageHash = await fetchImage(element.attr.src);
          if (imageHash) {
            (node as RectangleNode).fills = [{ type: 'IMAGE', imageHash, scaleMode: 'FILL' }];
          }
        }
        break;

      case 'SVG':
        if (element.svg) {
          node = figma.createNodeFromSvg(element.svg);
        }
        break;

      default:
        console.warn(`Unsupported element type: ${element.type}`);
        break;
    }

    if (node) {
      // Set position
      if ('x' in element && 'y' in element) {
        (node as SceneNode).x = element.x!;
        (node as SceneNode).y = element.y!;
      }

      // Apply styles
      if (element.styles) {
        applyStyles(node as SceneNode, element.styles);
      }

      // Set name
      if (element.tag) {
        node.name = element.tag;
      }

      // Append to parent
      if ('appendChild' in parent) {
        (parent as ChildrenMixin).appendChild(node as SceneNode);
      }

      // Recursively create children
      if (element.children && element.children.length > 0) {
        for (const child of element.children) {
          await createNode(child, node);
        }
      }
    }
  } catch (err) {
    console.error(`Error creating node for element type "${element.type}":`, err);
  }

  return node;
}

// Helper function to load fonts for text nodes
async function loadFontForTextNode(node: TextNode, element: ElementNode) {
  try {
    const fontName: FontName = {
      family: element.font || element.platformFont?.familyName || 'Roboto',
      style: 'Regular',
    };
    await figma.loadFontAsync(fontName);
    node.fontName = fontName;
  } catch (err) {
    console.warn('Failed to load font:', err);
    await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
    node.fontName = { family: 'Roboto', style: 'Regular' };
  }
}

// Main function to process the JSON data
async function processData(json: DocumentData) {
  // Create a new page or use current page
  const page = figma.currentPage;
  page.name = json.name || 'Imported Design';

  // Set page background color
  if (json.doc?.bgColor) {
    page.backgrounds = [{ type: 'SOLID', color: parseColor(json.doc.bgColor) }];
  }

  // Create root frame
  const rootFrame = figma.createFrame();
  rootFrame.name = 'Root Frame';
  rootFrame.resizeWithoutConstraints(json.width || 800, json.height || 600);
  page.appendChild(rootFrame);

  // Process the main frame
  if (json.frame) {
    await createNode(json.frame, rootFrame);
  }

  // Zoom into the imported content
  figma.viewport.scrollAndZoomIntoView([rootFrame]);

  // Notify the user
  figma.notify('Design imported successfully!');
}

// Entry point of the plugin
(async () => {
  // Simulate receiving JSON data (replace with actual data source)
  const jsonData: DocumentData = await getJSONData();

  // Process the data
  await processData(jsonData);

  // Close the plugin
  // figma.closePlugin();
})();
