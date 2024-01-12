const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './src/index.js'),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ],
      }
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'dmwidgets.js',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devServer: {
    static: path.resolve(__dirname, './dist'),
    port: 8001,
    hot: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
};
