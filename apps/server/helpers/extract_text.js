/**
 * @file extract_text.js
 * @description Provides functions for extracting and measuring text nodes from the DOM.
 */

/**
 * Measures a single line of text within a Text node.
 * @param {Text} text_node - The text node.
 * @param {string} line_text - The trimmed line of text.
 * @returns {Array<object>} An array with one object containing layout info, or an empty array if no rect.
 */
function measure_single_line_text(text_node, line_text) {
    const parent_el = text_node.parentNode;
    if (!parent_el) return [];

    const range = document.createRange();
    range.selectNodeContents(text_node);
    const rects = range.getClientRects();
    if (!rects.length) return [];

    const rect = rects[0];
    const computed_style = window.getComputedStyle(parent_el);
    const font_family = computed_style.fontFamily.replace(/['"]/g, "").split(
        ",",
    )[0].trim();
    const font_size = parseFloat(computed_style.fontSize);
    const line_height_val = computed_style.lineHeight === "normal"
        ? font_size * 1.2
        : parseFloat(computed_style.lineHeight);

    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;

    return [
        {
            type: "TEXT",
            x,
            y,
            width,
            height,
            quad: [x, y, x + width, y, x + width, y + height, x, y + height],
            value: line_text,
            exactLineHeight: line_height_val,
            font: font_family.includes(" ") ? `"${font_family}"` : font_family,
            platformFont: {
                familyName: font_family,
                postScriptName: font_family.replace(/\s+/g, "").replace(
                    /,/g,
                    "-",
                ),
            },
        },
    ];
}

/**
 * Measures a substring of text defined by a start and end offset.
 * @param {Text} text_node - The text node.
 * @param {string} line_text - The text to measure (trimmed).
 * @param {number} start_offset - Start offset within the text node.
 * @param {number} end_offset - End offset within the text node.
 * @returns {object|null} An object with layout info if a rect is found, or null otherwise.
 */
function measure_text_range(text_node, line_text, start_offset, end_offset) {
    const range = document.createRange();
    range.setStart(text_node, start_offset);
    range.setEnd(text_node, end_offset);

    const rects = range.getClientRects();
    if (!rects.length) return null;

    const rect = rects[0];
    const parent_el = text_node.parentNode;
    const computed_style = window.getComputedStyle(parent_el);
    const font_family = computed_style.fontFamily.replace(/['"]/g, "").split(
        ",",
    )[0].trim();
    const font_size = parseFloat(computed_style.fontSize);
    const line_height_val = computed_style.lineHeight === "normal"
        ? font_size * 1.2
        : parseFloat(computed_style.lineHeight);

    return {
        type: "TEXT",
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        quad: [
            rect.x,
            rect.y,
            rect.x + rect.width,
            rect.y,
            rect.x + rect.width,
            rect.y + rect.height,
            rect.x,
            rect.y + rect.height,
        ],
        value: line_text,
        exactLineHeight: line_height_val,
        font: font_family.includes(" ") ? `"${font_family}"` : font_family,
        platformFont: {
            familyName: font_family,
            postScriptName: font_family.replace(/\s+/g, "").replace(/,/g, "-"),
        },
    };
}

/**
 * Extracts line-by-line text info from a Text node, splitting lines by newline.
 * @param {Text} text_node - The text node to process.
 * @returns {Array<object>} An array of measured text line objects.
 */
function get_text_node_info(text_node) {
    let raw_text = text_node.nodeValue;
    if (!raw_text || !raw_text.trim()) return [];

    raw_text = raw_text.replace(/\r\n/g, "\n");
    const lines = raw_text.split("\n");

    if (lines.length === 1) {
        const single_line = lines[0].trim();
        return single_line
            ? measure_single_line_text(text_node, single_line)
            : [];
    }

    const results = [];
    let current_offset = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        const line_length = line.length;
        if (trimmed) {
            const line_start_index = raw_text.indexOf(line, current_offset);
            const line_end_index = line_start_index + line_length;
            const measured = measure_text_range(
                text_node,
                trimmed,
                line_start_index,
                line_end_index,
            );
            if (measured) results.push(measured);
        }
        current_offset += line_length + 1;
    }

    return results;
}

module.exports = {
    measure_single_line_text,
    measure_text_range,
    get_text_node_info,
};
