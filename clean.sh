#!/bin/bash
mv webpack.config.js webpack.config.jsx
rm *.js
rm *.map
mv webpack.config.jsx webpack.config.js
