// Helper function to fetch and upload images to Figma
export async function fetchImage(url: string): Promise<string | undefined> {
    console.log(`Fetching image from URL: ${url}`);
    try {
      // Fetch the image from the provided URL
      const response = await fetch(url);
      
      // Check if the response is ok (status is in the range 200-299)
      if (!response.ok) {
        throw new Error(`Failed to fetch image, status code: ${response.status}`);
      }
  
      // Convert the response into an array buffer
      const buffer = await response.arrayBuffer();
  
      // Convert the buffer into a Uint8Array, as expected by Figma's createImage function
      const image = figma.createImage(new Uint8Array(buffer));
  
      // Return the hash of the created image, which can be used for setting fills
      console.log(`Image fetched successfully from: ${url}`);
      return image.hash;
    } catch (err) {
      // Log an error if the image fetching fails
      console.error(`Failed to fetch image from URL: ${url}`, err);
      return undefined;
    }
  }
  