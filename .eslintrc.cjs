/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [require.resolve('@haydenull/fabric/eslint/react')],
  rules: {
    'react/react-in-jsx-scope': 'off',
  }
}

module.exports = config
