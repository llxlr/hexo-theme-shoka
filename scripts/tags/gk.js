/* global hexo */

/*
{% gk %}
- name: ''
  state: ''
  roles: ''
  works: ''
  loadout: ''
  make: ''
  price: ''
  custom:
    - name: ''
      desc: ''
  images: 
    - url: ''
      style: ''
  links: 
    - name: ''
      url: ''
  comment: ''
{% endgk %}

{% gk [path] %}
*/

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const util = require('hexo-util');

function insertGK(args, content) {
  const theme = hexo.theme.config;

  if(!args[0] && !content) { return }

  if(args[0]) {
    const filepath = path.join(hexo.source_dir, args[0]);
    if(fs.existsSync(filepath)) {
      content = fs.readFileSync(filepath);
    }
  }

  if (!content) { return }

  const list = yaml.load(content);

  var result = '<!-- https://diygod.me/gk/ -->';

  list.forEach(item => {
    if(item.images){
      var tags = '';
      if(item.images.length==1){
        var img = item.images[0];
        tags = util.htmlTag('img', {'data-src': img.url || theme.statics+theme.images+'/404.png', style: img.style || '', alt: img.alt || ''});
      } else {
        item.images.forEach(img => {
          tags += util.htmlTag('img', {'data-src': img.url || theme.statics+theme.images+'/404.png', style: img.style || '', alt: img.alt || ''});
        });
        tags = util.htmlTag('div', {class: 'gallery'}, tags, false);
      }
      var gk_images = util.htmlTag('div', {class: 'gk-img'}, tags, false);
    };

    var data = {
      '名称': item.name,
      '状态': item.state,
      '角色': item.roles,
      '作品': item.works,
      '出荷': item.loadout,
      '时间': item.time,
      '制作': item.make,
      '价格': item.price,
      '处理器': item.cpu,
      '内存': item.ram,
      '显卡 1': item.gpu1,
      '显卡 2': item.gpu2,
      'Wifi': item.wifi,
      '接口': item.interface,
      '尺寸': item.size,
    };

    if(item.custom){
      item.custom.forEach(i => {
        data[i.name]=i.desc
      })
    }

    var desc = '';

    for(var key in data){
      if(!data[key]){
        continue
      }
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, key+'：', false)+`${data[key]}`, false);
    };

    if(item.links){
      var link1 = '';
      item.links.forEach(link => {
        if(link.name && link.url){
          link1 += util.htmlTag('a', {target: '_blank', rel: 'noopener', href: link.url}, link.name, false);
        };
      });
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '链接：')+link1, false);
    };

    if(item.channel){
      var link2 = '';
      item.channel.forEach(link => {
        if(link.name && link.url){
          link2 += util.htmlTag('a', {target: '_blank', rel: 'noopener', href: link.url}, link.name, false);
        };
      });
      desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '渠道：')+link2, false);
    };

    desc += util.htmlTag('p', {}, util.htmlTag('strong', {}, '评价：')+`${item.comment || ''}`, false);

    var descs = util.htmlTag('div', {class: 'gk-desc'}, desc, false);

    result += util.htmlTag('div', {class: 'gk-item'}, gk_images+descs, false);
  });
  return result;
}

hexo.extend.tag.register('gk', insertGK, { ends: true })
hexo.extend.tag.register('gkfile', insertGK, { ends: false, async: true })
