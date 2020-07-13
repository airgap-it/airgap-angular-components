module.exports = {
  extends: "../../.eslintrc.js",
  parserOptions: {
    project: [
      './packages/core/tsconfig.lib.json',
      './packages/core/tsconfig.lib.prod.json',
      './packages/core/tsconfig.spec.json'
    ],
    sourceType: 'module'
  }
}