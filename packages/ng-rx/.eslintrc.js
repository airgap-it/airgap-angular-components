module.exports = {
  extends: "../../.eslintrc.js",
  parserOptions: {
    project: [
      './packages/ng-rx/tsconfig.lib.json',
      './packages/ng-rx/tsconfig.lib.prod.json',
      './packages/ng-rx/tsconfig.spec.json'
    ],
    sourceType: 'module'
  }
}