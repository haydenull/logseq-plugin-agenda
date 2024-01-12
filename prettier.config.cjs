/** @type {import("prettier").Config} */
const config = {
  ...require("@haydenull/fabric/prettier"),
  // importOrder: ['^@logseq/(.*)$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['cn', 'clsx'],
};

module.exports = config;
