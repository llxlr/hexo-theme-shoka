/* global hexo */

/*
{% pan <type> <title> <size> [logo] <link> [code] %}
*/

'use strict';

const fs = require('hexo-fs');
const path = require('path');
const yaml = require('js-yaml');
const util = require('hexo-util');
const { parseArgs } = require('./utils');

const list = ['type', 'title', 'size', 'logo', 'link', 'code'];

let panListCache = null;
let panListLoaded = false;

function loadPanList(sourceDir) {
  if (panListLoaded) return panListCache;
  panListLoaded = true;
  const configPath = path.join(sourceDir, '_data/pan.yml');
  if (fs.existsSync(configPath)) {
    panListCache = yaml.load(fs.readFileSync(configPath));
  }
  return panListCache;
}

hexo.extend.tag.register('pan', (args) => {
  if (!args[0]) return;

  const params = parseArgs(args, list);
  const theme = hexo.theme.config;

  let panList = loadPanList(hexo.source_dir);
  let pan = panList[params.type];
  if (!pan) return;

  let logo = params.logo || path.join(theme.statics, theme.images, 'pan', pan.image).replace(/\\/g, '/');
  let code = params.code || '';

  let pan_logo = util.htmlTag('span', {class: 'pan-logo', style: `background-image: url(${logo});`}, '');
  let title = util.htmlTag('span', {class: 'pan-title'}, `<span class="title">${params.title}</span>`, false);
  let size = util.htmlTag('span', {class: 'pan-desc'}, `<span class="pan-size">${params.size}</span><span>来自：${pan.name}</span>`, false);
  let content_info = util.htmlTag('span', {class: 'pan-content-info'}, pan_logo+title+size, false);

  let info = code ? util.htmlTag('label', {class: 'code-info'}, `<input type="checkbox" class="code-toggle" hidden/><span class="code-text">提取码：${code}</span>`, false): '';
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
