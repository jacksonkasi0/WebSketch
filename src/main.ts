import { showUI } from '@create-figma-plugin/utilities';
import { processData } from './core/process-data';
import { getJSONData } from './data/get-data';

export default function () {
  showUI({
    height: 160,
    width: 240,
  });
}

// Entry point of the plugin
(async () => {
  try {
    console.log('Fetching JSON data...');
    const jsonData = await getJSONData();
    console.log('JSON data received:', jsonData);

    // Process the data
    await processData(jsonData);
  } catch (err) {
    console.error('Error in plugin execution:', err);
    figma.notify('Error in plugin execution. See console for details.');
  }
})();
