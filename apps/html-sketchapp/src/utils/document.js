// utils/document.js

// const { toCamelCase } = require("./styles");

// Convert kebab-case CSS properties to camelCase
function toCamelCase(prop) {
    return prop.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }


function getDocInfo() {
  const docStyleKeys = [
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

  const docComputedStyle = window.getComputedStyle(document.documentElement);
  const docStylesRaw = {};

  docStyleKeys.forEach((k) => {
    const val = docComputedStyle.getPropertyValue(k);
    if (val && val.trim() !== "") {
      const camelProp = toCamelCase(k);
      docStylesRaw[camelProp] = val;
    }
  });

  const bodyBg = window.getComputedStyle(document.body).backgroundColor;

  return {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    fontSize: parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    ),
    baseURI: document.baseURI,
    bgColor: bodyBg,
    styles: docStylesRaw,
  };
}

module.exports = {
  getDocInfo,
};
