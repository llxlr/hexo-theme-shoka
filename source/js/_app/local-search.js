/**
 * Refer to hexo-generator-searchdb
 * https://github.com/next-theme/hexo-generator-searchdb/blob/main/dist/search.js
 * Modified by hexo-theme-shoka
 */

class LocalSearch {
  constructor ({
    path = '',
    unescape = false,
    top_n_per_article = 1
  }) {
    this.path = path
    this.unescape = unescape
    this.top_n_per_article = top_n_per_article
    this.isfetched = false
    this.datas = null
  }

  getIndexByWord (words, text, caseSensitive = false) {
    const index = []
    const included = new Set()

    if (!caseSensitive) {
      text = text.toLowerCase()
    }
    words.forEach(word => {
      if (this.unescape) {
        const div = document.createElement('div')
        div.innerText = word
        word = div.innerHTML
      }
      const wordLen = word.length
      if (wordLen === 0) return
      let startPosition = 0
      let position = -1
      if (!caseSensitive) {
        word = word.toLowerCase()
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word })
        included.add(word)
        startPosition = position + wordLen
      }
    })
    // Sort index by position of keyword
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position
      }
      return right.word.length - left.word.length
    })
    return [index, included]
  }

  // Merge hits into slices
  mergeIntoSlice (start, end, index) {
    let item = index[0]
    let { position, word } = item
    const hits = []
    const count = new Set()
    while (position + word.length <= end && index.length !== 0) {
      count.add(word)
      hits.push({
        position,
        length: word.length
      })
      const wordEnd = position + word.length

      // Move to next position of hit
      index.shift()
      while (index.length !== 0) {
        item = index[0]
        position = item.position
        word = item.word
        if (wordEnd > position) {
          index.shift()
        } else {
          break
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    }
  }

  // Highlight title and content
  highlightKeyword (val, slice) {
    let result = ''
    let index = slice.start
    for (const { position, length } of slice.hits) {
      result += val.substring(index, position)
      index = position + length
      result += `<mark class="search-keyword">${val.substr(position, length)}</mark>`
    }
    result += val.substring(index, slice.end)
    return result
  }

  getResultItems (keywords) {
    const resultItems = []
    this.datas.forEach(({ title, content, url, categories }) => {
      // The number of different keywords included in the article.
      const [indexOfTitle, keysOfTitle] = this.getIndexByWord(keywords, title)
      const [indexOfContent, keysOfContent] = this.getIndexByWord(keywords, content)
      const includedCount = new Set([...keysOfTitle, ...keysOfContent]).size

      // Show search results
      const hitCount = indexOfTitle.length + indexOfContent.length
      if (hitCount === 0) return

      const slicesOfTitle = []
      if (indexOfTitle.length !== 0) {
        slicesOfTitle.push(this.mergeIntoSlice(0, title.length, indexOfTitle))
      }

      let slicesOfContent = []
      while (indexOfContent.length !== 0) {
        const item = indexOfContent[0]
        const { position } = item
        // Cut out 120 characters. The maxlength of .search-input is 80.
        const start = Math.max(0, position - 20)
        const end = Math.min(content.length, position + 100)
        slicesOfContent.push(this.mergeIntoSlice(start, end, indexOfContent))
      }

      // Sort slices in content by included keywords' count and hits' count
      slicesOfContent.sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count
        } else if (left.hits.length !== right.hits.length) {
          return right.hits.length - left.hits.length
        }
        return left.start - right.start
      })

      // Select top N slices in content
      const upperBound = parseInt(this.top_n_per_article, 10)
      if (upperBound >= 0) {
        slicesOfContent = slicesOfContent.slice(0, upperBound)
      }

      let resultItem = ''

      url = new URL(url, location.origin)
      url.searchParams.append('highlight', keywords.join(' '))

      // Category breadcrumbs
      var catBread = ''
      if (categories && categories.length) {
        catBread = '<span class="search-result-cats">' +
          categories.join('<i class="ic i-angle-right"></i>') + '</span>';
      }

      if (slicesOfTitle.length !== 0) {
        resultItem += '<div class="local-search-hit-item"><a href="' + url.href + '">' + catBread +
          '<span class="search-result-title">' + this.highlightKeyword(title, slicesOfTitle[0]) + '</span>';
      } else {
        resultItem += '<div class="local-search-hit-item"><a href="' + url.href + '">' + catBread +
          '<span class="search-result-title">' + title + '</span>';
      }

      slicesOfContent.forEach(slice => {
        resultItem += '<p class="search-result">' + this.highlightKeyword(content, slice) + '...</p></a>';
      })

      resultItem += '</div>'
      resultItems.push({
        item: resultItem,
        id: resultItems.length,
        hitCount,
        includedCount
      })
    })
    return resultItems
  }

  fetchData () {
    const isXml = !this.path.endsWith('json')
    fetch(this.path)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        this.isfetched = true
        this.datas = isXml
          ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => ({
              title: element.querySelector('title').textContent,
              content: element.querySelector('content').textContent,
              url: element.querySelector('url').textContent
            }))
          : JSON.parse(res)
        // Only match articles with non-empty titles
        this.datas = this.datas.filter(data => data.title).map(data => {
          data.title = data.title.trim()
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : ''
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/')
          return data
        })
        // Remove loading animation
        window.dispatchEvent(new Event('search:loaded'))
      })
  }

  // Highlight by wrapping node in mark elements with the given class name
  highlightText (node, slice, className) {
    const val = node.nodeValue
    let index = slice.start
    const children = []
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position))
      index = position + length
      const mark = document.createElement('mark')
      mark.className = className
      mark.appendChild(document.createTextNode(val.substr(position, length)))
      children.push(text, mark)
    }
    node.nodeValue = val.substring(index, slice.end)
    children.forEach(element => {
      node.parentNode.insertBefore(element, node)
    })
  }

  // Highlight the search words provided in the url in the text
  highlightSearchWords (body) {
    const params = new URL(location.href).searchParams.get('highlight')
    const keywords = params ? params.split(' ') : []
    if (!keywords.length || !body) return
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null)
    const allNodes = []
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea, .mermaid')) allNodes.push(walk.currentNode)
    }
    allNodes.forEach(node => {
      const [indexOfNode] = this.getIndexByWord(keywords, node.nodeValue)
      if (!indexOfNode.length) return
      const slice = this.mergeIntoSlice(0, node.nodeValue.length, indexOfNode)
      this.highlightText(node, slice, 'search-keyword')
    })
  }
}

// ── Shoka-native initialization ──────────────────────────────────────────
// Called by searchController() in page.js when local search is available.
// Returns { activate, deactivate } so the controller can toggle modes.

function initLocalSearch(pjax) {
  const config = CONFIG.localSearch;
  const localSearch = new LocalSearch({
    path: config.path,
    top_n_per_article: config.top_n_per_article,
    unescape: config.unescape
  });

  var active = false;
  var input = null;
  const loadingEl = document.getElementById('local-search-loading-status');
  const statsEl = document.querySelector('#search-local .search-result-stats');
  const resultsListEl = document.getElementById('local-search-results');
  const paginationEl = document.getElementById('local-search-pagination');
  const resultsEl = document.getElementById('search-local');

  // ── perform search ───────────────────────────────────────────────
  var allResults = [];
  var currentPage = 1;
  var perPage = config.per_page || 10;

  function renderPage(page) {
    var start = (page - 1) * perPage;
    var end = start + perPage;
    var pageItems = allResults.slice(start, end);
    var totalPages = Math.ceil(allResults.length / perPage);

    resultsListEl.innerHTML = '<div class="search-result-list">' +
      pageItems.map(function(r) { return r.item; }).join('') + '</div>';

    statsEl.innerHTML = statsText;

    paginationEl.innerHTML = '';
    if (totalPages > 1) {
      var pagHTML = '<ul class="pagination">';
      for (var i = 1; i <= totalPages; i++) {
        pagHTML += '<li class="pagination-item' + (i === page ? ' current' : '') + '">' +
          '<span class="page-number' + (i === page ? ' current' : '') + '" data-page="' + i + '">' + i + '</span></li>';
      }
      pagHTML += '</ul>';
      paginationEl.innerHTML = pagHTML;
    }

    currentPage = page;

    if (window.pjax) {
      window.pjax.refresh(resultsListEl);
    }
  }

  var statsText = '';

  function doSearch() {
    if (!localSearch.isfetched) return;
    var startTime = performance.now();
    const searchText = input.value.trim();
    // Spinner is set by callers before deferring via setTimeout
    const keywords = searchText.split(/[-\s]+/);
    var resultItems = [];
    if (searchText.length > 0) {
      resultItems = localSearch.getResultItems(keywords);
    }
    var elapsed = Math.round(performance.now() - startTime);
    if (keywords.length === 1 && keywords[0] === '') {
      resultsListEl.innerHTML = '';
      statsEl.innerHTML = '';
      paginationEl.innerHTML = '';
      loadingEl.innerHTML = '';
      return;
    }
    if (resultItems.length === 0) {
      resultsListEl.innerHTML = '';
      statsEl.innerHTML = LOCAL.search.empty.replace(/\$\{query}/, searchText);
      paginationEl.innerHTML = '';
      loadingEl.innerHTML = '';
      return;
    }

    resultItems.sort(function(left, right) {
      if (left.includedCount !== right.includedCount) {
        return right.includedCount - left.includedCount;
      } else if (left.hitCount !== right.hitCount) {
        return right.hitCount - left.hitCount;
      }
      return right.id - left.id;
    });

    statsText = LOCAL.search.stats
      .replace(/\$\{hits}/, resultItems.length)
      .replace(/\$\{time}/, elapsed);

    allResults = resultItems;
    renderPage(1);
    loadingEl.innerHTML = '';
  }

  // ── re-trigger search after async data loads ──────────────────────
  function onDataLoaded() {
    if (active) {
      if (input && input.value.trim()) {
        loadingEl.innerHTML = '<span class="search-spinner"></span>';
        // doSearch() clears the spinner when done
        setTimeout(doSearch, 0);
      } else {
        loadingEl.innerHTML = '';
      }
    }
  }

  // ── highlight keywords from URL on article pages ──────────────────
  function highlightSearchWords() {
    const params = new URL(location.href).searchParams.get('highlight');
    const keywords = params ? params.split(' ') : [];
    if (!keywords.length) return;
    const body = document.getElementById('article-container');
    if (!body) return;
    localSearch.highlightSearchWords(body);
  }

  // ── activate / deactivate ────────────────────────────────────────
  var paginationBound = false;

  function activate() {
    active = true;
    if (!input) {
      input = document.querySelector('#search .search-input');
      if (input) {
        input.addEventListener('input', function() {
          if (!active) return;
          if (input.value.trim()) {
            loadingEl.innerHTML = '<span class="search-spinner"></span>';
          }
          setTimeout(doSearch, 0);
        });
      }
    }
    // Pagination click delegation
    if (!paginationBound && resultsEl) {
      resultsEl.addEventListener('click', function(e) {
        var pageBtn = e.target.closest('.page-number');
        if (pageBtn) {
          var page = parseInt(pageBtn.dataset.page);
          if (page && page !== currentPage) {
            renderPage(page);
          }
        }
      });
      paginationBound = true;
    }
    if (resultsEl) resultsEl.style.display = '';
    // Data not yet loaded — show spinner and wait
    if (!localSearch.isfetched) {
      loadingEl.innerHTML = '<span class="search-spinner"></span>';
      localSearch.fetchData();
      return;
    }
    // Run search with current input value if already typed
    if (input && input.value.trim()) {
      loadingEl.innerHTML = '<span class="search-spinner"></span>';
      setTimeout(doSearch, 0);
    }
  }

  function deactivate() {
    active = false;
    if (resultsEl) resultsEl.style.display = 'none';
  }

  // ── events ───────────────────────────────────────────────────────
  window.addEventListener('search:loaded', onDataLoaded);

  window.addEventListener('pjax:success', function() {
    highlightSearchWords();
    if (active) deactivate();
  });

  // Initial highlight on page load
  highlightSearchWords();

  // Preload data if configured
  if (config.preload) {
    localSearch.fetchData();
  }

  return { activate: activate, deactivate: deactivate };
}
