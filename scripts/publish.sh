#!/bin/bash

set -ex

npm run test
npm run build
npm run build-ide
npm publish
