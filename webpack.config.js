const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  plugins : [
    new NodePolyfillPlugin()    
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      "zlib": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": require.resolve("crypto-browserify"),
    } 
  }, 
  optimization : {
    minimize : true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },  
  entry: './entry.ts',
  output: {
    path: path.resolve(__dirname, 'public','dist'),
    filename: 'bundle.js',
  },
};