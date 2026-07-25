const domInit = function() {
  $.each('.overview .menu > .item', function(el) {
    siteNav.child('.menu').appendChild(el.cloneNode(true));
  })

  loadCat.addEventListener('click', Loader.vanish);
  menuToggle.addEventListener('click', sideBarToggleHandle);
  $('.dimmer').addEventListener('click', sideBarToggleHandle);

  quickBtn.child('.down').addEventListener('click', goToBottomHandle);
  quickBtn.child('.up').addEventListener('click', backToTopHandle);

  if(!toolBtn) {
    toolBtn = siteHeader.createChild('div', {
      id: 'tool',
      innerHTML: '<div class="item player"></div><div class="item contents"><i class="ic i-list-ol"></i></div><div class="item chat"><i class="ic i-comments"></i></div><div class="item live2d"><i class="ic i-thumbtack"></i></div><div class="item back-to-top"><i class="ic i-arrow-up"></i><span>0%</span></div>'
    });
  }

  if(!angleBtn) {
    angleBtn = siteHeader.createChild('div', {
      id: 'angle',
      innerHTML: '<span><i class="ic i-angle-down" aria-hidden="true"></i></span>'
    });
  }

  toolPlayer = toolBtn.child('.player');
  backToTop = toolBtn.child('.back-to-top');
  goToComment = toolBtn.child('.chat');
  chooselive2d = toolBtn.child('.live2d');
  showContents = toolBtn.child('.contents');

  angleBtn.addEventListener('click',headertopdown);
  backToTop.addEventListener('click', backToTopHandle);
  goToComment.addEventListener('click', goToCommentHandle);
  chooselive2d.addEventListener('click', chooseLive2dHandle);
  showContents.addEventListener('click', sideBarToggleHandle);

  mediaPlayer(toolPlayer)
  $('main').addEventListener('click', function() {
    toolPlayer.player.mini()
  })
}

const pjaxReload = function () {
  pagePosition()

  if(sideBar.hasClass('on')) {
    transition(sideBar, function () {
        sideBar.removeClass('on');
        menuToggle.removeClass('close');
      }); // 'transition.slideRightOut'
  }

  $('#main').innerHTML = ''
  $('#main').appendChild(loadCat.lastChild.cloneNode(true));
  pageScroll(0);
}

// 从 Gravatar/Cravatar 头像 URL 中提取邮箱 MD5 哈希
var twikooObserver = null;
const getAvatarHash = function(img) {
	if (!img) return null;
	var src = img.getAttribute('src') || '';
	var match = src.match(/\/avatar\/([a-f0-9]+)/i);
	return match ? match[1].toLowerCase() : null;
};

// 从 Twikoo 配置的 tagColor 注入 CSS 自定义属性，配合 color-mix() 驱动标签配色
var applyTagColors = function(container, config) {
	if (!config || !config.tagColor) return;
	var props = {
		master: '--twikoo-master-color',
		visitor: '--twikoo-visitor-color',
		friend: '--twikoo-friend-color',
		investor: '--twikoo-investor-color'
	};
	for (var type in props) {
		if (config.tagColor[type]) {
			container.style.setProperty(props[type], config.tagColor[type]);
		}
	}
};

// 为 Twikoo 评论注入标签徽章
// - DB master=true 用户由 Twikoo 原生渲染 .tk-tag-green（颜色受 --twikoo-master-color 驱动）
// - tagMember.master 列表用户（非 DB master）由本函数注入 .tk-tag-master
// - 两种 master 标签视觉一致（共用同一个 CSS 自定义属性）
var TAG_COLOR_MAP = { master: 'master', friend: 'friend', investor: 'investor', visitor: 'visitor' };
const addTwikooTags = function(container, config) {
	if (!config || !config.tagMember) return;
	var comments = container.querySelectorAll('.tk-comment:not(.tk-tagged)');
	comments.forEach(function(comment) {
		comment.classList.add('tk-tagged');
		var avatarImg = comment.querySelector('.tk-avatar-img');
		var hash = getAvatarHash(avatarImg);
		var tagType = null;
		if (hash) {
			var tagMember = config.tagMember;
			for (var type in tagMember) {
				if (tagMember.hasOwnProperty(type) && tagMember[type] && tagMember[type].some(function(h) {
					return h.toLowerCase() === hash;
				})) {
					tagType = type;
					break;
				}
			}
		}
		if (!tagType) {
			// 未匹配任何 member 列表 → 默认 visitor
			// 但若已有 .tk-tag-green（DB master 原生标签），不再追加 visitor
			if (comment.querySelector('.tk-tag-green')) return;
			tagType = 'visitor';
		}
		if (!config.tagMeta || !config.tagMeta[tagType]) return;
		// DB master=true 用户已有原生 .tk-tag-green，跳过避免重复标签
		if (tagType === 'master' && comment.querySelector('.tk-tag-green')) return;
		var tag = document.createElement('span');
		var colorClass = TAG_COLOR_MAP[tagType] || tagType;
		tag.className = 'tk-tag tk-tag-' + colorClass;
		tag.textContent = config.tagMeta[tagType];
		var nickLink = comment.querySelector('.tk-nick-link');
		if (nickLink && nickLink.parentNode) {
			nickLink.parentNode.insertBefore(tag, nickLink.nextSibling);
		}
	});
};

const siteRefresh = function (reload) {
  LOCAL_HASH = 0
  LOCAL_URL = window.location.href

  vendorCss('katex');
  vendorJs('copy_tex');
  vendorCss('mermaid');
  vendorJs('chart');
  vendorCss('heti');
  vendorJs('heti');
  if(CONFIG.valine) {
    vendorJs('valine', function() {
      var options = Object.assign({}, CONFIG.valine);
      options = Object.assign(options, LOCAL.valine||{});
      options.el = '#comments';
      options.pathname = LOCAL.path;
      options.pjax = pjax;
      options.lazyload = lazyload;

      new MiniValine(options);

      setTimeout(function(){
        positionInit(1);
        postFancybox('.v');
      }, 1000);
    }, window.MiniValine);
  }
  if(CONFIG.twikoo) {
    vendorCss('twikoo');
    vendorJs('twikoo', function() {
      var options = Object.assign({}, CONFIG.twikoo);
      options = Object.assign(options, LOCAL.twikoo||{});
      options.envId = options.envId;
      options.region = options.region || 'none';
      options.el = '#tcomments';
      options.path = LOCAL.path;
      options.pjax = pjax;
      options.lazyload = lazyload;
      options.includeReply = options.includeReply || false;
      options.pageSize = options.pageSize || 10;

      // 统一 DB master 与 tagMember.master 的主标识文案
      if (options.tagMeta && options.tagMeta.master) {
        options.MASTER_TAG = options.tagMeta.master;
      }

      // 先 init 评论框，再异步获取最近评论，避免同步 callback 下内部状态冲突
      window.twikoo.init(options);

      // Twikoo 不支持 onCommentLoaded，用 MutationObserver 监听评论渲染完成后注入标签
      if (twikooObserver) twikooObserver.disconnect();
      twikooObserver = new MutationObserver(function(mutations) {
        var container = document.querySelector('#twikoo');
        if (!container) return;
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.querySelectorAll) {
              var comments = node.querySelectorAll('.tk-comment');
              if (comments.length > 0) {
                applyTagColors(container, options);
                addTwikooTags(container, options);
              }
            }
          });
        });
      });
      // 尽早开始观察 body，捕获 Twikoo 渲染的 DOM
      twikooObserver.observe(document.body, { childList: true, subtree: true });

      setTimeout(function(){
        positionInit(1);
        postFancybox('.twikoo');
        // 兜底：observer 可能漏掉，setTimeout 补一次
        var container = document.querySelector('#twikoo');
        if (container) {
          applyTagColors(container, options);
          addTwikooTags(container, options);
        }
      }, 1000);

      window.twikoo.getRecentComments({
        envId: options.envId,
        includeReply: options.includeReply,
        pageSize: options.pageSize
      }).then(function(res) {
        const commentList = document.getElementById('twikoo_comment');
        if (!commentList) return;
        const html = res.sort(function (a, b) { return b.created - a.created }).map(function (item) {
          return '<li class="item"><a href="'+item.url+'#'+item.id+'" data-pjax-state="data-pjax-state"><span class="breadcrumb">'+item.nick+' @ '+item.relativeTime+'</span><span>'+item.commentText+'</span></a></li>'
        }).join('');
        commentList.insertAdjacentHTML('beforeend', html);
      }).catch(function (err) {
        console.log(err)
      });
    }, window.twikoo);
  }

  if(!reload) {
    $.each('script[data-pjax]', pjaxScript);
  }

  originTitle = document.title

  resizeHandle()

  menuActive()

  sideBarTab()
  sidebarTOC()

  registerExtURL()
  postBeauty()
  tabFormat()

  toolPlayer.player.load(LOCAL.audio || CONFIG.audio || {})

  Loader.hide()

  setTimeout(function(){
    positionInit()
  }, 500);

  cardActive()

  lazyload.observe()

  isOutime() //判断文章时效性

  renderAISummary() //AI文章总结

  if (typeof TablePaginationManager !== 'undefined') {
    TablePaginationManager.initAllTables() // 初始化所有表格的分页
  }

  if (typeof FigureLabelManager !== 'undefined') {
    FigureLabelManager.init() // 初始化图片的标签
  }

}

const siteInit = function () {

  domInit()

  pjax = new Pjax({
            selectors: [
              'head title',
              '.languages',
              '.pjax',
              'script[data-config]'
            ],
            analytics: false,
            cacheBust: false
          })

  CONFIG.quicklink.ignores = LOCAL.ignores
  quicklink.listen(CONFIG.quicklink)

  autoDarkmode() //自动切换暗黑模式
  getCDNinfo() //获取CDN信息

  visibilityListener()
  themeColorListener()

  searchController(pjax)

  window.addEventListener('scroll', scrollHandle)

  window.addEventListener('resize', resizeHandle)

  window.addEventListener('pjax:send', pjaxReload)

  window.addEventListener('pjax:success', siteRefresh)

  window.addEventListener('beforeunload', function() {
    pagePosition()
  })

  siteRefresh(1)
}

window.addEventListener('DOMContentLoaded', siteInit);

console.log('%c Theme.Shoka v' + CONFIG.version + ' %c https://shoka.lostyu.me ', 'color:#fff;background:linear-gradient(90deg,#d24c60,#d96778);padding:5px 0;', 'color:#000;background:linear-gradient(90deg,#d96778,#ffffff);padding:5px 10px 5px 0px;');

console.log("             -. .\n       _____   ',' ,\n     ,'     ,'   ', ',\n   ,'     ,'      |  |\n   \\       \\       |  |\n     \\ /^\\   \\    ,' ,'\n           \\   \\ ,' ,'      L'Internationale,\n     / ~-.___\\.-'  ,'            Sera le genre humain.\n   /   .______.- ~ \\\n /   /'          \\   \\\n \\./               \\/'\n");
