const { get_node_info } = require("./extract_node_info");

/**
 * Gathers document-level style information (e.g., background, baseURI, etc.).
 * @returns {object} An object containing relevant document style metadata.
 */
function get_document_info() {
  const doc_style_keys = [
    "background",
    "backgroundAttachment",
    "backgroundBlendMode",
    "backgroundClip",
    "backgroundColor",
    "backgroundImage",
    "backgroundOrigin",
    "backgroundPosition",
    "backgroundPositionX",
    "backgroundPositionY",
    "backgroundRepeat",
    "backgroundSize",
  ];
  const doc_computed_style = window.getComputedStyle(document.documentElement);
  const doc_styles_raw = {};

  doc_style_keys.forEach((key) => {
    const value = doc_computed_style.getPropertyValue(key);
    if (value && value.trim() !== "") {
      // For demonstration, just store them in camel form:
      const camel_key = key.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      doc_styles_raw[camel_key] = value;
    }
  });

  const body_bg = window.getComputedStyle(document.body).backgroundColor;

  return {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    fontSize: parseFloat(doc_computed_style.fontSize),
    baseURI: document.baseURI,
    bgColor: body_bg,
    styles: doc_styles_raw,
  };
}

/**
 * Collects overall page data by grabbing doc info and recursively extracting DOM node info.
 * @returns {object} A structured object containing document metadata, DOM structure, etc.
 */
function collect_page_data() {
  const doc_info = get_document_info();
  const body_info = get_node_info(document.body) || {};

  return {
    doc: doc_info,
    frame: body_info,
    fonts: [],
    assets: {},
    name: window.location.href,
    width: window.innerWidth,
    height: window.innerHeight,
    theme: "light",
  };
}

module.exports = {
  get_document_info,
  collect_page_data,
};
