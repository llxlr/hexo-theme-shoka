// 表格分页管理器
const TablePaginationManager = {
  // 默认配置
  config: {
    pageSize: 5,
    paginationClass: 'pagination',
    pageNumbersClass: 'page-numbers',
    pageInfoClass: 'page-info'
  },

  // 初始化所有表格
  initAllTables: function() {
    Object.assign(this.config, LOCAL.typesetting?.table);
    if (this.config.enable === false) return;
    const tables = document.querySelectorAll('.table-container > table');
    tables.forEach((table, index) => {
      let caption = table.querySelector('caption');
      if (!caption) {
        caption = document.createElement('caption');
        table.insertAdjacentElement('afterbegin', caption);
      }
      caption.id = `tab${index + 1}`;
      caption.dataset.type = LOCAL.label?.table || '表';
      this.initTablePagination(table, index);
    });
  },

  // 初始化单个表格的分页
  initTablePagination: function(table, tableIndex) {
    // 获取表格的所有行（不包括表头）
    const rows = Array.from(table.tBodies[0].rows);
    const totalRows = rows.length;

    // 如果行数少于等于每页大小，不需要分页
    if (totalRows <= this.config.pageSize) return;

    // 创建分页状态对象
    const paginationState = {
      currentPage: 1,
      totalPages: Math.ceil(totalRows / this.config.pageSize),
      tableIndex: tableIndex
    };

    // 存储分页状态
    table._paginationState = paginationState;

    // 创建分页控件
    this.createPaginationControls(table, paginationState);

    // 初始显示第一页
    this.showPage(table, 1);
  },

  // 创建分页控件
  createPaginationControls: function(table, state) {
    const self = this; // ★★★ 缓存 this 引用，供回调函数使用

    const paginationContainer = document.createElement('div');
    paginationContainer.className = this.config.paginationClass;

    // 添加上一页按钮
    const prevButton = document.createElement('button');
    // 创建按钮图标
    const prevIcon = document.createElement('i');
    prevIcon.className = 'ic i-angle-left';
    prevIcon.setAttribute('aria-label', '上一页');
    prevButton.appendChild(prevIcon);
    prevButton.addEventListener('click', function() {
      if (state.currentPage > 1) {
        self.showPage(table, state.currentPage - 1); // 使用 self
      }
    });
    paginationContainer.appendChild(prevButton);

    // 添加页码按钮容器
    const pageNumbersContainer = document.createElement('div');
    pageNumbersContainer.className = this.config.pageNumbersClass;
    paginationContainer.appendChild(pageNumbersContainer);

    // 添加下一页按钮
    const nextButton = document.createElement('button');
    // 创建按钮图标
    const nextIcon = document.createElement('i');
    nextIcon.className = 'ic i-angle-right';
    nextIcon.setAttribute('aria-label', '下一页');
    nextButton.appendChild(nextIcon);
    nextButton.addEventListener('click', function() {
      if (state.currentPage < state.totalPages) {
        self.showPage(table, state.currentPage + 1); // 使用 self
      }
    });
    paginationContainer.appendChild(nextButton);

    // 添加页面信息
    const pageInfo = document.createElement('div');
    pageInfo.className = this.config.pageInfoClass;
    pageInfo.innerHTML = `第 <span class="current-page">${state.currentPage}</span> 页，共 <span class="total-pages">${state.totalPages}</span> 页`;
    paginationContainer.appendChild(pageInfo);

    // 将分页控件添加到表格后面
    table.parentNode.insertBefore(paginationContainer, table.nextSibling);

    // 存储分页控件引用
    table._paginationControls = {
      prevButton: prevButton,
      nextButton: nextButton,
      pageNumbersContainer: pageNumbersContainer,
      pageInfo: pageInfo
    };

    // 更新分页控件状态
    this.updatePaginationControls(table);
  },

  // 显示指定页
  showPage: function(table, pageNum) {
    const state = table._paginationState;
    const rows = Array.from(table.tBodies[0].rows);

    // 更新当前页码
    state.currentPage = pageNum;

    // 计算起始和结束索引
    const startIndex = (pageNum - 1) * this.config.pageSize;
    const endIndex = Math.min(startIndex + this.config.pageSize, rows.length);

    // 隐藏所有行
    rows.forEach(row => {
      row.style.display = 'none';
    });

    // 显示当前页的行
    for (let i = startIndex; i < endIndex; i++) {
      rows[i].style.display = '';
    }

    // 更新分页控件
    this.updatePaginationControls(table);
  },

  // 更新分页控件状态
  updatePaginationControls: function(table) {
    const self = this; // ★★★ 缓存 this 引用

    const state = table._paginationState;
    const controls = table._paginationControls;

    if (!controls) return;

    // 更新按钮状态
    controls.prevButton.disabled = state.currentPage === 1;
    controls.nextButton.disabled = state.currentPage === state.totalPages;

    // 更新页码按钮
    controls.pageNumbersContainer.innerHTML = '';

    // 计算显示的页码范围
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(state.totalPages, startPage + 4);

    // 调整起始页码，确保显示5个页码（如果有足够多的页）
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.dataset.page = i; // 用 data 属性记录页码

      if (i === state.currentPage) {
        pageButton.classList.add('active');
      }
      (function(btn, pg) {
        btn.addEventListener('click', function() {
          self.showPage(table, pg);
        });
      })(pageButton, i);

      controls.pageNumbersContainer.appendChild(pageButton);
    }

    // 更新页面信息
    controls.pageInfo.innerHTML = `第 <span class="current-page">${state.currentPage}</span> 页，共 <span class="total-pages">${state.totalPages}</span> 页`;
  }
};

// 图片/图表标签管理器
const FigureLabelManager = {
  init: function() {
    const images = document.querySelectorAll('.image-info');
    images.forEach(function(element) {
      if (!element.hasAttribute('data-type')) {
        element.setAttribute('data-type', LOCAL.label?.figure || '图');
      }
    });
  }
};
