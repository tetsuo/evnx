#!/bin/bash

npm run clean
npm run build
npm run test

npm run clean
npm run build

npm run publish
