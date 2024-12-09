// utils/pageScripts.js
const { toCamelCase, extractAllStyles } = require("./styles");
const { getTextNodeInfo } = require("./text");
const { getNodeInfo } = require("./dom");
const { getDocInfo } = require("./document");

function getPageScript() {
  return `
    ${toCamelCase.toString()}
    ${extractAllStyles.toString()}
    ${getTextNodeInfo.toString()}
    ${getNodeInfo.toString()}
    ${getDocInfo.toString()}
  `;
}

module.exports = {
  getPageScript,
};
