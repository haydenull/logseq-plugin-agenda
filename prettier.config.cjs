/** @type {import("prettier").Config} */
const config = {
  ...require("@haydenull/fabric/prettier"),
  // importOrder: ['^@logseq/(.*)$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
};

module.exports = config;
