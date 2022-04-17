#!/bin/bash
npm version patch
npm run tsc
npm publish
bash clean.sh
