/* global hexo */

/*
{% abstract %}
<content>
{% endabstract %}
*/

'use strict';

hexo.extend.tag.register('abstract', (args, content) => {
    if(!content){return;}
    let title = args[0] || '摘要';
    return `<span class="abstract">
  <fieldset>
    <legend>${title}</legend>
    <p>${content}</p>
    <div></div>
  </fieldset>
</span>`;
}, {ends: true});
