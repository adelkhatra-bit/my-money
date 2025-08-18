// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true },
  extends: ["react-app", "react-app/jest"],
  plugins: ["import", "react", "react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-unresolved": "error",
    "no-duplicate-imports": "error"
  }
};