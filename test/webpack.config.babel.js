const path = require('path');
const webpack = require('webpack');
const { readdirSync } = require('fs');
const { execSync } = require('child_process');

const externals = {
  ...readdirSync('node_modules')
    .filter(pkg => !/\.bin/g.test(pkg))
    .reduce((hash, pkg) => {
      return {
        ...hash,
        [pkg]: pkg
      };
    }, {}),

  ...readdirSync('test/test-app/node_modules')
    .filter(pkg => !/\.bin/g.test(pkg))
    .reduce((hash, pkg) => {
      return {
        ...hash,
        [pkg]: pkg
      };
    }, {})
};

module.exports = {
  externals,
  target: 'node',

  entry: {
    'helper.js': './test/helper.js',

    ...readdirSync('./test/integration')
      .reduce((hash, pkg) => {
        pkg = `integration/${pkg}`;

        return {
          ...hash,
          [pkg]: `./test/${pkg}`
        };
      }, {}),

    ...readdirSync('./test/unit')
      .reduce((hash, dir) => {
        dir = `unit/${dir}`;

        return {
          ...hash,
          ...readdirSync(`test/${dir}`)
            .reduce((hash, pkg) => {
              pkg = `${dir}/${pkg}`;

              return {
                ...hash,
                [pkg]: `./test/${pkg}`
              };
            }, {})
        };
      }, {}),
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]',
    libraryTarget: 'commonjs'
  },

  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      banner: 'const external = require;\n',
      entryOnly: false
    })
  ],

  module: {
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
