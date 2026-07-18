/*
{% moequote "" %}
contents
{% endmoequote %}
*/
hexo.extend.tag.register('moequote', (args, content) => {
  var citation = '';
  if (args[0]) {
    var citation = `<figcaption class="moequote credits"><cite>${args[0]}</cite></figcaption>`;
  }
  return `<div style="margin:30px auto 20px auto;width:fit-content;color:#888 !important;">
<figure class="moequote">
  <blockquote class="moequote body">
    <div class="moequote-slg">
      <div class="anim">
        ${content.replace(/^\s+|\s+$/g, '')}
      </div>
    </div>
  </blockquote>
  ${citation}
</figure>
</div>`;
}, { ends: true })
// content.split(/[\s\n]/)
