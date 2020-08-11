#!/bin/bash
echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > .npmrc

VERSION=$(node -pe 'JSON.parse(process.argv[1]).version.indexOf("beta")' "$(cat package.json)")

if [ "$VERSION" = "-1" ]
then
  lerna publish from-package --yes
else
  echo "version is beta, using --dist-tag next"
  lerna publish from-package --dist-tag next --yes
fi

rm .npmrc