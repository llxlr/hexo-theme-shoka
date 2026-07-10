'use strict';

// Custom search data generator — replaces hexo-generator-searchdb.
// Outputs search.json with title, url, content, and categories
// for the local search feature.

hexo.extend.generator.register('search-data', function(locals) {
  const config = hexo.config;
  if (!config.local_search || !config.local_search.enable) return;

  const posts = locals.posts.sort('-date').filter(function(post) {
    return post.published !== false;
  });

  const data = posts.map(function(post) {
    // Rendered content (HTML) → plain text
    var content = '';
    if (post.content) {
      content = post.content
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Category breadcrumb
    var categories = [];
    if (post.categories && post.categories.data) {
      categories = post.categories.data.map(function(c) { return c.name; });
    }

    return {
      title: post.title,
      url: '/' + post.path,
      content: content,
      categories: categories
    };
  });

  return {
    path: 'search.json',
    data: JSON.stringify(data)
  };
});
