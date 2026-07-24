'use strict';

/**
 * {% friend_generator %}
 *
 * 友链生成器 — 左右两栏表单 + 实时预览 + 一键复制/粘贴
 */

function friendGenerator() {
  return `
<div id="friend-generator">
  <div class="fg-grid">
    <div class="fg-form">
      <div class="fg-row">
        <div class="fg-field">
          <label for="fg-site">站点名称</label>
          <input id="fg-site" type="text" placeholder="白色相簿" autocomplete="off">
        </div>
        <div class="fg-field">
          <label for="fg-owner">昵称</label>
          <input id="fg-owner" type="text" placeholder="星旅人" autocomplete="off">
        </div>
      </div>
      <div class="fg-field">
        <label for="fg-url">站点地址</label>
        <input id="fg-url" type="url" placeholder="https://your-site.com" autocomplete="off">
      </div>
      <div class="fg-field">
        <label for="fg-desc">站点简介</label>
        <textarea id="fg-desc" rows="2" placeholder="一句话描述..."></textarea>
      </div>
      <div class="fg-row">
        <div class="fg-field">
          <label for="fg-image">头像链接</label>
          <input id="fg-image" type="url" placeholder="https://..." autocomplete="off">
        </div>
        <div class="fg-field">
          <label for="fg-color">主题色</label>
          <div class="fg-color-group">
            <span class="fg-color-picker-wrap">
              <input id="fg-color" type="color" value="#ffc0cb">
            </span>
            <input id="fg-color-text" type="text" value="#ffc0cb" autocomplete="off">
          </div>
        </div>
      </div>
    </div>
    <div class="fg-preview">
      <div class="fg-preview-header">
        <span>配置预览</span>
        <span class="fg-preview-btns">
          <button id="fg-copy-btn" type="button">复制配置</button>
          <button id="fg-paste-btn" type="button">一键粘贴</button>
        </span>
      </div>
      <div class="fg-highlight">
        <div class="fg-figcaption">
          <span>友链格式</span>
        </div>
        <pre class="fg-code" data-language="yml"><code id="fg-preview-code"></code></pre>
      </div>
      <div class="fg-card-preview">
        <a class="fg-card-thumb" target="_blank"><img id="fg-card-img" src="" alt=""></a>
        <div class="fg-card-info">
          <a id="fg-card-title" class="fg-card-title" target="_blank"></a>
          <span id="fg-card-desc" class="fg-card-desc"></span>
        </div>
      </div>
    </div>
  </div>
</div>
<script data-pjax>
(function() {
  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  var els = {
    site:      document.getElementById('fg-site'),
    owner:     document.getElementById('fg-owner'),
    url:       document.getElementById('fg-url'),
    desc:      document.getElementById('fg-desc'),
    image:     document.getElementById('fg-image'),
    color:     document.getElementById('fg-color'),
    colorText: document.getElementById('fg-color-text'),
    preview:   document.getElementById('fg-preview-code'),
    copyBtn:   document.getElementById('fg-copy-btn'),
    cardThumb: document.querySelector('.fg-card-thumb'),
    cardImg:   document.getElementById('fg-card-img'),
    cardTitle: document.getElementById('fg-card-title'),
    cardDesc:  document.getElementById('fg-card-desc')
  };

  var defaults = {
    site:  '白色相簿',
    owner: '星旅人',
    url: 'https://white-album.top',
    desc: '梦里不觉秋已深，余情岂是为他人',
    image: 'https://white-album.top/favicon.ico',
    color: '#ffc0cb'
  };

  function getVal(id) { return (els[id] && els[id].value) || defaults[id]; }

  function updateCard() {
    var site  = getVal('site')  || '站点名称';
    var desc  = getVal('desc')  || '一句话描述...';
    var image = getVal('image');
    var color = getVal('color') || '#ffc0cb';
    var url   = getVal('url');
    if (els.cardThumb) {
      els.cardThumb.href = url || '#';
    }
    if (els.cardImg) {
      els.cardImg.src = image || '';
    }
    if (els.cardTitle) {
      els.cardTitle.textContent = site;
      els.cardTitle.href = url || '#';
    }
    if (els.cardDesc)  els.cardDesc.textContent  = desc;
    var cardPreview = document.querySelector('.fg-card-preview');
    if (cardPreview) {
      cardPreview.style.setProperty('--card-color', color);
    }
  }

  function buildYAML() {
    return [
      '- site: '   + (getVal('site')  || '#网站名字'),
      '  owner: '  + (getVal('owner') || '#您的名字'),
      '  url: '    + (getVal('url')   || '#您的网址'),
      '  desc: '   + (getVal('desc')  || '#简短描述'),
      '  image: '  + (getVal('image') || '#一张图片'),
      '  color: '  + (getVal('color') || '#方块颜色')
    ].join('\\n');
  }

  function buildMarkdown() {
    return '\`\`\`yml\\n' + buildYAML() + '\\n\`\`\`';
  }

  function highlightYAML(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(#.*)$/gm, '<span class="token comment">$1</span>')
      .replace(/^(- site|  owner|  url|  desc|  image|  color)(:)/gm,
        '<span class="token attr-name">$1</span>$2')
      .replace(/:\\s+(".+?"|'.+?'|[^"'\\s].*)$/gm,
        ': <span class="token string">$1</span>');
  }

  function buildPreviewHTML() {
    return highlightYAML(buildYAML());
  }

  function copyToClipboard(text) {
    if (!navigator.clipboard) { return; }
    var blob = new Blob([text], { type: 'text/plain' });
    var item = new ClipboardItem({ 'text/plain': blob });
    return navigator.clipboard.write([item]);
  }

  var updatePreview = debounce(function() {
    if (els.preview) {
      els.preview.innerHTML = buildPreviewHTML();
    }
    updateCard();
  }, 150);

  Object.keys(els).forEach(function(k) {
    var el = els[k];
    if (!el || k === 'preview' || k === 'copyBtn') return;
    el.addEventListener('input', function() {
      if (k === 'color') {
        if (els.colorText) els.colorText.value = el.value;
      }
      updatePreview();
    });
  });

  if (els.colorText) {
    els.colorText.addEventListener('input', function() {
      if (els.color) els.color.value = this.value;
      updatePreview();
    });
  }

  if (els.copyBtn) {
    els.copyBtn.addEventListener('click', function() {
      var text = buildMarkdown();
      var p = copyToClipboard(text);
      if (p) {
        p.then(function() {
          els.copyBtn.textContent = '已复制 \\u2713';
          els.copyBtn.classList.add('copied');
          setTimeout(function() {
            els.copyBtn.textContent = '复制配置';
            els.copyBtn.classList.remove('copied');
          }, 2000);
        });
      }
    });
  }

  var pasteBtn = document.getElementById('fg-paste-btn');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', function() {
      var text = buildMarkdown();
      var textarea = document.querySelector('#twikoo textarea')
                  || document.querySelector('div[id="input"] textarea')
                  || document.querySelector('.el-textarea__inner')
                  || document.querySelector('#veditor');
      if (!textarea) {
        copyToClipboard(text);
        pasteBtn.textContent = '未找到评论框，已复制';
        pasteBtn.classList.add('pasted');
        setTimeout(function() {
          pasteBtn.textContent = '一键粘贴';
          pasteBtn.classList.remove('pasted');
        }, 2000);
        return;
      }
      textarea.value += text;
      textarea.focus();
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pasteBtn.textContent = '已粘贴 \\u2713';
      pasteBtn.classList.add('pasted');
      setTimeout(function() {
        pasteBtn.textContent = '一键粘贴';
        pasteBtn.classList.remove('pasted');
      }, 2000);
    });
  }

  updatePreview();
})();
</script>`;
}

hexo.extend.tag.register('friend_generator', friendGenerator, { ends: false });
