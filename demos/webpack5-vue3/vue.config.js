const { CodeInspectorPlugin } = require('code-inspector-plugin');

module.exports = {
  configureWebpack: {
    devtool: 'source-map', // 或 'cheap-module-eval-source-map' 用于更快的构建速度
  },
  // ...other code
  chainWebpack: (config) => {
    // add this configuration in the development environment
    // config.plugin('webpack-code-inspector-plugin').use(
    //   CodeInspectorPlugin({
    //     bundler: 'webpack',
    //   })
    // );
  },
};
