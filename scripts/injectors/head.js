/* global hexo */

'use strict';
const css = hexo.extend.helper.get('css').bind(hexo);
const js = hexo.extend.helper.get('js').bind(hexo);

hexo.extend.injector.register('head_end', () => {
  const config = hexo.config;
  const theme = hexo.config.theme_config;

  var vendors = [];
  
  var busuanzi = theme.vendors.js.busuanzi;
  if(!busuanzi){
    busuanzi = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  }
  vendors.push({ async: true, src: busuanzi });

  return js(vendors);
})
