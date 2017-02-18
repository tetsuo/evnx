#!/bin/bash

set -ex

npm run test
npm run build
npm run build-r2
npm publish
