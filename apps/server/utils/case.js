
/**
 * Converts a kebab-case CSS property to camelCase.
 * @param {string} css_property - The CSS property in kebab-case (e.g., "font-family").
 * @returns {string} The property in camelCase (e.g., "fontFamily").
 */
function to_camel_case(css_property) {
    return css_property.replace(
        /-([a-z])/g,
        (_, letter) => letter.toUpperCase(),
    );
}

module.exports = {
    to_camel_case,
};