const viewportConfigurations = [
  {
    name: "Mobile",
    width: 375,
    height: 667,
    mode: "light", // Options: "light" or "dark"
  },
  {
    name: "Tablet",
    width: 768,
    height: 1024,
    mode: "dark", // Options: "light" or "dark"
  },
  {
    name: "Desktop",
    width: 1920,
    height: 1080,
    mode: "light", // Options: "light" or "dark"
  },
  {
    name: "Wide Desktop",
    width: 2560,
    height: 1440,
    mode: "dark", // Options: "light" or "dark"
  },
];

module.exports = {
  viewportConfigurations,
};
