/* global hexo */

/*
{% abstract %}
<content>
{% endabstract %}
*/

'use strict';

hexo.extend.tag.register('abstract', (args, content) => {
    if(!content){return;}
    return `<span class="abstract">
  <fieldset>
    <legend>摘要</legend>
    <p>${content}</p>
    <div></div>
  </fieldset>
</span>`;
}, {ends: true});
