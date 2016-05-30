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
  devtool: 'source-map',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs'
  },

  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      entryOnly: false,

      banner: '\'use strict\';\nconst external = require;\n' +
        'require(\'source-map-support\').install();\n'
    })
  ],

  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: ['eslint'],
        exclude: /node_modules/
      },
    ],

    loaders: [
      {
        test: /\.js$/,
        loader: ['babel'],
        exclude: /node_modules/
      },

      {
        test: /\.json$/,
        loader: ['json']
      }
    ]
  }
};
