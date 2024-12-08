const fs = require('fs');


// Helper to XOR obfuscate data
function xorObfuscate(buffer, key) {
    return buffer.map((byte) => byte ^ key);
}

function decodeH2DFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const decodedBuffer = xorObfuscate(fileBuffer, 1337);
    const jsonString = new TextDecoder().decode(decodedBuffer);
    return JSON.parse(jsonString);
}

const decodedData = decodeH2DFile("./example_com_vw_default.h2d");
console.log("Decoded Data:", decodedData);
