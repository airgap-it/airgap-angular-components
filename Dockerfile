FROM node:20

# Chrome needs these to run the bundled Chromium that Puppeteer installs.
# See https://crbug.com/795759
RUN apt-get update \
  && apt-get install -yq --no-install-recommends \
    build-essential \
    bzip2 \
    git \
    libgconf-2-4 \
    libxtst6 \
  && rm -rf /var/lib/apt/lists/*

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst  libglu1 fonts-freefont-ttf libxss1 libglib2.0-0 libxshmfence1 libglu1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get purge --auto-remove -y curl \
  && rm -rf /src/*.deb

# create libs directory, owned by the unprivileged user the build runs as
RUN mkdir /libs && chown node:node /libs
WORKDIR /libs

# the image only ever builds, tests and publishes; it exposes no service
HEALTHCHECK NONE

USER node

# copy sources
COPY --chown=node:node . /libs

# set permissions
RUN chmod +x ./npm-ci-publish-beta-only.sh
RUN chmod +x ./npm-ci-publish.sh

# install dependencies
RUN npm install --legacy-peer-deps

# set to production
RUN export NODE_ENV=production

# build
RUN npm run build:prod

CMD ["npm", "run", "test"]
