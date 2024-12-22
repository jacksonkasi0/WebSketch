/**
 * @file extract_node_info.js
 * @description Recursively gathers layout and style information from DOM nodes and their children.
 */

const { extract_element_styles } = require("./extract_styles");
const { get_text_node_info } = require("./extract_text");

/**
 * Determines if an element should be skipped during extraction (e.g., <style> or <script>).
 * @param {HTMLElement} el - The DOM element to check.
 * @returns {boolean} True if the element should be skipped, otherwise false.
 */
function should_skip_element(el) {
    const tag_name = el.tagName.toLowerCase();
    return tag_name === "style" || tag_name === "script";
}

/**
 * Recursively collects node information, including child nodes and text content.
 * @param {Node} node - The DOM node to process.
 * @returns {object|object[]|null} A structured object describing the node/children, array for text lines, or null if skipped.
 */
function get_node_info(node) {
    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
        return get_text_node_info(node);
    }

    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (should_skip_element(el)) return null;

        const rect = el.getBoundingClientRect();
        const attributes = {};

        for (let i = 0; i < el.attributes.length; i++) {
            const { name, value } = el.attributes[i];
            attributes[name] = value;
        }

        const children_nodes = [];
        el.childNodes.forEach((child) => {
            const child_info = get_node_info(child);
            if (Array.isArray(child_info)) {
                children_nodes.push(...child_info);
            } else if (child_info) {
                children_nodes.push(child_info);
            }
        });

        const tag_lower = el.tagName.toLowerCase();
        let element_type = "FRAME";
        if (tag_lower === "img") element_type = "IMAGE";
        if (tag_lower === "svg") element_type = "SVG";

        const node_info = {
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
            type: element_type,
            tag: tag_lower,
        };

        if (Object.keys(attributes).length > 0) node_info.attr = attributes;

        const class_list = Array.from(el.classList);
        if (class_list.length > 0) node_info.classList = class_list;

        const styles = extract_element_styles(el);
        if (Object.keys(styles).length > 0) node_info.styles = styles;

        if (children_nodes.length > 0) node_info.children = children_nodes;
        if (el === document.scrollingElement) node_info.isScrollingElt = true;

        return node_info;
    }

    return null;
}

module.exports = {
    should_skip_element,
    get_node_info,
};
