/** @type {import("prettier").Config} */
const prettier = require("@haydenull/fabric/prettier");
const config = {
  ...require("@haydenull/fabric/prettier"),
  // importOrder: ['^@logseq/(.*)$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
};

module.exports = config;
