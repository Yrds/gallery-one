const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  module: {
     rules: [
       {
         test: /\.(js|jsx|tsx|ts)$/,
         exclude: /node_modules/,
         loader: 'babel-loader',
         options: {
           presets: [
             "@babel/preset-env",
             "@babel/preset-typescript"
           ],
           plugins: [
             [
               "@babel/plugin-transform-runtime",
               {
                 "corejs": 3
               }
             ]
           ]
         }
       }
     ],
  },
  resolve: {
    extensions: ['.js', 'jsx', 'tsx', '.ts'],
  },
  output: {
    filename: 'gallery-one.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
