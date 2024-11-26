import { parseColor } from '../helpers/parse-color';
import { createNode } from './create-node';
import { DocumentData } from '../types';

export async function processData(json: DocumentData) {
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