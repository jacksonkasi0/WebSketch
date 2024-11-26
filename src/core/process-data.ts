import { parseColor } from '../helpers/parse-color';
import { createNode } from './create-node';
import { DocumentData } from '../types';
import { normalizeTextNodes } from '../helpers/normalize-text';

const config = {
    createRootFrame: false, // Control whether to create the root frame (Set to false to skip creating the root frame)
    pageBackgrounds: false
};

export async function processData(json: DocumentData) {
    try {

        // Preprocess the JSON to normalize text nodes
        json.frame = normalizeTextNodes(json.frame);

        // Set up the current page
        const page = figma.currentPage;
        page.name = json.name || 'Imported Design';

        // Set page background color if provided (not needed)
        if (config.pageBackgrounds && json.doc?.bgColor) {
            page.backgrounds = [{ type: 'SOLID', color: parseColor(json.doc.bgColor) }];
        }

        // Define the parent node
        let parentNode: BaseNode | undefined;

        if (config.createRootFrame) {
            // Check if the root frame exists or create a new one
            parentNode = page.findOne(
                (node) => node.name === 'Root Frame' && node.type === 'FRAME'
            ) as FrameNode;

            if (!parentNode) {
                parentNode = figma.createFrame();
                parentNode.name = 'Root Frame';
                parentNode.resize(json.width || 800, json.height || 600);
                parentNode.x = 0;
                parentNode.y = 0;
                page.appendChild(parentNode);
            }
        } else {
            // Use the page directly as the parent node
            parentNode = page;
        }

        // Process the main frame
        if (json.frame) {
            await createNode(json.frame, parentNode, json.frame.x || 0, json.frame.y || 0);
        }

        // Zoom into the imported content
        figma.viewport.scrollAndZoomIntoView([parentNode]);

        // Notify the user of successful import
        figma.notify('Design imported successfully!');
    } catch (err) {
        console.error('Error processing JSON data:', err);
        figma.notify('Error importing design. Check the console for details.');
    }
}
