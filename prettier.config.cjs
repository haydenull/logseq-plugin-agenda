/** @type {import("prettier").Config} */
const config = {
  plugins: [
    require.resolve("prettier-plugin-tailwindcss"),
    require.resolve('prettier-plugin-organize-imports')
  ],
  singleQuote: true,
  jsxSingleQuote: false,
  semi: false,
  printWidth: 120,
};

module.exports = config;
