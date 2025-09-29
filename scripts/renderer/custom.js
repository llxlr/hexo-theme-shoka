'use strict';

// 替换英文引号
function replaceQuotes(text, options = {}) {
  const {
    openQuote = '「',
    closeQuote = '」'
  } = options;

  let result = '';
  let lastChar = '';
  let count = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      // 根据上下文决定使用开引号还是闭引号
      if (count % 2 === 0 || /\s$/.test(result)) {
        // 在开头或空格后使用开引号
        result += openQuote;
      } else {
        // 在文字后使用闭引号
        result += closeQuote;
      }
      count++;
    } else {
      result += char;
    }
    lastChar = char;
  }

  return result;
};

module.exports.replaceQuotes = replaceQuotes;
