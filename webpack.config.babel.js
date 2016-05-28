const path = require('path');
const webpack = require('webpack');
const { readdirSync } = require('fs');

const externals = readdirSync('node_modules')
  .filter(pkg => !/\.bin/g.test(pkg))
  .reduce((hash, pkg) => {
    return {
      ...hash,
      [pkg]: pkg
    };
  }, {});

module.exports = {
  externals,
  entry: './src/index.js',
  target: 'node',
  devtool: 'sourcemap',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs'
  },

  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      entryOnly: true,

      banner: '\'use strict\'; require(\'source-map-support\').install(); ' +
        'const external = require;',
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },

      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  }
};
