/*
这是一个在线运行代码的脚本，用于在浏览器中运行代码并显示输出结果。
 */
(function () {
  // 仅注册一次，兼容 Pjax 导航（守卫必须在顶部，避免重复注册监听器）
  if (window.__runnerInited) return;
  window.__runnerInited = true;

  // ── 读取主题配置（CONFIG 在 app.js 中定义，runner.js 在 app.js 之后加载） ──
  var RC = (typeof CONFIG !== 'undefined' && CONFIG.runner) || {};
  var LANG = RC.languages || {};

  // 语言配置辅助函数：LOCAL（front-matter）覆盖 CONFIG（全局），enable 为 false 时返回 null
  var langCfg = function (name) {
    var lc = (name || '').toLowerCase();
    var map = {
      javascript: 'javascript', js: 'javascript',
      python: 'python', py: 'python',
      r: 'r', rscript: 'r',
      lua: 'lua',
      silq: 'silq', slq: 'silq',
      fortran: 'fortran', f90: 'fortran'
    };
    var key = map[lc];
    if (!key) return null;
    // front-matter runner: false → 整页禁用
    if (typeof LOCAL !== 'undefined' && LOCAL.runner === false) return null;
    // LOCAL.runner（页面 front-matter）优先于 CONFIG.runner（全局配置）
    var localLangs = (typeof LOCAL !== 'undefined' && LOCAL.runner && LOCAL.runner.languages) || {};
    var cfg = localLangs[key] || LANG[key];
    return (cfg && cfg.enable !== false) ? cfg : null;
  };

  // 各语言默认 CDN（配置缺失时回退）
  var D_PYODIDE_CDN    = 'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js';
  var D_PY_PACKAGES     = [];
  var D_PY_MICROPIP     = [];
  var D_WEBR_CDN        = 'https://webr.r-wasm.org/latest/webr.mjs';
  var D_WASMOON_CDN     = 'https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/index.js';
  var D_SILQ_CDN        = 'https://cdn.jsdelivr.net/npm/@llxlr/silq/silq.js';
  var D_LFORTRAN_CDN    = 'https://dev.lfortran.org/lfortran.js';

  // Pjax 导航前强制中断所有正在执行的任务，避免输出写入已销毁的 DOM
  var pjaxAbortCtrl = new AbortController();
  var _cancelPreloadTimers = null;  // 由预加载调度器设置

  document.addEventListener('pjax:send', function () {
    pjaxAbortCtrl.abort();
    pjaxAbortCtrl = new AbortController();
    // 取消调度器中未触发的预加载定时器，避免在错误的页面上加载 WASM
    if (_cancelPreloadTimers) _cancelPreloadTimers();
  });

  // ── 工具函数：加载脚本 ──
  function loadScript(url, signal, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      const timer = setTimeout(() => {
        s.remove()
        reject(new Error(`Script load timeout: ${url}`))
      }, timeout)

      s.src = url
      s.onload = () => { clearTimeout(timer); resolve() }
      s.onerror = () => { clearTimeout(timer); reject(new Error(`Script load failed: ${url}`)) }
      signal?.addEventListener('abort', () => {
        s.remove()
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
      document.head.appendChild(s)
    })
  }

  // ── 工具函数：HTML 转义（stdout 纯文本安全显示） ──
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── 工具函数：根据媒体元素和 data URI / URL 推断下载文件名 ──
  function runnerMediaFilename(media) {
    var tag = media.tagName.toLowerCase();
    var src = media.src || media.currentSrc || '';
    var ext;
    // 从 data URI 的 MIME 类型推断扩展名
    var mimeMatch = src.match(/^data:([^;]+)/);
    if (mimeMatch) {
      var mime = mimeMatch[1];
      switch (mime) {
        case 'image/png':      ext = 'png';  break;
        case 'image/jpeg':     ext = 'jpg';  break;
        case 'image/gif':      ext = 'gif';  break;
        case 'image/svg+xml':  ext = 'svg';  break;
        case 'image/webp':     ext = 'webp'; break;
        case 'audio/wav':
        case 'audio/wave':     ext = 'wav';  break;
        case 'audio/mpeg':     ext = 'mp3';  break;
        case 'audio/ogg':      ext = 'ogg';  break;
        case 'video/mp4':      ext = 'mp4';  break;
        case 'video/webm':     ext = 'webm'; break;
      }
    }
    if (!ext) {
      switch (tag) {
        case 'img':   ext = 'png'; break;
        case 'audio': ext = 'wav'; break;
        case 'video': ext = 'mp4'; break;
        default:      ext = 'bin'; break;
      }
    }
    return 'pyodide-' + tag + '-' + Date.now() + '.' + ext;
  }

  // ── 工具函数：将输出中的 <img>/<audio>/<video> 包装并提供下载按钮 ──
  function wrapRunnerMedia(container) {
    var mediaElements = container.querySelectorAll('img, audio, video');
    for (var i = 0; i < mediaElements.length; i++) {
      var media = mediaElements[i];
      // 避免重复包装
      if (media.closest('.media-wrapper')) continue;
      // 跳过 matplotlib to_jshtml() 动画播放器内部的 <img>
      // 包装会破坏播放器 DOM 结构且 download 按钮对动画帧无意义
      if (media.closest('.animation')) continue;
      var wrapper = document.createElement('div');
      wrapper.className = 'media-wrapper';
      if (media.tagName.toLowerCase() === 'audio') {
        wrapper.classList.add('audio-card');
        // ── audio 标签 ↔ simpleaudio 后台播放切换 ──
        (function (audioEl) {
          var saStopped = false;
          audioEl.addEventListener('play', function () {
            if (window.__pyodide && window._pyodidePlayObj) {
              window.__pyodide.runPython(
                'from js import window\n' +
                'if window._pyodidePlayObj.is_playing():\n' +
                '  window._pyodidePlayObj.stop()\n'
              );
              saStopped = true;
            }
          });
          audioEl.addEventListener('pause', function () {
            if (saStopped && window.__pyodide && window._pyodideAudio) {
              saStopped = false;
              window.__pyodide.runPython(
                'import simpleaudio as sa, base64, numpy as np\n' +
                'from js import window\n' +
                'd = dict(window._pyodideAudio)  # Pyodide 自动转换，确保是 dict\n' +
                'raw = base64.b64decode(d["base64"])\n' +
                'samples = np.frombuffer(raw, dtype=np.int16)\n' +
                'window._pyodidePlayObj = sa.play_buffer(\n' +
                '  samples, d["channels"], d["sample_width"], d["sample_rate"])\n'
              );
            }
          });
          // audio 播完自动恢复 simpleaudio
          audioEl.addEventListener('ended', function () {
            saStopped = false;
          });
        })(media);
      }
      media.parentNode.insertBefore(wrapper, media);
      wrapper.appendChild(media);

      // 下载按钮：原生 <a download> 直接触发，兼容 data URI
      var a = document.createElement('a');
      a.className = 'btn-media-download';
      a.href = media.src || media.currentSrc || '';
      a.download = runnerMediaFilename(media);
      a.textContent = 'Download';
      wrapper.appendChild(a);
    }

    // 将紧随 .media-wrapper 的 download 链接和耗时信息也移入 wrapper 底部
    var wrappers = container.querySelectorAll('.media-wrapper');
    for (var j = 0; j < wrappers.length; j++) {
      var next = wrappers[j].nextElementSibling;
      while (next) {
        var isDownload = next.classList && next.classList.contains('btn-media-download');
        var isTime = next.classList && next.classList.contains('runner-time');
        if (isDownload || isTime) {
          var toMove = next;
          next = next.nextElementSibling;
          wrappers[j].appendChild(toMove);
        } else {
          break;
        }
      }
    }
  }

  // ── 工具函数：修复 to_jshtml() 动画输出 ──
  // to_jshtml() 输出自包含的 <div class="animation">，内含 <img> 和控件栏。
  // runner 会在动画 HTML 之后拼接 <span class="runner-time">，需要将其移入控件栏。
  function fixupAnimationOutput(container) {
    var animations = container.querySelectorAll('.animation');
    for (var a = 0; a < animations.length; a++) {
      var controls = animations[a].querySelector('.anim-controls');
      if (!controls) continue;
      // 查找紧随动画容器之后的 .runner-time 兄弟节点
      var next = animations[a].nextElementSibling;
      while (next) {
        if (next.classList && next.classList.contains('runner-time')) {
          controls.appendChild(next);
          break;
        }
        next = next.nextElementSibling;
      }
      // 也处理可能已被移入动画内部的 .runner-time
      var innerTime = animations[a].querySelector('.runner-time');
      if (innerTime && innerTime.parentNode !== controls) {
        controls.appendChild(innerTime);
      }
    }
  }

  // ── 构造主题 vendor 资源 URL（复用 utils.js assetUrl 逻辑） ──
  function _assetUrl(asset, type) {
    var str = (typeof CONFIG !== 'undefined' && CONFIG[asset] && CONFIG[asset][type]) || '';
    if (!str) return '';
    if (str.indexOf('npm') > -1 || str.indexOf('gh') > -1 || str.indexOf('combine') > -1) {
      var cdn = (typeof CONFIG !== 'undefined' && CONFIG.cdn) || 'cdn.jsdelivr.net';
      if (cdn.startsWith('//')) cdn = 'http:' + cdn;
      if (!cdn.startsWith('http')) cdn = 'http://' + cdn;
      try { return '//' + new URL(cdn).hostname + '/' + str; } catch (e) { return str; }
    }
    return str;
  }

  // ── 确保 fancybox 资源已加载（CSS + JS），完成后回调 ──
  function _ensureFancybox(callback) {
    if (window.jQuery && window.jQuery.fancybox) { callback(); return; }

    var pending = 0;
    var fired = false;
    var done = function () {
      if (fired) return;
      if (--pending <= 0) { fired = true; callback(); }
    };

    // CSS
    if (!window.cssfancybox) {
      var cssUrl = _assetUrl('css', 'fancybox');
      if (cssUrl) {
        pending++;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        link.onload = done;
        link.onerror = done;
        document.head.appendChild(link);
      }
      window.cssfancybox = true;
    }

    // JS（合包含 jQuery + fancybox + justifiedGallery）
    if (!window.jQuery || !window.jQuery.fancybox) {
      var jsUrl = _assetUrl('js', 'fancybox');
      if (jsUrl) {
        pending++;
        var script = document.createElement('script');
        script.src = jsUrl;
        script.onload = script.onreadystatechange = function (_, isAbort) {
          if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
            script.onload = script.onreadystatechange = null;
            done();
          }
        };
        script.onerror = done;
        document.head.appendChild(script);
      }
    }

    if (pending === 0) callback();
  }

  // ── 将 runner 输出中的图片集成为 fancybox 灯箱 ──
  function initRunnerFancybox(container) {
    var wrappers = container.querySelectorAll('.media-wrapper');
    var hasImage = false;
    // 所有 runner 图片共享同一画廊分组，便于跨代码块翻看
    var groupId = 'runner-gallery';

    for (var i = 0; i < wrappers.length; i++) {
      var img = wrappers[i].querySelector('img');
      if (!img) continue;                         // audio / video wrapper
      if (img.closest('.fancybox')) continue;      // 已包裹
      if (img.closest('.animation')) continue;     // matplotlib 动画帧

      var src = img.src || img.currentSrc || '';
      if (!src) continue;

      var a = document.createElement('a');
      a.className = 'fancybox';
      a.setAttribute('data-fancybox', groupId);
      a.href = src;
      wrappers[i].insertBefore(a, img);
      a.appendChild(img);
      hasImage = true;
    }

    if (!hasImage) return;

    _ensureFancybox(function () {
      try {
        var $jq = window.jQuery || window.$;
        if ($jq && $jq.fancybox) {
          // 销毁全页 runner-gallery 旧绑定，再统一重新初始化，确保跨代码块翻看
          $jq('[data-fancybox="runner-gallery"]').off('click.fb-start');
          $jq('[data-fancybox="runner-gallery"]').fancybox({
            loop: true,
            hash: false,
            helpers: { overlay: { locked: false } }
          });
        }
      } catch (e) {
        console.debug('[runner] fancybox init failed:', e);
      }
    });
  }

  // ── 注入媒体包装样式（一次性，与 highlight.styl 互补） ──
  if (!document.getElementById('runner-media-styles')) {
    var style = document.createElement('style');
    style.id = 'runner-media-styles';
    style.textContent = [
      '.code-runner-output .media-wrapper {',
      '  display: inline-block;',
      '  border-radius: 4px;',
      '  margin: 8px 0;',
      '  white-space: normal;',
      '  overflow: hidden;',
      '  max-width: 100%;',
      '}',
      '.code-runner-output .media-wrapper img,',
      '.code-runner-output .media-wrapper video {',
      '  display: block;',
      '  max-width: 100%;',
      '}',
      '.code-runner-output .media-wrapper.audio-card {',
      '  display: block;',
      '  border: 1px solid #2a2a2a;',
      '  border-radius: 6px;',
      '  padding: 8px 10px 10px;',
      '  margin: 6px 0;',
      '}',
      '.code-runner-output .media-wrapper audio {',
      '  display: block;',
      '  width: 100%;',
      '  border-radius: 4px;',
      '  outline: none;',
      '}',
      '.code-runner-output .btn-media-download,',
      '.code-runner-output .runner-time {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  margin-top: 4px;',
      '  padding: 3px 12px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.code-runner-output .btn-media-download {',
      '  background: #2a2a2a;',
      '  color: #999;',
      '  border: 1px solid #3a3a3a;',
      '  border-radius: 4px;',
      '  font-size: 11px;',
      '  text-decoration: none;',
      '  cursor: pointer;',
      '  transition: all 0.2s;',
      '}',
      '.code-runner-output .runner-time {',
      '  float: right;',
      '  color: #888;',
      '  background: none;',
      '  border: none;',
      '  font-size: 12px;',
      '  padding: 3px 6px;',
      '}',
      '.code-runner-output .btn-media-download:hover {',
      '  background: #ffbd2e;',
      '  color: #000;',
      '  border-color: #ffbd2e;',
      '}',
      '.code-runner-output .btn-media-download:active {',
      '  transform: scale(0.96);',
      '}',
      // ── matplotlib to_jshtml() 动画播放器样式 ──
      '.code-runner-output .animation {',
      '  display: block;',
      '  margin: 12px 0;',
      '  text-align: center;',
      '}',
      '.code-runner-output .anim-buttons button {',
      '  width: 34px;',
      '  height: 28px;',
      '  padding: 0;',
      '  margin: 0 1px;',
      '  border: 1px solid #444;',
      '  border-radius: 4px;',
      '  background: #1a1a1a;',
      '  color: #ccc;',
      '  font-size: 12px;',
      '  line-height: 28px;',
      '  cursor: pointer;',
      '  transition: background 0.2s;',
      '  box-sizing: content-box;',
      '}',
      '.code-runner-output .anim-buttons button:hover {',
      '  background: #333;',
      '  color: #fff;',
      '}',
      '.code-runner-output .anim-buttons button i {',
      '  pointer-events: none;',
      '}',
      '.code-runner-output .anim-controls .runner-time {',
      '  display: block;',
      '  margin-top: 6px;',
      '  color: #888;',
      '  font-size: 11px;',
      '  text-align: center;',
      '}',
      '.code-runner-output .anim-state label {',
      '  color: #aaa;',
      '  font-size: 12px;',
      '  margin-right: 6px;',
      '  cursor: pointer;',
      '}',
      '.code-runner-output .anim-state input {',
      '  margin: 0 2px 0 0;',
      '  vertical-align: middle;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    // 代码块渲染优化：跳过屏幕外代码块的布局计算
    // 本页有大量高亮代码块时（如 28+ 个），此属性可显著减少初始布局开销和滚动卡顿
    var codeBlockStyle = document.createElement('style');
    codeBlockStyle.id = 'runner-codeblock-styles';
    codeBlockStyle.textContent = [
      'figure.highlight {',
      '  content-visibility: auto;',
      '  contain-intrinsic-size: auto 300px;',
      '}'
    ].join('\n');
    document.head.appendChild(codeBlockStyle);
  }

  // ── 预加载 Pyodide 全环境：页面有 Python 代码块时后台提前加载 ──
  window.__pyodide = null;
  window.__pyodidePromise = null;
  window.__ensurePyodide = async function (signal, statusEl, outputCodeEl) {
    if (window.__pyodide) return window.__pyodide;
    // 已在加载中 → 等待现有 promise
    if (window.__pyodidePromise) return window.__pyodidePromise;

    window.__pyodidePromise = (async function () {
      outputCodeEl.textContent = 'Loading Pyodide...';
      var pyCfg = langCfg('python') || {};
      await loadScript(pyCfg.cdn || D_PYODIDE_CDN, signal);
      const t0 = performance.now();
      window.__pyodide = await loadPyodide();
      outputCodeEl.textContent = 'Pyodide loaded! (' + (performance.now() - t0).toFixed(0) + ' ms)';

      const t1 = performance.now();
      outputCodeEl.textContent = 'Loading packages...';
      const dependencies = pyCfg.packages || D_PY_PACKAGES;
      await window.__pyodide.loadPackage(dependencies);
      outputCodeEl.textContent = 'Packages loaded! ' + dependencies.join(", ") + ' (' + (performance.now() - t1).toFixed(0) + ' ms)';

      const t2 = performance.now();
      outputCodeEl.textContent = 'Installing optional dependencies...';
      await window.__pyodide.loadPackage("micropip");
      const micropip = window.__pyodide.pyimport("micropip");
      const optional_dependencies = pyCfg.micropip_packages || D_PY_MICROPIP;
      await micropip.install(optional_dependencies);
      outputCodeEl.textContent = 'optional dependencies installed! (' + (performance.now() - t2).toFixed(0) + ' ms)';

      const t3 = performance.now();
      outputCodeEl.textContent = 'Ready! (total ' + (t3 - t0).toFixed(0) + ' ms)';
      return window.__pyodide;
    })();

    return window.__pyodidePromise;
  };

  // ── 预加载 WebR：页面有 R 代码块时后台提前加载 ──
  window.__webr = null;
  window.__webrPromise = null;
  window.__ensureWebR = async function (signal, statusEl, outputCodeEl) {
    if (window.__webr) return window.__webr;
    // 已在加载中 → 等待现有 promise
    if (window.__webrPromise) return window.__webrPromise;

    window.__webrPromise = (async function () {
      outputCodeEl.textContent = 'Loading WebR...';
      const t0 = performance.now();
      // WebR 是 ES 模块，使用动态 import() 加载（与 Silq 同理）
      const webrMod = await import((langCfg('r') || {}).cdn || D_WEBR_CDN);
      window.__webr = new webrMod.WebR();
      await window.__webr.init();
      outputCodeEl.textContent = 'WebR loaded! (' + (performance.now() - t0).toFixed(0) + ' ms)';
      return window.__webr;
    })();

    return window.__webrPromise;
  };

  // ── 预加载 LFortran：页面有 Fortran 代码块时后台提前加载 ──
  window.__lfortran = null;
  window.__lfortranPromise = null;
  window.__ensureLFortran = async function (signal, statusEl, outputCodeEl) {
    if (window.__lfortran) return window.__lfortran;
    // 已在加载中 → 等待现有 promise
    if (window.__lfortranPromise) return window.__lfortranPromise;

    window.__lfortranPromise = (async function () {
      outputCodeEl.textContent = 'Loading LFortran...';
      // 必须在加载 lfortran.js 之前配置 locateFile，
      // 告诉 Emscripten 到哪找 lfortran.wasm 和 lfortran.data
      var f90Cfg = langCfg('fortran') || {};
      window.Module = {
        locateFile: function (name) {
          return (f90Cfg.wasm_cdn || D_LFORTRAN_WASM) + name;
        },
      };
      var t0 = performance.now();
      // LFortran 是 Emscripten 产物，通过 <script> 标签加载（非 ES module）
      await loadScript(f90Cfg.cdn || D_LFORTRAN_CDN, signal);
      outputCodeEl.textContent = 'Downloading LFortran WASM...';

      // 等待 Emscripten WASM 运行时初始化完成
      window.__lfortran = await new Promise(function (resolve, reject) {
        var onAbort = function () {
          reject(new DOMException('Aborted', 'AbortError'));
        };
        signal.addEventListener('abort', onAbort, { once: true });

        // 如果 WASM 已初始化完成（极端时序），直接返回
        if (Module.calledRun) {
          signal.removeEventListener('abort', onAbort);
          resolve({
            emit_wasm_from_source: Module.cwrap('emit_wasm_from_source', 'string', ['string']),
          });
          return;
        }

        Module.onRuntimeInitialized = function () {
          signal.removeEventListener('abort', onAbort);
          resolve({
            emit_wasm_from_source: Module.cwrap('emit_wasm_from_source', 'string', ['string']),
          });
        };
      });

      outputCodeEl.textContent = 'LFortran loaded! (' + (performance.now() - t0).toFixed(0) + ' ms)';
      return window.__lfortran;
    })();

    return window.__lfortranPromise;
  };

  // ── 智能预加载调度器 ──
  // 等待页面完全加载后，再延迟一段时间，最后按顺序逐个预加载运行时。
  // 避免 WASM 下载/编译与页面渲染、Prism 高亮等争抢主线程。
  // 点击 Run 按钮时仍会立即触发 __ensureXxx()，不依赖此调度器。
  (function () {
    var PRELOAD_GRACE_MS = RC.preload_grace_ms || 5000;    // 页面 load 后额外等待 5 秒
    var PRELOAD_GAP_MS = RC.preload_gap_ms || 3000;      // 每个运行时加载完成后间隔 3 秒再开始下一个
    var preloadQueue = [];
    var preloading = false;
    var timerId = null;

    // 取消所有待执行的预加载
    function cancel() {
      if (timerId) { clearTimeout(timerId); timerId = null; }
      preloadQueue.length = 0;
      preloading = false;
    }

    function enqueue(fn) {
      preloadQueue.push(fn);
    }

    function runNext() {
      if (preloadQueue.length === 0) { preloading = false; return; }
      preloading = true;
      var fn = preloadQueue.shift();
      timerId = null;
      fn().finally(function () {
        timerId = setTimeout(runNext, PRELOAD_GAP_MS);
      });
    }

    function kickOff() {
      if (preloadQueue.length === 0 || preloading) return;
      timerId = setTimeout(function () {
        timerId = null;
        if (!preloading) runNext();
      }, PRELOAD_GRACE_MS);
    }

    // 页面已完全加载 → 启动倒计时；否则等 load 事件
    if (document.readyState === 'complete') {
      kickOff();
    } else {
      window.addEventListener('load', kickOff, { once: true });
    }

    // 暴露给 pjax:send 取消 + 给下方预加载探针入队
    window.__enqueueRuntimePreload = enqueue;
    _cancelPreloadTimers = cancel;
  })();

  // ── 探针：收集需要预加载的运行时，但不立即执行 ──
  var dummyEl = document.createElement('div');

  var hasPythonBlocks = document.querySelector(
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="Python"],' +
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="py"]'
  );
  if (hasPythonBlocks && langCfg('python')) {
    window.__enqueueRuntimePreload(function () {
      return window.__ensurePyodide(new AbortController().signal, { className: '' }, dummyEl);
    });
  }

  var hasRBlocks = document.querySelector(
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="R"],' +
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="r"]'
  );
  if (hasRBlocks && langCfg('r')) {
    window.__enqueueRuntimePreload(function () {
      return window.__ensureWebR(new AbortController().signal, { className: '' }, dummyEl);
    });
  }

  var hasFortranBlocks = document.querySelector(
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="fortran"],' +
    'figure.highlight:not([data-runnable="false"]) figcaption[data-lang="f90"]'
  );
  if (hasFortranBlocks && langCfg('fortran')) {
    window.__enqueueRuntimePreload(function () {
      return window.__ensureLFortran(new AbortController().signal, { className: '' }, dummyEl);
    });
  }

  // 所有预加载已入队完毕，清理全局句柄
  delete window.__enqueueRuntimePreload;

  window.__runCode = async function (code, lang, statusEl, outputCodeEl, signal, options) {
    console.debug("[__runCode] ENTER lang=%s code=%s signal=%s", lang, (code||"").slice(0,50), signal ? signal.aborted : "none");
    // 合并用户中断信号（点击暂停按钮）和 Pjax 中断信号
    var mergedSignal;
    if (signal && signal.aborted) {
      mergedSignal = signal;
    } else if (pjaxAbortCtrl.signal.aborted) {
      mergedSignal = pjaxAbortCtrl.signal;
    } else if (signal) {
      mergedSignal = AbortSignal.any([signal, pjaxAbortCtrl.signal]);
    } else {
      mergedSignal = pjaxAbortCtrl.signal;
    }

    console.debug("[__runCode] mergedSignal.aborted=", mergedSignal.aborted);
    var checkAbort = function () {
      if (mergedSignal.aborted) throw new DOMException('aborted', 'AbortError');
      return new Promise(function (resolve, reject) {
        mergedSignal.addEventListener('abort', function () {
          reject(new DOMException('aborted', 'AbortError'));
        }, { once: true });
        resolve(); // ← 关键：信号未 abort 时立即 resolve，否则 await 永远卡住
      });
    };
    await checkAbort();
    console.debug("[__runCode] checkAbort passed, entering switch lang=%s", lang);

    try {
      lang = (lang || '').toLowerCase();

      // 还原 markdown 代码块中因 Nunjucks 模板冲突而转义的花括号
      // markdown 源码：&#123; → innerText 返回字面文本 "&#123;" → 执行前还原为 "{"
      code = code.replace(/&#123;/g, '{').replace(/&#125;/g, '}');

      switch (lang) {
        case 'js':
        case 'javascript': {
          // Web Worker 独立线程执行，不阻塞主线程，可真正中断
          const workerCode = [
            'let logs = [];',
            'let fakeConsole = { log: function (...args) { logs.push(args.join(" ")); } };',
            'try {',
            '  const fn = new Function("console", ' + JSON.stringify(code) + ');',
            '  const result = fn(fakeConsole);',
            '  let lines = logs.slice();',
            '  if (result !== undefined) lines.push(String(result));',
            '  self.postMessage({ output: lines.join("\\n") || "(no output)" });',
            '} catch (err) {',
            '  self.postMessage({ error: err.message });',
            '}'
          ].join('\n');
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);
          try {
            const result = await new Promise(function (resolve, reject) {
              worker.onmessage = function (e) { resolve(e.data); };
              worker.onerror = function (e) { reject(new Error(e.message)); };
              mergedSignal.addEventListener('abort', function () {
                worker.terminate();
                reject(new DOMException('aborted', 'AbortError'));
              }, { once: true });
            });
            console.debug("[__runCode] worker result:", result);
            if (result.error) {
              outputCodeEl.textContent = '✗ 运行出错: ' + result.error;
              statusEl.className = 'code-runner-status error';
            } else {
              console.debug("[__runCode] setting outputCodeEl.textContent to:", result.output);
              outputCodeEl.textContent = result.output;
              statusEl.className = '';
            }
          } finally {
            URL.revokeObjectURL(workerUrl);
          }
          break;
        }
        case 'lua': {
          if (!langCfg('lua')) {
            outputCodeEl.textContent = '[Lua runtime disabled]';
            statusEl.className = '';
            break;
          }
          outputCodeEl.textContent = 'Loading Lua (Wasmoon)...';
          if (!window.__lua) {
            statusEl.className = 'code-runner-status loading';
            statusEl.title = '正在加载 WASM…';
            try {
              var t0 = performance.now();
              await loadScript((langCfg('lua') || {}).cdn || D_WASMOON_CDN, mergedSignal);
              window.__lua = window.wasmoon;
              outputCodeEl.textContent = `Wasmoon loaded! (${(performance.now() - t0).toFixed(0)} ms)`;
              statusEl.title = '✓ Lua 环境就绪';
              statusEl.className = 'code-runner-status ready';
            } catch(err) {
              if (err instanceof DOMException && err.name === 'AbortError') throw err;
              statusEl.title = '✗ WASM 加载失败: ' + err.message;
              statusEl.className = 'code-runner-status error';
              outputCodeEl.textContent = '✗ WASM 加载失败: ' + err.message;
              throw err;
            }
          }
          await checkAbort();
          // 复用 LuaFactory（二次 new 会触发 "Cannot redefine property: asm"）
          if (!window.__luaFactory) {
            window.__luaFactory = new window.__lua.LuaFactory();
          }
          const lua = await window.__luaFactory.createEngine();
          try {
            const t1 = performance.now();
            let logs = [];
            lua.global.set('print', function (...args) { logs.push(args.map(String).join('\t')); });
            await lua.doString(code);
            console.debug("[__runCode] lua result: logs=%o time=%.1fms", logs, performance.now() - t1);
            const finalOutput = logs.join('\n') + `<span class="runner-time">${(performance.now() - t1).toFixed(1)} ms</span>`;
            console.debug("[__runCode] setting outputCodeEl.textContent to:", finalOutput);
            outputCodeEl.innerHTML = finalOutput;
          } finally {
            lua.global.close();
          }
          statusEl.className = '';
          break;
        }
        case 'slq':
        case 'silq': {
          if (!langCfg('silq')) {
            outputCodeEl.textContent = '[Silq runtime disabled]';
            statusEl.className = '';
            break;
          }
          outputCodeEl.textContent = 'Loading Silq...';
          if (!window.__silq) {
            statusEl.className = 'code-runner-status loading';
            statusEl.title = '正在加载 WASM…';
            try {
              var t0 = performance.now();
              // @llxlr/silq 是 ES 模块，必须用 import() 而非 <script> 标签加载
              window.__silq = await import((langCfg('silq') || {}).cdn || D_SILQ_CDN);
              await window.__silq.default();
              outputCodeEl.textContent = `Silq loaded! (${(performance.now() - t0).toFixed(0)} ms)`;
              statusEl.title = '✓ WASM 模块就绪';
              statusEl.className = 'code-runner-status ready';
            } catch(err) {
              console.debug("[__runCode] caught error:", err.message, err.name);
              statusEl.title = '✗ WASM 加载失败: ' + err.message;
              statusEl.className = 'code-runner-status error';
              throw err;
            }
          }
          await checkAbort();
          const t1 = performance.now();
          const fn = (options && options.dump) ? window.__silq.run_silq_dump : window.__silq.run_silq;
          const result = fn(code);
          console.debug("[__runCode] silq result: %o time=%.1fms", result, performance.now() - t1);
          const finalOutput = result + `<span class="runner-time">${(performance.now() - t1).toFixed(1)} ms</span>`;
          console.debug("[__runCode] setting outputCodeEl.textContent to:", finalOutput);
          outputCodeEl.innerHTML = finalOutput;
          statusEl.className = '';
          break;
        }
        case 'py':
        case 'python': {
          if (!langCfg('python')) {
            outputCodeEl.textContent = '[Python runtime disabled]';
            statusEl.className = '';
            break;
          }
          if (!window.__pyodide) {
            statusEl.className = 'code-runner-status loading';
            statusEl.title = '正在加载 Pyodide…';
            try {
              await window.__ensurePyodide(mergedSignal, statusEl, outputCodeEl);
              statusEl.title = '✓ Pyodide 模块就绪';
              statusEl.className = 'code-runner-status ready';
            } catch(err) {
              statusEl.title = '✗ Pyodide 加载失败: ' + err.message;
              statusEl.className = 'code-runner-status error';
              throw err;
            }
          }
          await checkAbort();
          // 必须在执行代码之前设置 stdout 捕获
          let stdout = '';
          window.__pyodide.setStdout({
            batched: function (text) {
              stdout += text + '\n';
            },
          });

          // ── 注入 plt.show() monkey-patch：捕获图片到 _runner_images ──
          await window.__pyodide.runPythonAsync(
            'import matplotlib.pyplot as _plt_runner\n' +
            'import io as _io_runner, base64 as _b64_runner\n' +
            // ★ 先清理上次运行残留的 figure，避免新代码在旧 figure 上叠加绘图
            //    场景：上次 Python 代码块创建了 figure 但未调用 plt.show()，
            //    figure 不会被 _runner_show 中的 close("all") 清理，残留到本次运行。
            '_plt_runner.close("all")\n' +
            '_runner_images = []\n' +
            '_orig_show = _plt_runner.show\n' +
            'def _runner_show(*args, **kwargs):\n' +
            '    buf = _io_runner.BytesIO()\n' +
            '    _plt_runner.savefig(buf, format="png", bbox_inches="tight")\n' +
            '    buf.seek(0)\n' +
            '    _runner_images.append(_b64_runner.b64encode(buf.read()).decode())\n' +
            '    _plt_runner.close("all")\n' +
            '_plt_runner.show = _runner_show\n'
          );

          const t1 = performance.now();
          const fn = (options && options.sync) ? window.__pyodide.runPython : window.__pyodide.runPythonAsync;
          const result = await fn(code);
          console.debug("[__runCode] python result: result=%o stdout=%o time=%.1fms", result, stdout, performance.now() - t1);

          // ── 捞出 plt.show() 捕获的图片 ──
          var pltHtml = '';
          try {
            var runnerImages = window.__pyodide.globals.get('_runner_images');
            if (runnerImages) {
              for (var k = 0; k < runnerImages.length; k++) {
                pltHtml += '<img src="data:image/png;base64,' + runnerImages[k] + '" style="max-width:100%;" />\n';
              }
            }
          } catch (e) { console.debug('[__runCode] plt images error:', e); }

          // 构建 HTML 输出：
          // - stdout（print() 输出）→ escapeHtml 转义为纯文本
          // - plt.show() 图片 → 原样渲染
          // - result（返回值）→ 原样渲染，支持 <img>/<audio>/<video>/<svg> 等 HTML 标签
          var html = '';
          var stdoutTrimmed = stdout.trimEnd();
          if (stdoutTrimmed) {
            html += escapeHtml(stdoutTrimmed) + '\n';
          }
          if (pltHtml) {
            html += pltHtml
          }
          if (result !== undefined && result !== null) {
            html += String(result) + '\n';
          }
          html += '<span class="runner-time">' + (performance.now() - t1).toFixed(1) + ' ms</span>';

          outputCodeEl.innerHTML = html;
          // 自动包装媒体元素并添加下载按钮
          wrapRunnerMedia(outputCodeEl);
          // matplotlib to_jshtml() 动画：将 runner-time 移入动画控件栏
          fixupAnimationOutput(outputCodeEl);
          // runner 图片集成 fancybox 灯箱
          initRunnerFancybox(outputCodeEl);
          statusEl.className = '';
          break;
        }
        case 'r':
        case 'rscript': {
          if (!langCfg('r')) {
            outputCodeEl.textContent = '[R runtime disabled]';
            statusEl.className = '';
            break;
          }
          if (!window.__webr) {
            statusEl.className = 'code-runner-status loading';
            statusEl.title = '正在加载 WebR…';
            try {
              await window.__ensureWebR(mergedSignal, statusEl, outputCodeEl);
              statusEl.title = '✓ WebR 模块就绪';
              statusEl.className = 'code-runner-status ready';
            } catch (err) {
              statusEl.title = '✗ WebR 加载失败: ' + err.message;
              statusEl.className = 'code-runner-status error';
              throw err;
            }
          }
          await checkAbort();

          const t1r = performance.now();
          const shelter = await new window.__webr.Shelter();

          try {
            // 设置 canvas 图形设备（capture=TRUE 将图捕获为 ImageBitmap）
            await window.__webr.evalRVoid(
              'webr::canvas(width=672, height=480, capture=TRUE)'
            );

            // 在 shelter 中执行用户代码，捕获 stdout / stderr / 图形
            const captured = await shelter.captureR(code, {
              withAutoprint: true,
              captureStreams: true,
              captureConditions: true,
            });

            // 关闭图形设备以刷出待渲染的图
            var devOffImages = [];
            try {
              var devOff = await shelter.captureR('dev.off()', {
                withAutoprint: false,
                captureStreams: false,
                captureConditions: false,
              });
              if (devOff.images && devOff.images.length > 0) {
                devOffImages = devOff.images;
              }
            } catch (e) {
              // 无活跃图形设备时 dev.off() 会报错，忽略
            }

            // ── 构建 HTML 输出 ──
            var htmlR = '';

            // stdout / stderr / message / warning 输出
            var outputs = captured.output || [];
            for (var oi = 0; oi < outputs.length; oi++) {
              var entry = outputs[oi];
              var prefix = '';
              if (entry.type === 'warning') prefix = 'Warning: ';
              htmlR += escapeHtml(prefix + entry.data) + '\n';
            }

            // 图形输出：ImageBitmap → 临时 canvas → data URL → <img>
            var allImages = (captured.images || []).concat(devOffImages);
            for (var ii = 0; ii < allImages.length; ii++) {
              var bmp = allImages[ii];
              var cvs = document.createElement('canvas');
              cvs.width = bmp.width;
              cvs.height = bmp.height;
              var ctx = cvs.getContext('2d');
              ctx.drawImage(bmp, 0, 0);
              htmlR += '<img src="' + cvs.toDataURL('image/png') + '" style="max-width:100%;" />\n';
            }

            // 返回值：仅输出简单原子向量的值，复杂对象（list/数据框/模型等）
            // 已由 withAutoprint 打印到 stdout，此处跳过避免 [object Object]。
            if (captured.result !== undefined && captured.result !== null) {
              try {
                var jsVal = await captured.result.toJs();
                if (jsVal !== undefined && jsVal !== null) {
                  if (typeof jsVal === 'object' && jsVal !== null) {
                    if (jsVal.values && Array.isArray(jsVal.values)) {
                      // 仅当所有元素均为标量时才视为简单向量拼接输出
                      var isSimple = jsVal.values.every(function (v) {
                        return typeof v !== 'object' || v === null;
                      });
                      if (isSimple) {
                        htmlR += escapeHtml(jsVal.values.map(String).join(' ')) + '\n';
                      }
                      // 复杂嵌套列表跳过：auto-print 已在 stdout 输出文本表示
                    } else {
                      htmlR += escapeHtml(JSON.stringify(jsVal, null, 2)) + '\n';
                    }
                  } else {
                    htmlR += escapeHtml(String(jsVal)) + '\n';
                  }
                }
              } catch (e) { /* 部分 R 对象无法序列化为 JS */ }
            }

            htmlR += '<span class="runner-time">' + (performance.now() - t1r).toFixed(1) + ' ms</span>';

            outputCodeEl.innerHTML = htmlR;
            wrapRunnerMedia(outputCodeEl);
            fixupAnimationOutput(outputCodeEl);
            // runner 图片集成 fancybox 灯箱
            initRunnerFancybox(outputCodeEl);
            statusEl.className = '';
          } finally {
            shelter.purge();
          }
          break;
        }
        case 'fortran':
        case 'f90': {
          if (!langCfg('fortran')) {
            outputCodeEl.textContent = '[Fortran runtime disabled]';
            statusEl.className = '';
            break;
          }
          if (!window.__lfortran) {
            statusEl.className = 'code-runner-status loading';
            statusEl.title = '正在加载 LFortran…';
            try {
              await window.__ensureLFortran(mergedSignal, statusEl, outputCodeEl);
              statusEl.title = '✓ LFortran 就绪';
              statusEl.className = 'code-runner-status ready';
            } catch (err) {
              statusEl.title = '✗ LFortran 加载失败: ' + err.message;
              statusEl.className = 'code-runner-status error';
              throw err;
            }
          }
          await checkAbort();

          var t1f = performance.now();

          // ── 步骤 1：LFortran 编译 Fortran 源码 → WASM 字节 ──
          // emit_wasm_from_source 返回 "status,byte1,byte2,..." 逗号分隔字符串
          // status="0" 成功，"1" 编译错误
          var rawCompile = window.__lfortran.emit_wasm_from_source(code);
          if (!rawCompile) {
            outputCodeEl.textContent = '✗ 编译失败：无法生成 WASM';
            statusEl.className = 'code-runner-status error';
            break;
          }

          var parts = rawCompile.split(',');
          if (parts[0] !== '0') {
            // 编译错误 — 将后续字节解码为错误消息
            var errMsg = '';
            for (var ei = 1; ei < parts.length && ei < 5000; ei++) {
              var ch = Number(parts[ei]);
              if (ch > 0 && ch < 256) errMsg += String.fromCharCode(ch);
            }
            outputCodeEl.textContent = '✗ 编译错误:\n' + (errMsg || rawCompile);
            statusEl.className = 'code-runner-status error';
            break;
          }

          // ── 步骤 2：将 WASM 字节转为 Uint8Array ──
          var byteCount = parts.length - 1;
          var wasmBytes = new Uint8Array(byteCount);
          for (var bi = 0; bi < byteCount; bi++) {
            wasmBytes[bi] = Number(parts[bi + 1]);
          }

          // ── 步骤 3：通过 WASI 接口实例化并运行编译后的 WASM ──
          var stdoutBuf = [];
          var memory = null;

          // 构造 WASI import 对象，拦截 fd_write 捕获 Fortran print 输出
          var buildImports = function (mem) {
            return {
              wasi_snapshot_preview1: {
                fd_write: function (fd, iov, iovcnt, pnum) {
                  var view = new DataView(mem.buffer, iov, 2 * Int32Array.BYTES_PER_ELEMENT);
                  var ptr = view.getInt32(0, true);
                  var len = view.getInt32(4, true);
                  var text = new TextDecoder('utf8').decode(
                    new Uint8Array(mem.buffer, ptr, len)
                  );
                  stdoutBuf.push(text);
                  // 回写已写入字节数
                  if (pnum) {
                    new Int32Array(mem.buffer, pnum, 1)[0] = len;
                  }
                  return 0; // __WASI_ERRNO_SUCCESS
                },
                proc_exit: function (code) {
                  // 非零退出码记录但不抛异常，让 finally 能正常收尾
                  if (code !== 0) {
                    stdoutBuf.push('\n[Program exited with code ' + code + ']');
                  }
                },
              },
              js: {
                // LFortran 运行时要求的 JS 导入（时间戳）
                cpu_time: function () { return Date.now() / 1000; },
              },
            };
          };

          try {
            var compileTime = performance.now() - t1f;
            var tExec = performance.now();

            // 第一次尝试：用标准 WASI 导入实例化
            var wasmModule = await WebAssembly.instantiate(wasmBytes, buildImports({ buffer: new ArrayBuffer(0) }));

            // 如果实例化成功但内存引用仍为空（某些 LFortran 编译产物不导出 memory），
            // 尝试用真正的 memory 重新构建 imports
            memory = wasmModule.instance.exports.memory;
            if (!memory) {
              // 内存可能挂在不同的导出名上
              memory = wasmModule.instance.exports.memory || wasmModule.instance.exports.Memory;
            }

            if (memory) {
              // 用真实 memory 重新实例化（确保 fd_write 能正确读写内存）
              wasmModule = await WebAssembly.instantiate(wasmBytes, buildImports(memory));
              memory = wasmModule.instance.exports.memory;
            }

            // 执行 WASM 程序：_start 是 WASI 入口，main 是备用入口
            if (typeof wasmModule.instance.exports._start === 'function') {
              wasmModule.instance.exports._start();
            } else if (typeof wasmModule.instance.exports.main === 'function') {
              wasmModule.instance.exports.main(0, 0);
            }

            var execTime = performance.now() - tExec;
            var totalTime = performance.now() - t1f;

            // ── 构建输出 HTML ──
            var htmlF = '';
            if (stdoutBuf.length > 0) {
              htmlF += escapeHtml(stdoutBuf.join(''));
            }
            htmlF += '<span class="runner-time">' +
              totalTime.toFixed(1) + ' ms (compile ' + compileTime.toFixed(1) + ' ms, exec ' + execTime.toFixed(1) + ' ms)</span>';

            outputCodeEl.innerHTML = htmlF;
            wrapRunnerMedia(outputCodeEl);
            statusEl.className = '';
          } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            outputCodeEl.textContent = '✗ 运行出错: ' + e.message;
            statusEl.className = 'code-runner-status error';
          }
          break;
        }
        default:
          outputCodeEl.textContent = `[Execution not supported for "${lang}"]`;
          statusEl.className = '';
      }
    } catch(err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 停止后台音频播放（simpleaudio）
        if (window.__pyodide && window._pyodidePlayObj) {
          try { window.__pyodide.runPython('from js import window; window._pyodidePlayObj.stop()'); } catch (e) {}
        }
        outputCodeEl.textContent = '⏹ 已中断';
      } else {
        outputCodeEl.textContent = '✗ 运行出错: ' + err.message;
        console.error(err);
      }
      statusEl.className = 'code-runner-status error';
    }
  };

})();
