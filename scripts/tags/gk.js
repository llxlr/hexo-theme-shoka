/* global hexo */

/*
字段配置见 source/_data/gk.yml，支持按 type 分区。

用法：
  {% gk "section" %}              — 内联 YAML，指定默认 section
  {% gkfile "path" "section" %}   — 从文件加载，指定默认 section
  每个条目可通过 type 字段覆盖 section：
    - name: xxx
      type: desktop
      cpu: i9-13900K
*/

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const util = require('hexo-util');

// 缓存字段配置，避免每次调用重复读取
let sectionsCache = null;
let sectionsLoaded = false;

function loadSections(sourceDir) {
  if (sectionsLoaded) return sectionsCache;
  sectionsLoaded = true;
  const configPath = path.join(sourceDir, '_data/gk.yml');
  if (fs.existsSync(configPath)) {
    sectionsCache = yaml.load(fs.readFileSync(configPath));
  }
  return sectionsCache;
}

// 渲染单张图片
function renderImage(img, fallbackSrc) {
  return util.htmlTag('img', {
    'data-src': img.url || fallbackSrc,
    style: img.style || '',
    alt: img.alt || ''
  });
}

// 渲染一组链接（links / channel）
function renderLinkGroup(links) {
  let result = '';
  links.forEach(link => {
    if (link.name && link.url) {
      result += util.htmlTag('a', {
        target: '_blank',
        rel: 'noopener',
        href: link.url
      }, link.name, false);
    }
  });
  return result;
}

function insertGK(args, content) {
  const theme = hexo.theme.config;

  if (!args[0] && !content) return;

  const defaultSection = args[1] || 'default';

  if (args[0]) {
    const filepath = path.join(hexo.source_dir, args[0]);
    if (fs.existsSync(filepath)) {
      content = fs.readFileSync(filepath);
    }
  }

  if (!content) return;

  const sections = loadSections(hexo.source_dir);
  const list = yaml.load(content);
  const fallbackSrc = theme.statics + theme.images + '/404.png';

  let result = '<!-- https://diygod.me/gk/ -->';

  list.forEach(item => {
    // 图片
    let gkImages = '';
    if (item.images) {
      let tags = '';
      if (item.images.length === 1) {
        tags = renderImage(item.images[0], fallbackSrc);
      } else {
        item.images.forEach(img => { tags += renderImage(img, fallbackSrc); });
        tags = util.htmlTag('div', { class: 'gallery' }, tags, false);
      }
      gkImages = util.htmlTag('div', { class: 'gk-img' }, tags, false);
    }

    // 字段映射
    const sectionName = item.type || defaultSection;
    const fields = (sections && sections[sectionName]) || null;

    const data = {};

    if (fields) {
      fields.forEach(f => {
        if (item[f.key]) data[f.label] = item[f.key];
      });
    }

    if (item.custom) {
      item.custom.forEach(i => { data[i.name] = i.desc; });
    }

    // 描述
    let desc = '';
    Object.keys(data).forEach(key => {
      if (!data[key]) return;
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, key + '：', false) + `${data[key]}`, false);
    });

    // 链接 / 渠道
    if (item.links) {
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '链接：') + renderLinkGroup(item.links), false);
    }

    if (item.channel) {
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '渠道：') + renderLinkGroup(item.channel), false);
    }

    // 评价
    desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '评价：') + `${item.comment || ''}`, false);

    const descs = util.htmlTag('div', { class: 'gk-desc' }, desc, false);

    result += util.htmlTag('div', { class: 'gk-item' }, gkImages + descs, false);
  });

  return result;
}

hexo.extend.tag.register('gk', insertGK, { ends: true });
hexo.extend.tag.register('gkfile', insertGK, { ends: false, async: true });
