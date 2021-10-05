const path = require('path');

module.exports = {
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
      "crypto": false,
    } 
  }, 
  optimization : {
    minimize : false
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
  entry: './entry.js',
  output: {
    path: path.resolve(__dirname, 'public','dist'),
    filename: 'bundle.js',
  },
};