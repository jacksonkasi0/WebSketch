/**
 * @file extract_styles.js
 * @description Provides utility functions for extracting and processing inline styles from DOM elements.
 */

const { to_camel_case } = require("../utils/case");


/**
 * Simplifies the 'box-shadow' value by extracting only the color and offset information for the first shadow.
 * @param {string} box_shadow_value - The computed 'box-shadow' value (e.g., "rgba(...) 0px 4px 6px").
 * @returns {string} A simplified 'box-shadow' string or an empty string if invalid.
 */
function format_box_shadow(box_shadow_value) {
    if (!box_shadow_value || box_shadow_value === "none") return "";

    const first_shadow = box_shadow_value.split(",")[0].trim().split(/\s+/);
    let color_part = "";
    const offsets = [];

    for (const chunk of first_shadow) {
        if (chunk.includes("rgb")) {
            color_part = chunk;
        } else {
            offsets.push(chunk);
        }
    }

    // Must have at least color + 3 offsets. If only 3 offsets, add a default 0px for the 4th.
    if (!color_part || offsets.length < 3) return "";
    if (offsets.length === 3) offsets.push("0px");

    return [color_part, offsets.join(" ")].join(" ");
}

/**
 * Attempts to combine individual CSS properties into relevant shorthand properties
 * (e.g., margin, padding, borderWidth, etc.).
 * @param {Record<string, string>} styles - Object containing camelCase style keys and their values.
 */
function add_shorthand_properties(styles) {
    // Margin
    if (
        "marginTop" in styles &&
        "marginRight" in styles &&
        "marginBottom" in styles &&
        "marginLeft" in styles
    ) {
        const {
            marginTop: mt,
            marginRight: mr,
            marginBottom: mb,
            marginLeft: ml,
        } = styles;
        if (mt === mb && mr === ml) {
            styles.margin = mt === mr ? mt : `${mt} ${mr}`;
        } else {
            styles.margin = `${mt} ${mr} ${mb} ${ml}`;
        }
    }

    // Padding
    if (
        "paddingTop" in styles &&
        "paddingRight" in styles &&
        "paddingBottom" in styles &&
        "paddingLeft" in styles
    ) {
        const {
            paddingTop: pt,
            paddingRight: pr,
            paddingBottom: pb,
            paddingLeft: pl,
        } = styles;
        if (pt === pb && pr === pl) {
            styles.padding = pt === pr ? pt : `${pt} ${pr}`;
        } else {
            styles.padding = `${pt} ${pr} ${pb} ${pl}`;
        }
    }

    // Border Width
    if (
        "borderTopWidth" in styles &&
        "borderRightWidth" in styles &&
        "borderBottomWidth" in styles &&
        "borderLeftWidth" in styles
    ) {
        const {
            borderTopWidth: btw,
            borderRightWidth: brw,
            borderBottomWidth: bbw,
            borderLeftWidth: blw,
        } = styles;
        if (btw === bbw && brw === blw) {
            styles.borderWidth = btw === brw ? btw : `${btw} ${brw}`;
        } else {
            styles.borderWidth = `${btw} ${brw} ${bbw} ${blw}`;
        }
    }

    // Border Style
    if (
        "borderTopStyle" in styles &&
        "borderRightStyle" in styles &&
        "borderBottomStyle" in styles &&
        "borderLeftStyle" in styles
    ) {
        const {
            borderTopStyle: bts,
            borderRightStyle: brs,
            borderBottomStyle: bbs,
            borderLeftStyle: bls,
        } = styles;
        if (bts === bbs && brs === bls) {
            styles.borderStyle = bts === brs ? bts : `${bts} ${brs}`;
        } else {
            styles.borderStyle = `${bts} ${brs} ${bbs} ${bls}`;
        }
    }

    // Border Color
    if (
        "borderTopColor" in styles &&
        "borderRightColor" in styles &&
        "borderBottomColor" in styles &&
        "borderLeftColor" in styles
    ) {
        const {
            borderTopColor: btc,
            borderRightColor: brc,
            borderBottomColor: bbc,
            borderLeftColor: blc,
        } = styles;
        if (btc === bbc && brc === blc) {
            styles.borderColor = btc === brc ? btc : `${btc} ${brc}`;
        } else {
            styles.borderColor = `${btc} ${brc} ${bbc} ${blc}`;
        }
    }

    // Border Radius
    if (
        "borderTopLeftRadius" in styles &&
        "borderTopRightRadius" in styles &&
        "borderBottomRightRadius" in styles &&
        "borderBottomLeftRadius" in styles
    ) {
        const {
            borderTopLeftRadius: tlr,
            borderTopRightRadius: trr,
            borderBottomRightRadius: brr,
            borderBottomLeftRadius: blr,
        } = styles;
        if (tlr === trr && trr === brr && brr === blr) {
            styles.borderRadius = tlr;
        }
    }
}

/**
 * Extracts computed styles from a DOM element and converts them into a simplified object.
 * @param {HTMLElement} element - The DOM element to extract style information from.
 * @returns {Record<string, string>} A map of camelCase style names to their values.
 */
function extract_element_styles(element) {
    const computed_style = window.getComputedStyle(element);
    const styles = {};

    for (let i = 0; i < computed_style.length; i++) {
        const property_name = computed_style.item(i);
        let property_value = computed_style.getPropertyValue(property_name);

        const camel_prop = to_camel_case(property_name);
        if (
            camel_prop === "boxShadow" && property_value &&
            property_value !== "none"
        ) {
            property_value = format_box_shadow(property_value);
        }

        // Only keep non-empty values
        if (property_value) {
            // Attempt to wrap font-family in quotes if it has spaces
            if (camel_prop === "fontFamily" && property_value.includes(" ")) {
                property_value = `"${property_value}"`;
            }
            styles[camel_prop] = property_value;
        }
    }

    // Combine into shorthand properties where possible
    add_shorthand_properties(styles);
    return styles;
}

module.exports = {
    format_box_shadow,
    add_shorthand_properties,
    extract_element_styles,
};
