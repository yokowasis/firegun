#!/bin/bash
npm version patch --force -m "Change Version"
npm run tsc
npm publish
bash clean.sh
git push