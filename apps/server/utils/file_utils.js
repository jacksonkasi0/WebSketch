/**
 * @file file_utils.js
 * @description Provides helper functions to handle file reading/writing.
 */

const fs = require("fs");

/**
 * Writes data to a JSON file.
 * @param {string} file_path - Destination path for the JSON file.
 * @param {object} data - Object to be written as JSON.
 */
function write_to_json(file_path, data) {
    try {
        fs.writeFileSync(file_path, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Output saved to ${file_path}`);
    } catch (error) {
        console.error(`Error writing to ${file_path}:`, error);
    }
}

module.exports = {
    write_to_json,
};
