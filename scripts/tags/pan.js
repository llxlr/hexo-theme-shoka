/* global hexo */

/*
{% pan <type> <title> <size> [logo] <link> [code] %} 
*/

'use strict';

const path = require('path');
const util = require('hexo-util');
const { parseArgs } = require('./utils');

const list = ['type', 'title', 'size', 'logo', 'link', 'code'];
const panList = {
  baidu: { name: '百度网盘', image: 'baiduyun.png' },
  weiyun: { name: '腾讯微云', image: 'weiyun.png' },
  onedrive: { name: 'OneDrive', image: 'onedrive.png' },
  139: { name: '和彩云', image: '139.png' },
  189: { name: '天翼云', image: '189.png' },
  aliyun: { name: '阿里云盘', image: 'aliyundrive.png' },
  115: { name: '115网盘', image: '115.png' },
  jianguoyun: { name: '坚果云', image: 'jianguoyun.png' },
  360: { name: '360安全云盘', image: '360.png' },
  123: { name: '123云盘', image: '123.png' },
  qiniu: { name: '七牛云', image: 'qiniu.png' },
  github: { name: 'GitHub', image: 'github.png' },
  lanzou: { name: '蓝奏云', image: 'lanzou.png' },
  doge: { name: '多吉云', images: 'dogecloud.png' },
};

hexo.extend.injector.register('body_end', `<script data-pjax>
let pan = document.getElementsByClassName('pan');
for (let i = 0; i < pan.length; i++) {
  let code = pan[i].getAttribute('data-code');
  let link = pan[i].getAttribute('data-link');
  if (!code && !link) continue;
  pan[i].addEventListener('click', function(){
    window.setTimeout(function(){
      if (code) copyCode(code, link);
      window.open(link, '_blank');
    }, 3000);
  });
}

function copyCode(code) {
  let input = document.createElement('input');
  input.value = code;
  document.body.appendChild(input);
  input.select();
  document.execCommand('Copy');
  input.className = 'input';
  input.style.display = 'none';
};
</script>`);

hexo.extend.tag.register('pan', (args) => {
  if (!args[0]) return;

  const params = parseArgs(args, list);
  const theme = hexo.theme.config;

  let pan = panList[params.type];
  if (!pan) return;

  let logo = params.logo || path.join(theme.statics, theme.images, 'pan', pan.image).replace(/\\/g, '/');
  let code = params.code || '';

  let pan_logo = util.htmlTag('span', {class: 'pan-logo', style: `background-image: url(${logo});`}, '');
  let title = util.htmlTag('span', {class: 'pan-title'}, `<span class="title">${params.title}</span>`, false);
  let size = util.htmlTag('span', {class: 'pan-desc'}, `<span class="pan-size">${params.size}</span><span>来自：${pan.name}</span>`, false);
  let content_info = util.htmlTag('span', {class: 'pan-content-info'}, pan_logo+title+size, false);

  let info = code ? util.htmlTag('span', {class: 'code-info'}, '提取码：'+code): '';
  let btn = util.htmlTag('span', {class: 'code-btn'}, code ? '复制提取码跳转': '点击跳转网盘');
  let pan_code = util.htmlTag('span', {class: 'pan-code'+(code ? '': ' pan-no-code')}, info+btn, false);
  let content_code = util.htmlTag('span', {class: 'pan-content-code'}, pan_code, false);

  return util.htmlTag('div', {
    class: 'pan',
    'data-type': params.type,
    'data-title': params.title,
    'data-size': params.size,
    'data-logo': logo,
    'data-link': params.link,
    'data-code': params.code,
  }, content_info+content_code, false);
}, { ends: false })
