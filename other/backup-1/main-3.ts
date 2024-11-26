// src/main.ts

import { showUI } from '@create-figma-plugin/utilities';
import { DocumentData, ElementNode, StyleMap } from './types';
import { getJSONData } from './core/get-data';
import { fetchImage } from './helpers/fetch-images';

export default function () {
  showUI({
    height: 160,
    width: 240,
  });
}

// Helper function to parse color strings into Figma RGB format
function parseColor(color: string): RGB {
  console.log(`Parsing color: ${color}`);
  const rgba = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
  return { r: rgba[0] / 255, g: rgba[1] / 255, b: rgba[2] / 255 };
}

// Function to assign styles to Figma nodes
function applyStyles(node: SceneNode, styles: StyleMap) {
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

// Recursive function to create Figma nodes from JSON elements
async function createNode(element: ElementNode, parent: BaseNode, parentAbsX: number, parentAbsY: number): Promise<BaseNode | undefined> {
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

// Helper function to load fonts for text nodes
async function loadFontForTextNode(node: TextNode, element: ElementNode) {
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

// Main function to process the JSON data
async function processData(json: DocumentData) {
  try {
    console.log('Starting to process JSON data.');

    // Create a new page or use current page
    const page = figma.currentPage;
    page.name = json.name || 'Imported Design';
    console.log(`Page name set to: ${page.name}`);

    // Set page background color
    if (json.doc?.bgColor) {
      page.backgrounds = [{ type: 'SOLID', color: parseColor(json.doc.bgColor) }];
      console.log(`Page background color set: ${json.doc.bgColor}`);
    }

    // Check if root frame already exists
    let rootFrame = page.findOne(node => node.name === 'Root Frame' && node.type === 'FRAME') as FrameNode;
    if (!rootFrame) {
      // Create root frame if it doesn't exist
      rootFrame = figma.createFrame();
      rootFrame.name = 'Root Frame';
      rootFrame.resize(json.width || 800, json.height || 600);
      rootFrame.x = 0;
      rootFrame.y = 0;
      page.appendChild(rootFrame);
      console.log('Root frame created and appended to page.');
    } else {
      console.log('Root frame already exists, using existing frame.');
    }

    // Process the main frame
    if (json.frame) {
      console.log('Processing main frame...');
      await createNode(json.frame, rootFrame, json.frame.x || 0, json.frame.y || 0);
    }

    // Zoom into the imported content
    figma.viewport.scrollAndZoomIntoView([rootFrame]);
    console.log('Zoomed into the imported content.');

    // Notify the user that the design was imported successfully
    figma.notify('Design imported successfully!');
  } catch (err) {
    console.error('Error processing JSON data:', err);
    figma.notify('Error importing design. Check the console for details.');
  }
}

// Entry point of the plugin
(async () => {
  try {
    console.log('Fetching JSON data...');
    const jsonData: DocumentData = await getJSONData();
    console.log('JSON data received:', jsonData);

    // Process the data
    await processData(jsonData);
  } catch (err) {
    console.error('Error in plugin execution:', err);
    figma.notify('Error in plugin execution. See console for details.');
  } finally {
    // Optionally close the plugin after execution
    // figma.closePlugin();
  }
})();