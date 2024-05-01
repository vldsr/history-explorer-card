const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  output: {
    filename: '../history-explorer-card.js',
  },
  mode: 'production',
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
};