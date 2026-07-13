'use strict';

/**
 * 自动将相邻的 .pan 网盘卡片包裹进 .pan-row 容器，实现多列自适应布局。
 * 用户只需在 Markdown 中连续写 {% pan %} 标签即可，无需手动加 <div class="pan-row">。
 */

const cheerio = require('cheerio');

hexo.extend.filter.register('after_post_render', function (data) {
  // 没有 pan 卡片时跳过，避免不必要的 cheerio 解析
  if (!/<div class="pan"/.test(data.content)) return data;

  const $ = cheerio.load(data.content, { decodeEntities: false });

  // 收集所有 .pan 元素，按父节点分组
  const parents = new Map();
  $('.pan').each(function () {
    const el = $(this);
    const parent = el.parent();
    const key = parent.length ? parent.get(0) : null;
    if (!parents.has(key)) parents.set(key, []);
    parents.get(key).push(el);
  });

  parents.forEach((pans) => {
    if (pans.length < 2) return; // 单独的 pan 不需要包裹

    // 将 pans 按连续相邻分组
    const groups = [];
    let currentGroup = [pans[0]];

    for (let i = 1; i < pans.length; i++) {
      const prev = pans[i - 1];
      const curr = pans[i];
      if (prev.get(0).nextSibling === curr.get(0) || isConsecutivePan(prev, curr)) {
        currentGroup.push(curr);
      } else {
        groups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    groups.push(currentGroup);

    // 对每个连续组（≥2个）包裹 .pan-row
    groups.forEach(group => {
      if (group.length < 2) return;
      const first = group[0];
      first.before('<div class="pan-row">');
      const wrapper = first.prev();
      group.forEach(pan => {
        wrapper.append(pan);
      });
    });
  });

  data.content = $('body').html();
  return data;
});

/**
 * 检查 prev 和 curr 是否在 DOM 中是连续的（中间只隔着空白文本节点）。
 */
function isConsecutivePan(prev, curr) {
  let node = prev.get(0).nextSibling;
  while (node) {
    if (node === curr.get(0)) return true;
    // 跳过空白文本节点
    if (node.type === 'text' && /^\s*$/.test(node.data)) {
      node = node.nextSibling;
      continue;
    }
    // 遇到非空白的其他节点，不连续
    return false;
  }
  return false;
}
