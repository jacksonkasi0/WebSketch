// assetUtils.js
async function getAssets(page) {
  // First collect all unique URLs in the page context
  const uniqueUrls = await page.evaluate(() => {
    const imageElements = Array.from(document.images);
    const imageUrls = imageElements.map((img) => img.src);
    return [...new Set(imageUrls)];
  });

  // Process assets in parallel outside page context using the Browser's CDP
  const assetsArray = await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        // Use CDP session for direct network access
        const client = await page.target().createCDPSession();

        // Fetch asset using CDP
        const response = await client.send("Network.getResponseBody", {
          requestId: await page.evaluate(async (url) => {
            const response = await fetch(url);
            return response.headers.get("x-request-id") || "";
          }, url),
        });

        // Get response headers for mime type
        const headers = await page.evaluate(async (url) => {
          const response = await fetch(url);
          return {
            contentType: response.headers.get("content-type") || "",
          };
        }, url);

        return {
          link: url,
          content: response.base64Encoded
            ? response.body
            : Buffer.from(response.body).toString("base64"),
          base64Encoded: true,
          mimeType: headers.contentType,
        };
      } catch (err) {
        // Try fallback method if CDP fails
        try {
          const response = await page.evaluate(async (url) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve({
                  content: reader.result.split(",")[1],
                  mimeType: res.headers.get("content-type") || "",
                });
              reader.readAsDataURL(blob);
            });
          }, url);

          return {
            link: url,
            content: response.content,
            base64Encoded: true,
            mimeType: response.mimeType,
          };
        } catch (fallbackErr) {
          console.error(`Error fetching asset ${url}:`, fallbackErr);
          return null;
        }
      }
    })
  );

  // Filter out failed requests
  return assetsArray.filter(Boolean);
}

// Cache management for optimizing repeated requests
const assetCache = new Map();

async function getCachedAssets(page) {
  const pageUrl = await page.url();

  if (assetCache.has(pageUrl)) {
    return assetCache.get(pageUrl);
  }

  const assets = await getAssets(page);
  assetCache.set(pageUrl, assets);

  // Cache expiration after 5 minutes
  setTimeout(() => assetCache.delete(pageUrl), 5 * 60 * 1000);

  return assets;
}

module.exports = {
  getAssets,
  getCachedAssets,
};
