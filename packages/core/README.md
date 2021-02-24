# @airgap/angular-core

[![npm](https://img.shields.io/npm/v/@airgap/angular-core.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/angular-core)
[![build](https://img.shields.io/travis/airgap-it/angular-core.svg)](https://travis-ci.org/airgap-it/angular-core/)
[![codecov](https://img.shields.io/codecov/c/gh/airgap-it/angular-core.svg)](https://codecov.io/gh/airgap-it/angular-core/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

`@airgap/angular-core` consists of numerous utility functions and types as well as Angular components and services that can be used standalone in Angular based projects or as a base for more specific implementations.

## Requirements

Please check `peerDependencies` in `package.json` to see what dependencies are required for this library.

## Install

```
$ npm install --save @airgap/angular-core
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
$ cd packages/core
```

To build the `core` library run:

```
$ npm run build
```

### Run Tests

Before running the tests make sure you have installed the root project dependencies. If not, run:

```
$ cd ../..
$ npm install
$ cd packages/core
```

To run tests for the `core` library run:

```
$ npm run test
```
