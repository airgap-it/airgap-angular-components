# AirGap Angular Components

A set of Angular libraries providing utilities, UI components and services used across various [AirGap](https://airgap.it/) projects.

## Overview

The project is split into the following packages:

- `core`
- `ngrx`

The `core` package consists of numerous utility functions and types as well as Angular components and services that can be used standalone or as a base for more specific implementations.

The `ngrx` package extends `core` providing [NgRx](https://ngrx.io/) support for its components.

For more information about a specific package, go to its respective folder in the `packages` directory.

## Development

### Requirements

Make sure you have statisfied the following requirements before building or testing the project:

```
npm >= 6
```

### Build

To build all the packages run:

```
$ npm install
$ npm run build
```

### Run Tests

To run tests for all the packages run:

```
$ npm install
$ npm run test
```

### Update Version

To bump the version of all the packages run:

```
$ npm run bump:version
```

You will be prompted to select the desired version.

You can also run one of the commands listed below to skip the prompt and bump the version directly:

```
$ npm run bump:major
> v1.0.0 -> v2.0.0

$ npm run bump:minor
> v1.0.0 -> v1.1.0

$ npm run bump:patch
> v1.0.0 -> v1.0.1

$ npm run bump:beta
> v1.0.0 -> v1.0.1-beta.0
```

### Other

The project uses [lerna](https://lerna.js.org/) for package management. Check out [the list of available commands](https://lerna.js.org/#commands) to perform more advanced actions.