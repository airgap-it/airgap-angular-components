module.exports = {
  extends: "../../.eslintrc.js",
  parserOptions: {
    project: [
      './tsconfig.lib.json',
      './tsconfig.lib.prod.json',
      './tsconfig.spec.json'
    ],
    sourceType: 'module',
    tsconfigRootDir: __dirname
  }
}