/** @type {import("prettier").Config} */
const config = {
  plugins: [
    require.resolve("prettier-plugin-tailwindcss"),
    require.resolve('prettier-plugin-organize-imports'),
    "@trivago/prettier-plugin-sort-imports"
  ],
  singleQuote: true,
  jsxSingleQuote: false,
  semi: false,
  printWidth: 120,
  importOrder: ['^@logseq/(.*)$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
};

module.exports = config;
