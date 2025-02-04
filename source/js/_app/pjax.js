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

const siteRefresh = function (reload) {
  LOCAL_HASH = 0
  LOCAL_URL = window.location.href

  vendorCss('katex');
  vendorJs('copy_tex');
  vendorCss('mermaid');
  vendorJs('chart');
  vendorCss('heti');
  vendorJs('heti');
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

  if(LOCAL.heti){
    const heti = new Heti('.heti');
    heti.autoSpacing();
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

  algoliaSearch(pjax)

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
