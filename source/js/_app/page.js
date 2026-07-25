const cardActive = function() {
  if(!$('.index.wrap'))
    return

  if (!window.IntersectionObserver) {
    $.each('.index.wrap article.item, .index.wrap section.item', function(article) {
      if( article.hasClass("show") === false){
          article.addClass("show");
      }
    })
  } else {
    var io = new IntersectionObserver(function(entries) {

        entries.forEach(function(article) {
          if (article.target.hasClass("show")) {
            io.unobserve(article.target)
          } else {
            if (article.isIntersecting || article.intersectionRatio > 0) {
              article.target.addClass("show");
              io.unobserve(article.target);
            }
          }
        })
    }, {
        root: null,
        threshold: [0.3]
    });

    $.each('.index.wrap article.item, .index.wrap section.item', function(article) {
      io.observe(article)
    })

    $('.index.wrap .item:first-child').addClass("show")
  }

  $.each('.cards .item', function(element, index) {
    ['mouseenter', 'touchstart'].forEach(function(item){
      element.addEventListener(item, function(event) {
        if($('.cards .item.active')) {
          $('.cards .item.active').removeClass('active')
        }
        element.addClass('active')
      })
    });
    ['mouseleave'].forEach(function(item){
      element.addEventListener(item, function(event) {
        element.removeClass('active')
      })
    });
  });
}

const registerExtURL = function() {
  $.each('span.exturl', function(element) {
      var link = document.createElement('a');
      // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
      link.href = decodeURIComponent(atob(element.dataset.url).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      link.rel = 'noopener external nofollow noreferrer';
      link.target = '_blank';
      link.className = element.className;
      link.title = element.title || element.innerText;
      link.innerHTML = element.innerHTML;
      if(element.dataset.backgroundImage) {
        link.dataset.backgroundImage = element.dataset.backgroundImage;
      }
      element.parentNode.replaceChild(link, element);
    });
}

const postFancybox = function(p) {
  if($(p + ' .md img')) {
    vendorCss('fancybox');
    vendorJs('fancybox', function() {
      var q = jQuery.noConflict();

      $.each(p + ' p.gallery', function(element) {
        var box = document.createElement('div');
        box.className = 'gallery';
        box.attr('data-height', element.attr('data-height')||220);

        box.innerHTML = element.innerHTML.replace(/<br>/g, "")

        element.parentNode.insertBefore(box, element);
        element.remove();
      });

      $.each(p + ' .md img:not(.emoji):not(.vemoji)', function(element, index) {
        var $image = q(element);
        $image.attr('id', 'fig' + (index + 1));
        var info, captionClass = 'image-info';
        if(!$image.is('a img')) {
          var imageLink = $image.attr('data-src') || $image.attr('src');
          $image.data('safe-src', imageLink)
          var $imageWrapLink = $image.wrap('<a class="fancybox" href="'+imageLink+'" itemscope itemtype="http://schema.org/ImageObject" itemprop="url"></a>').parent('a');
          if (!$image.is('.gallery img')) {
            $imageWrapLink.attr('data-fancybox', 'default').attr('rel', 'default');
          } else {
            captionClass = 'jg-caption'
          }
        }
        if(info = element.attr('title')) {
          $imageWrapLink.attr('data-caption', info);
          var para = document.createElement('span');
          var txt = document.createTextNode(info);
          para.appendChild(txt);
          para.addClass(captionClass);
          para.setAttribute('data-type', LOCAL.label?.figure || '图');
          element.insertAfter(para);
        }
      });

      $.each(p + ' div.gallery', function (el, i) {
        q(el).justifiedGallery({rowHeight: q(el).data('height')||120, rel: 'gallery-' + i}).on('jg.complete', function () {
          q(this).find('a').each(function(k, ele) {
            ele.attr('data-fancybox', 'gallery-' + i);
          });
        });
      });

      q.fancybox.defaults.hash = false;
      q(p + ' .fancybox').fancybox({
        loop   : true,
        helpers: {
          overlay: {
            locked: false
          }
        }
      });
    }, window.jQuery);
  }
}

const postBeauty = function () {
  loadComments();

  if(!$('.md'))
    return

  postFancybox('.post.block');

  $('.post.block').oncopy = function(event) {
    showtip(LOCAL.copyright)

    if(LOCAL.nocopy) {
      event.preventDefault()
      return
    }

    var copyright = $('#copyright')
    if(window.getSelection().toString().length > 30 && copyright) {
      event.preventDefault();
      var author = "# " + copyright.child('.author').innerText
      var link = "# " + copyright.child('.link').innerText
      var license = "# " + copyright.child('.license').innerText
      var htmlData = author + "<br>" + link + "<br>" + license + "<br><br>" + window.getSelection().toString().replace(/\r\n/g, "<br>");;
      var textData = author + "\n" + link + "\n" + license + "\n\n" + window.getSelection().toString().replace(/\r\n/g, "\n");
      if (event.clipboardData) {
          event.clipboardData.setData("text/html", htmlData);
          event.clipboardData.setData("text/plain", textData);
      } else if (window.clipboardData) {
          return window.clipboardData.setData("text", textData);
      }
    }
  }

  $.each('li ruby', function(element) {
    var parent = element.parentNode;
    if(element.parentNode.tagName != 'LI') {
      parent = element.parentNode.parentNode;
    }
    parent.addClass('ruby');
  })

  $.each('ol[start]', function(element) {
    element.style.counterReset = "counter " + parseInt(element.attr('start') - 1)
  })

  $.each('.md table', function (element) {
    element.wrap({
      className: 'table-container'
    });
  });

  $.each('.highlight > .table-container', function (element) {
    element.className = 'code-container'
  });

  $.each('figure.highlight', function (element) {

    var code_container = element.child('.code-container');
    var caption = element.child('figcaption');
    var comma = '', code = '';
    code_container.find('pre').forEach(function(line) {
      code += comma + line.textContent;
      comma = '\n';
    });

    element.insertAdjacentHTML('beforeend','<div class="operation"><span class="breakline-btn"><i class="ic i-align-left"></i></span><span class="runner-btn"><i class="ic i-play"></i></span><span class="more-btn"><i class="ic i-more"></i></span><span class="copy-btn"><i class="ic i-clipboard"></i></span><span class="download-btn"><i class="ic i-download"></i></span><span class="fullscreen-btn"><i class="ic i-expand"></i></span><span class="fold-btn"><i class="ic i-angle-down"></i></span></div>');

    var copyBtn = element.child('.copy-btn');
    if(LOCAL.nocopy) {
      copyBtn.remove()
    } else {
      copyBtn.addEventListener('click', function (event) {
        var target = event.currentTarget;
        clipBoard(code, function(result) {
          target.child('.ic').className = result ? 'ic i-check' : 'ic i-times';
          target.blur();
          showtip(LOCAL.copyright);
        })
      });
      copyBtn.addEventListener('mouseleave', function (event) {
        setTimeout(function () {
          event.target.child('.ic').className = 'ic i-clipboard';
        }, 1000);
      });
    }

    var runnerBtn = element.child('.runner-btn');
    var lang = caption && caption.attr('data-lang');
    var forcedRunnable = caption && caption.attr('data-runnable') === 'true';
    var runnable = (LOCAL.runnable || CONFIG.runnable || []).map(function (s) { return String(s).toLowerCase(); });
    if (forcedRunnable || (lang && runnable.includes(lang.toLowerCase()))) {
      var status = document.createElement('div');
      status.id = 'runnerStatus';
      status.className = 'code-runner-status';
      status.title = '运行时正在加载…';
      status.dataset.status = '加载中…';
      caption.appendChild(status);
      var running = false;
      var abortCtrl = null;

      var outputEl = null;
      var prevOutputEl = null;
      var outputWrap = null;
      var clearTimer = null;

      runnerBtn.addEventListener('click', function (event) {
        console.debug('[runnerBtn] ENTER click handler');
        var target = event.currentTarget;
        if (running) {
          // 停止：中断执行 + 删除所有输出 + 恢复图标
          if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
          if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
          if (outputEl) { outputEl.remove(); outputEl = null; }
          if (prevOutputEl) { prevOutputEl.remove(); prevOutputEl = null; }
          if (outputWrap && !outputWrap.children.length) { outputWrap.remove(); outputWrap = null; }
          target.child('.ic').className = 'ic i-play';
          running = false;
          return;
        }
        // 运行：旧输出暂留对比，3 秒后清除
        if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
        if (prevOutputEl) { prevOutputEl.remove(); prevOutputEl = null; }
        if (outputEl) {
          prevOutputEl = outputEl;
          outputEl = null;
          clearTimer = setTimeout(function () {
            if (prevOutputEl) { prevOutputEl.remove(); prevOutputEl = null; }
            if (outputWrap && !outputWrap.children.length) { outputWrap.remove(); outputWrap = null; }
            clearTimer = null;
          }, 3000);
        }

        running = true;
        target.child('.ic').className = 'ic i-pause';

        abortCtrl = new AbortController();
        if (element.hasClass('fullscreen')) {
          // 全屏模式：wrapper 整体 sticky，新输出插到顶部，旧结果在下方
          if (!outputWrap) {
            outputWrap = document.createElement('div');
            outputWrap.className = 'code-runner-output-wrap';
            element.appendChild(outputWrap);
          }
          outputWrap.insertAdjacentHTML('afterbegin', '<pre class="code-runner-output fullscreen"><code>测试</code></pre>');
          outputEl = outputWrap.firstElementChild;
        } else {
          element.insertAdjacentHTML('afterend', '<pre class="code-runner-output"><code>测试</code></pre>');
          outputEl = element.nextElementSibling;
        }
        var outputCode = outputEl.querySelector('code');

        console.debug('[runnerBtn] window.__runCode type:', typeof window.__runCode);
        if (typeof window.__runCode !== 'function') {
          outputCode.textContent = '✗ 运行环境未加载，请刷新页面后重试';
          status.className = 'code-runner-status error';
          target.child('.ic').className = 'ic i-play';
          running = false;
          abortCtrl = null;
          return;
        }
        console.debug('[runnerBtn] calling window.__runCode with lang=%s code=%s', lang, code.slice(0,50));
        window.__runCode(code, lang, status, outputCode, abortCtrl.signal).finally(function () {
          // 完成：恢复图标
          target.child('.ic').className = 'ic i-play';
          running = false;
          abortCtrl = null;
        });
      });
    } else {
      runnerBtn.remove();
    };

    var breakBtn = element.child('.breakline-btn');
    breakBtn.addEventListener('click', function (event) {
      var target = event.currentTarget;
      if (element.hasClass('breakline')) {
        element.removeClass('breakline');
        target.child('.ic').className = 'ic i-align-left';
      } else {
        element.addClass('breakline');
        target.child('.ic').className = 'ic i-align-justify';
      }
    });

    var downloadBtn = element.child('.download-btn');
    downloadBtn.addEventListener('click', function (event) {
      var target = event.currentTarget;
      target.child('.ic').className = 'ic i-check';
      const cls = caption.attr('data-ext');
      const ext = cls || 'txt';
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code.' + ext.toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    downloadBtn.addEventListener('mouseleave', function (event) {
      setTimeout(function () {
        event.target.child('.ic').className = 'ic i-download';
      }, 1000);
    });

    var fullscreenBtn = element.child('.fullscreen-btn');
    var removeFullscreen = function() {
      element.removeClass('fullscreen');
      element.scrollTop = 0;
      BODY.removeClass('fullscreen');
      fullscreenBtn.child('.ic').className = 'ic i-expand';
    }
    var fullscreenHandle = function(event) {
      var target = event.currentTarget;
      if (element.hasClass('fullscreen')) {
        removeFullscreen();
        hideCode && hideCode();
        pageScroll(element)
      } else {
        element.addClass('fullscreen');
        BODY.addClass('fullscreen');
        fullscreenBtn.child('.ic').className = 'ic i-compress';
        showCode && showCode();
      }
    }
    fullscreenBtn.addEventListener('click', fullscreenHandle);
    caption && caption.addEventListener('click', fullscreenHandle);

    var foldBtn = element.child('.fold-btn');
    foldBtn.addEventListener('click', function (event) {
      element.toggleClass('fold');
    });

    var moreBtn = element.child('.more-btn');
    moreBtn.addEventListener('click', function (event) {
      moreBtn.classList.toggle('dropdown');
    });

    // 动态管理 more-btn 下拉：常驻按钮以外全部收入左侧面板
    (function() {
      var operation = element.child('.operation');
      var allBtns = operation.querySelectorAll('span:not(.more-btn)');
      for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove('dropdown-item');
      }
      // 移除旧面板（Pjax 场景）
      var oldPanel = operation.querySelector('.dropdown-panel');
      if (oldPanel) oldPanel.remove();

      // 分离常驻按钮（始终可见）和可隐藏按钮（进入面板）
      var hidable = [];
      for (var m = 0; m < allBtns.length; m++) {
        if (!allBtns[m].matches('.copy-btn, .fullscreen-btn, .fold-btn')) {
          hidable.push(allBtns[m]);
        }
      }

      if (hidable.length > 0) {
        var panel = document.createElement('span');
        panel.className = 'dropdown-panel';
        for (var k = 0; k < hidable.length; k++) {
          hidable[k].classList.add('dropdown-item');
          panel.appendChild(hidable[k]);
        }
        operation.appendChild(panel);
        moreBtn.style.display = '';
      } else {
        moreBtn.style.display = 'none';
      }
    })();

    if(code_container && code_container.find("tr").length > 15) {

      code_container.style.maxHeight = "300px";
      code_container.insertAdjacentHTML('beforeend', '<div class="show-btn"><i class="ic i-angle-down"></i></div>');
      var showBtn = code_container.child('.show-btn');

      var showCode = function() {
        code_container.style.maxHeight = ""
        showBtn.addClass('open')
      }

      var hideCode = function() {
        code_container.style.maxHeight = "300px"
        showBtn.removeClass('open')
      }

      showBtn.addEventListener('click', function(event) {
        if (showBtn.hasClass('open')) {
          removeFullscreen()
          hideCode()
          pageScroll(code_container)
        } else {
          showCode()
        }
      });
    }
  });

  $.each('pre.mermaid > svg', function (element) {
    element.style.maxWidth = ''
  });

  $.each('.reward button', function (element) {
    element.addEventListener('click', function (event) {
      event.preventDefault();
      var qr = $('#qr')
      if(qr.display() === 'inline-flex') {
        transition(qr, 0)
      } else {
        transition(qr, 1, function() {
          qr.display('inline-flex')
        }) // slideUpBigIn
      }
    });
  });

  //shuffle quiz options — Fisher-Yates helper
  function shuffleQuizOptions(quiz) {
    var optionsUl = quiz.querySelector('ul.options');
    if (!optionsUl) return;

    var items = Array.from(optionsUl.children);
    if (items.length < 2) return;

    var indices = items.map(function(_, i) { return i; });
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }

    var shuffled = indices.map(function(idx) { return items[idx]; });
    shuffled.forEach(function(li) { optionsUl.appendChild(li); });

    var blockquoteUl = quiz.querySelector('blockquote ul.options');
    if (blockquoteUl) {
      var explainItems = Array.from(blockquoteUl.children);
      if (explainItems.length === items.length) {
        var shuffledExplain = indices.map(function(idx) { return explainItems[idx]; });
        shuffledExplain.forEach(function(li) { blockquoteUl.appendChild(li); });
      }
    }
  }

  if (LOCAL.quiz && LOCAL.quiz.shuffle) {
    // 全局打乱：所有题目默认打乱，.no-shuffle 可排除
    $.each('.quiz:not(.no-shuffle)', function (quiz) {
      shuffleQuizOptions(quiz);
    });
  } else {
    // 按题打乱：仅 .quiz.shuffle 的题目会打乱
    $.each('.quiz.shuffle', function (quiz) {
      shuffleQuizOptions(quiz);
    });
  }

  //quiz
  $.each('.quiz > ul.options li', function (element) {
    element.addEventListener('click', function (event) {
      if (element.hasClass('correct')) {
        element.toggleClass('right')
        element.parentNode.parentNode.addClass('show')
      } else {
        element.toggleClass('wrong')
      }
    });
  });

  $.each('.quiz > p', function (element) {
    element.addEventListener('click', function (event) {
      element.parentNode.toggleClass('show')
    });
  });

  $.each('.quiz > p:first-child', function (element) {
    var quiz = element.parentNode;
    var type = 'choice'
    if(quiz.hasClass('true') || quiz.hasClass('false'))
      type = 'true_false'
    if(quiz.hasClass('multi'))
      type = 'multiple'
    if(quiz.hasClass('fill'))
      type = 'gap_fill'
    if(quiz.hasClass('essay'))
      type = 'essay'
    if(quiz.hasClass('explan'))
      type = 'explan'
    if(quiz.hasClass('brief'))
      type = 'brief'
    if(quiz.hasClass('proof'))
      type = 'proof'
    if(quiz.hasClass('algorithm'))
      type = 'algorithm'
    element.attr('data-type', LOCAL.quiz[type])
  });

  $.each('.quiz .mistake', function (element) {
    element.attr('data-type', LOCAL.quiz.mistake)
  });

  $.each('.quiz.brief > blockquote > p:first-child', function (element) {
    element.attr('data-type', LOCAL.quiz.soln)
  });

  $.each('.quiz.proof > blockquote > p:first-child', function (element) {
    element.attr('data-type', LOCAL.quiz.prove)
  });



  $.each('div.tags a', function(element) {
    element.className = ['primary', 'success', 'info', 'warning', 'danger'][Math.floor(Math.random() * 5)]
  })

  $.each('.md div.player', function(element) {
    mediaPlayer(element, {
      type: element.attr('data-type'),
      mode: 'order',
      btns: []
    }).player.load(JSON.parse(element.attr('data-src'))).fetch()
  })

  initPan()
}

const tabFormat = function() {
  // tab
  var first_tab
  $.each('div.tab', function(element, index) {
    if(element.attr('data-ready'))
      return

    var id = element.attr('data-id');
    var title = element.attr('data-title');
    var box = $('#' + id);
    if(!box) {
      box = document.createElement('div');
      box.className = 'tabs';
      box.id = id;
      box.innerHTML = '<div class="show-btn"></div>'

      var showBtn = box.child('.show-btn');
      showBtn.addEventListener('click', function(event) {
        pageScroll(box)
      });

      element.parentNode.insertBefore(box, element);
      first_tab = true;
    } else {
      first_tab = false;
    }

    var ul = box.child('.nav ul');
    if(!ul) {
      ul = box.createChild('div', {
        className: 'nav',
        innerHTML: '<ul></ul>'
      }).child('ul');
    }

    var li = ul.createChild('li', {
      innerHTML: title
    });

    if(first_tab) {
      li.addClass('active');
      element.addClass('active');
    }

    li.addEventListener('click', function(event) {
      var target = event.currentTarget;
      box.find('.active').forEach(function(el) {
        el.removeClass('active');
      })
      element.addClass('active');
      target.addClass('active');
    });

    box.appendChild(element);
    element.attr('data-ready', true)
  });
}

const loadComments = function () {
  var element = $('#comments') || $('#tcomments');
  if (!element) {
    goToComment.display("none")
    return;
  } else {
    goToComment.display("")
  }

  if (!window.IntersectionObserver) {
    vendorCss('valine') || vendorCss('twikoo');
  } else {
    var io = new IntersectionObserver(function(entries, observer) {
      var entry = entries[0];
      vendorCss('valine') || vendorCss('twikoo');
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        transition($('#comments'), 'bounceUpIn') || transition($('#tcomments'), 'bounceUpIn');
        observer.disconnect();
      }
    });

    io.observe(element);
  }
}

var panInited = false;
const initPan = function() {
  if (panInited) return;
  panInited = true;
  document.addEventListener('click', function(e) {
    var pan = e.target.closest('.pan');
    if (!pan || pan.hasClass('pan-loading')) return;
    var code = pan.getAttribute('data-code');
    var link = pan.getAttribute('data-link');
    if (!code && !link) return;
    pan.addClass('pan-loading');
    window.setTimeout(function() {
      if (code) clipBoard(code, function() {
        showtip(code + '<br>' + LOCAL.copyright);
      });
      window.open(link, '_blank');
      pan.removeClass('pan-loading');
    }, 3000);
  });
};

const searchController = function(pjax) {
  // Determine available search modes
  var hasAlgolia = CONFIG.search !== null;
  var hasLocal = typeof CONFIG.localSearch !== 'undefined';
  if (!hasAlgolia && !hasLocal) return;

  var searchModes = [];
  var modeLabels = { algolia: LOCAL.search.mode.algolia, local: LOCAL.search.mode.local };
  if (hasAlgolia) searchModes.push({ key: 'algolia', label: modeLabels.algolia });
  if (hasLocal) searchModes.push({ key: 'local', label: modeLabels.local });

  var activeMode = searchModes[0].key;
  var localSearchInstance = null;
  var algoliaInstance = null;

  // ── Build popup DOM once ──────────────────────────────────────────
  if (!siteSearch) {
    var resultsHTML = '';
    if (hasAlgolia) {
      resultsHTML += '<div id="search-algolia"><div id="search-stats"></div><div id="search-hits"></div><div id="search-pagination"></div></div>';
    }
    if (hasLocal) {
      resultsHTML += '<div id="search-local" style="display:none"><div id="local-search-loading-status"></div><div class="search-result-stats"></div><hr><div id="local-search-results"></div><div id="local-search-pagination"></div></div>';
    }

    var tabsHTML = '';
    if (searchModes.length > 1) {
      tabsHTML = '<div class="search-mode-tabs">' +
        searchModes.map(function(mode) {
          return '<span class="search-mode-tab" data-search-mode="' + mode.key + '">' + mode.label + '</span>';
        }).join('') +
        '</div>';
    }

    siteSearch = BODY.createChild('div', {
      id: 'search',
      innerHTML: '<div class="inner"><div class="header"><span class="icon"><i class="ic i-search"></i></span><div class="search-input-container"></div><span class="close-btn"><i class="ic i-times-circle"></i></span></div>' + tabsHTML + '<div class="results"><div class="inner">' + resultsHTML + '</div></div></div>'
    });
  }

  // ── Initialize Algolia ────────────────────────────────────────────
  if (hasAlgolia) {
    var search = instantsearch({
      indexName: CONFIG.search.indexName,
      searchClient  : algoliasearch(CONFIG.search.appID, CONFIG.search.apiKey),
      searchFunction: function(helper) {
        var searchInput = $('.search-input');
        if (searchInput.value) {
          helper.search();
        }
      }
    });

    search.on('render', function() {
      pjax.refresh($('#search-hits'));
    });

    // Registering Widgets
    search.addWidgets([
      instantsearch.widgets.configure({
        hitsPerPage: CONFIG.search.hits.per_page || 10
      }),

      instantsearch.widgets.searchBox({
        container           : '.search-input-container',
        placeholder         : LOCAL.search.placeholder,
        // Hide default icons of algolia search
        showReset           : false,
        showSubmit          : false,
        showLoadingIndicator: false,
        cssClasses          : {
          input: 'search-input'
        }
      }),

      instantsearch.widgets.stats({
        container: '#search-stats',
        templates: {
          text: function(data) {
            var stats = LOCAL.search.stats
              .replace(/\$\{hits}/, data.nbHits)
              .replace(/\$\{time}/, data.processingTimeMS);
            return stats + '<span class="algolia-powered"></span><hr>';
          }
        }
      }),

      instantsearch.widgets.hits({
        container: '#search-hits',
        templates: {
          item: function(data) {
            var cats = data.categories ? '<span>'+data.categories.join('<i class="ic i-angle-right"></i>')+'</span>' : '';
            return '<a href="' + CONFIG.root + data.path +'">'+cats+data._highlightResult.title.value+'</a>';
          },
          empty: function(data) {
            return '<div id="hits-empty">'+
                LOCAL.search.empty.replace(/\$\{query}/, data.query) +
              '</div>';
          }
        },
        cssClasses: {
          item: 'item'
        }
      }),

      instantsearch.widgets.pagination({
        container: '#search-pagination',
        scrollTo : false,
        showFirst: false,
        showLast : false,
        templates: {
          first   : '<i class="ic i-angle-double-left"></i>',
          last    : '<i class="ic i-angle-double-right"></i>',
          previous: '<i class="ic i-angle-left"></i>',
          next    : '<i class="ic i-angle-right"></i>'
        },
        cssClasses: {
          root        : 'pagination',
          item        : 'pagination-item',
          link        : 'page-number',
          selectedItem: 'current',
          disabledItem: 'disabled-item'
        }
      })
    ]);

    search.start();
    algoliaInstance = search;
  }

  // ── Initialize Local Search ───────────────────────────────────────
  if (hasLocal) {
    localSearchInstance = initLocalSearch(pjax);
  }

  // ── Mode switching ────────────────────────────────────────────────
  function switchMode(modeKey) {
    if (modeKey === activeMode) return;
    activeMode = modeKey;

    // Update tab active states
    $.all('.search-mode-tab').forEach(function(tab) {
      tab.classList.toggle('active', tab.dataset.searchMode === modeKey);
    });

    var algoliaWrap = document.getElementById('search-algolia');
    var localWrap = document.getElementById('search-local');

    if (modeKey === 'algolia') {
      if (localSearchInstance) localSearchInstance.deactivate();
      if (algoliaWrap) {
        algoliaWrap.style.display = '';
        // Re-trigger Algolia search with current input
        if (algoliaInstance && algoliaInstance.helper) {
          algoliaInstance.helper.search();
        }
      }
      if (localWrap) localWrap.style.display = 'none';
    } else if (modeKey === 'local') {
      // Clear Algolia state to avoid mismatched results on switch back
      if (algoliaInstance && algoliaInstance.helper) {
        algoliaInstance.helper.setQuery('').search();
      }
      if (algoliaWrap) algoliaWrap.style.display = 'none';
      if (localSearchInstance) localSearchInstance.activate();
    }
  }

  // Set initial active tab
  if (searchModes.length > 1) {
    $.each('.search-mode-tab', function(tab) {
      if (tab.dataset.searchMode === activeMode) {
        tab.classList.add('active');
      }
      tab.addEventListener('click', function() {
        switchMode(tab.dataset.searchMode);
      });
    });
  }

  // Activate default mode
  if (activeMode === 'local' && localSearchInstance) {
    localSearchInstance.activate();
  }

  // ── Open / close handlers (shared) ────────────────────────────────
  // Handle and trigger popup window
  $.each('.search', function(element) {
    element.addEventListener('click', function() {
      document.body.style.overflow = 'hidden';
      transition(siteSearch, 'shrinkIn', function() {
          $('.search-input').focus();
        }) // transition.shrinkIn
    });
  });

  // Monitor main search box
  const onPopupClose = function() {
    document.body.style.overflow = '';
    transition(siteSearch, 0); // "transition.shrinkOut"
  };

  siteSearch.addEventListener('click', function(event) {
    if (event.target === siteSearch) {
      onPopupClose();
    }
  });
  $('.close-btn').addEventListener('click', onPopupClose);
  window.addEventListener('pjax:success', onPopupClose);
  window.addEventListener('keyup', function(event) {
    if (event.key === 'Escape') {
      onPopupClose();
    }
  });
}
