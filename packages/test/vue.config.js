module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // 添加如下代码，注意判别环境
    if (process.env.NODE_ENV === 'development') {
      const DebugPlugin = require('../vue-debug-plugin/lib/index.js');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('../vue-debug-loader/lib/index.js')
        .loader('../vue-debug-loader/lib/index.js')
        .end();
      config.plugin('../vue-debug-plugin/lib/index.js').use(new DebugPlugin());
    }
  },
};
