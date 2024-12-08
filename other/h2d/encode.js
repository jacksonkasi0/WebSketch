const fs = require("fs");

// Helper to XOR obfuscate data
function xorObfuscate(buffer, key) {
    return buffer.map((byte) => byte ^ key);
}

// Function to create .h2d file
async function createH2DFile(task, outputFilePath) {
    try {
        // Example task data (replace with actual data)
        const serializedFrames = [
            {
                fonts: ["Roboto", "Arial"],
                assets: { images: ["image1.png", "image2.png"] },
                alternatives: [],
            },
            {
                fonts: ["Verdana"],
                assets: { images: ["image3.png"] },
            },
        ];

        // Aggregate fonts, assets, and alternatives
        const [mainFrame, ...otherFrames] = serializedFrames;
        for (const { fonts, assets, ...rest } of otherFrames) {
            Object.assign(mainFrame.assets, assets);
            for (const font of fonts) {
                if (!mainFrame.fonts.includes(font)) {
                    mainFrame.fonts.push(font);
                }
            }
            mainFrame.alternatives.push(rest);
        }

        // Serialize and obfuscate the data
        const jsonData = JSON.stringify(mainFrame);
        const encodedData = new TextEncoder().encode(jsonData);
        const obfuscatedData = xorObfuscate(encodedData, 1337);

        // Save as .h2d file
        fs.writeFileSync(outputFilePath, Buffer.from(obfuscatedData));
        console.log(`.h2d file created at: ${outputFilePath}`);
    } catch (error) {
        console.error("Error creating .h2d file:", error);
    }
}

// Usage
createH2DFile(null, "./output.h2d");
