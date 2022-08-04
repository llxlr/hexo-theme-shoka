/* global hexo */

/*
{% dogecloud <code> %} 
*/

'use strict';

const { parseArgs } = require('./utils');
const list = ['userId', 'vcode', 'pic', 'autoPlay'];
let counter = 0;

function dogecloud(args) {
    let id = 'dogecloud-' + counter++, params = parseArgs(args, list);
    return `<div id="${id}" class="pjax" style="margin-top: 15px;margin-bottom: 15px;"></div>
<script data-pjax>
  var player = new DogePlayer({
    'container': document.getElementById('${id}'),
    'userId': ${parseInt(params.userId) || 92},
    'autoPlay': ${Boolean(params.autoPlay) || false},
    ${JSON.stringify(params).replace('{','').replace('}','')}
  });
</script>`;
}

hexo.extend.injector.register('head_end', `<script type="text/javascript" src="https://player.dogecloud.com/js/loader"></script>`);

hexo.extend.tag.register('dogecloud', dogecloud, {ends: false});
