# @airgap/angular-ngrx

[![npm](https://img.shields.io/npm/v/@airgap/angular-ngrx.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/ngrx)
[![build](https://img.shields.io/travis/airgap-it/angular-ngrx.svg)](https://travis-ci.org/airgap-it/angular-ngrx/)
[![codecov](https://img.shields.io/codecov/c/gh/airgap-it/angular-ngrx.svg)](https://codecov.io/gh/airgap-it/angular-ngrx/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

`@airgap/angular-ngrx` extends `@airgap/angular-core` providing [NgRx](https://ngrx.io/) support for its components.

## Requirements

Please check `peerDependencies` in `package.json` to see what dependencies are required for this library.

## Install

```
$ npm install --save @airgap/angular-ngrx
```

## Development

### Requirements

Make sure you have statisfied the following requirements before building or testing the project:

```
npm >= 6
```

### Build

Before building the library make sure you have installed the root project dependencies. If not, run:

```
$ cd ../..
$ npm install
$ cd packages/ngrx
```

To build the `ngrx` library run:

```
$ npm run build
```

### Run Tests

Before running the tests make sure you have installed the root project dependencies. If not, run:

```
$ cd ../..
$ npm install
$ cd packages/ngrx
```

To run tests for the `ngrx` library run:

```
$ npm run test
```
