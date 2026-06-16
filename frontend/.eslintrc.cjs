module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: false,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/set-state-in-effect": "warn",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-constant-condition": "warn",
  },
};
