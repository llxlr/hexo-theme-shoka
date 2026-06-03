/* global hexo */

'use strict';
const css = hexo.extend.helper.get('css').bind(hexo);
const js = hexo.extend.helper.get('js').bind(hexo);

// 不蒜子统计
hexo.extend.injector.register('head_end', () => {
  const config = hexo.config;
  const theme = hexo.config.theme_config;

  var vendors = [];

  var busuanzi = theme.vendors.js.busuanzi;
  if(!busuanzi){
    busuanzi = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  }
  vendors.push({ async: true, src: busuanzi });

  if (!(/\.js$/.test(busuanzi))) {
    return js(vendors).replace(/\.js/, '');
  }
  return js(vendors);
})

// 引入 Iconfont JS，支持彩色
hexo.extend.injector.register('head_end', () => {
  const theme = hexo.config.theme_config;
  var vendors = [];
  const iconfont = `//at.alicdn.com/t/c/font_${theme.iconfont}.js`;
  vendors.push({ src: iconfont });
  return js(vendors);
})
