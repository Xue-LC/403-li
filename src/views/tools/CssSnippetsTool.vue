<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 CSS 常用代码片段</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 搜索 + 分类筛选（全宽） -->
        <div class="filter-bar">
          <div class="filter-row">
            <input
              v-model="search"
              class="code-input-sm snp-search"
              placeholder="🔍 搜索片段：标题 / 说明 / CSS 属性，如 flex、截断、scrollbar、backdrop"
            />
            <span class="filter-count">{{ filtered.length }} / {{ snippets.length }} 个片段</span>
          </div>
          <div class="filter-row">
            <button
              v-for="c in categories"
              :key="c.key"
              class="cat-chip"
              :class="{ active: cat === c.key }"
              type="button"
              @click="cat = c.key"
            >
              {{ c.label }}<span class="cat-num">{{ countOf(c.key) }}</span>
            </button>
          </div>
        </div>

        <!-- 双栏：片段目录 / 预览 + 代码 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              片段目录：{{ filtered.length }} 个
              <button
                class="copy-btn label-copy-btn"
                title="复制当前目录清单"
                :disabled="!filtered.length"
                @click="copyIndex"
              >📋</button>
            </label>
            <div v-if="!filtered.length" class="code-input output output-empty">
              没有匹配的片段
              <span class="empty-sub">换个关键词试试，或把分类切回「全部」</span>
            </div>
            <div v-else class="snp-list">
              <div
                v-for="s in filtered"
                :key="s.id"
                class="snp-item"
                :class="{ active: s.id === selectedId }"
                @click="select(s.id)"
              >
                <div class="snp-item-head">
                  <span class="snp-title">{{ s.title }}</span>
                  <span class="snp-tag">{{ catName(s.cat) }}</span>
                  <button
                    class="copy-btn snp-copy"
                    title="复制该片段的 CSS"
                    @click.stop="copyOne(s)"
                  >📋</button>
                </div>
                <div class="snp-desc">{{ s.desc }}</div>
              </div>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">
              实时预览 / 代码
              <button
                class="copy-btn label-copy-btn"
                title="复制 CSS 代码"
                :disabled="!current"
                @click="copyCss"
              >📋</button>
            </label>
            <div class="snp-preview">
              <div :key="previewKey" class="snp-live" v-html="current.preview"></div>
            </div>
            <div class="snp-tip">💡 {{ current.tip }}</div>
            <pre class="snp-code" title="点击上方 📋 复制">{{ current.css }}</pre>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!current" @click="copyCss">📋 复制 CSS</button>
          <button class="tool-button" :disabled="!current" @click="copyHtml">📋 复制 HTML</button>
          <button class="tool-button" :disabled="!current" @click="copyAll">📋 复制 CSS+HTML</button>
          <button class="tool-button" :disabled="!current" @click="replay">▶ 重播预览</button>
        </div>
        <div class="button-group button-group-2">
          <button class="tool-button" @click="loadSample">🧪 随机片段</button>
          <button class="tool-button danger" @click="reset">🗑️ 重置筛选</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ============================================================
 * 演示区通用样式（只作用于预览区，不会被复制）
 * ============================================================ */
const BASE_DEMO = `
.demo-box {
  border: 1px dashed var(--line);
  background: var(--panel);
  padding: 10px;
}

.demo-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: var(--green-soft);
  border: 1px solid var(--green);
  color: var(--green);
  font-size: 12px;
}

.demo-note {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}
`

/* ============================================================
 * 片段库（CSS 中只用主题变量，方便直接用于本项目）
 * ============================================================ */
const snippets = [
  /* ---------------- 布局 ---------------- */
  {
    id: 'flex-center',
    title: 'Flex 完美居中',
    cat: 'layout',
    desc: '子元素水平 + 垂直居中，最常用的居中方案',
    tip: '虚线框是容器，绿色方块是被居中的子元素',
    css: `.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}`,
    preview: '<div class="demo-box flex-center demo-center-box"><span class="demo-chip">居中</span></div>',
    demo: `.demo-center-box { height: 130px; }
.demo-chip { width: 64px; height: 64px; }`
  },
  {
    id: 'grid-center',
    title: 'Grid 居中（place-items）',
    cat: 'layout',
    desc: '一行代码搞定居中，子元素宽度自适应不拉伸',
    tip: 'place-items: center 等价于 align-items + justify-items',
    css: `.grid-center {
  display: grid;
  place-items: center;
}`,
    preview: '<div class="demo-box grid-center demo-center-box"><span class="demo-chip">居中</span></div>',
    demo: `.demo-center-box { height: 130px; }
.demo-chip { width: 64px; height: 64px; }`
  },
  {
    id: 'equal-cols',
    title: 'Flex 等高列',
    cat: 'layout',
    desc: '多列等宽且自动等高（默认 stretch）',
    tip: 'flex: 1 1 0 表示可放大可缩小、基准宽度为 0，因此各列严格等宽',
    css: `.equal-cols {
  display: flex;
  gap: 12px;
}

/* 子元素等宽，并自动拉伸到最高一列的高度 */
.equal-cols > * {
  flex: 1 1 0;
}`,
    preview: '<div class="equal-cols"><div class="demo-card">列 A<br />两行</div><div class="demo-card">列 B</div><div class="demo-card">列 C</div></div>',
    demo: `.demo-card {
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 12px;
  text-align: center;
  line-height: 1.7;
}`
  },
  {
    id: 'sticky-footer',
    title: '粘性页脚（撑满视口）',
    cat: 'layout',
    desc: '内容不足时页脚依然贴在底部',
    tip: 'min-height 用 100dvh 可以更好地兼容移动端地址栏收缩',
    css: `.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 移动端可换成 100dvh */
}

.page main {
  flex: 1; /* 主体撑开，把页脚顶到底部 */
}`,
    preview: '<div class="page demo-page"><div class="demo-bar">header</div><main class="demo-main">main（flex: 1）</main><div class="demo-bar">footer</div></div>',
    demo: `.demo-page { height: 190px; min-height: 0; display: flex; flex-direction: column; border: 1px dashed var(--line); }
.demo-bar { padding: 6px 10px; background: var(--panel); border: 1px solid var(--line); color: var(--muted); font-size: 12px; }
.demo-main { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--green); font-size: 12px; }`
  },
  {
    id: 'abs-center',
    title: '绝对定位居中',
    cat: 'layout',
    desc: '不依赖 Flex，绝对定位元素水平垂直居中',
    tip: '父元素必须设置 position: relative 或其它非 static 定位',
    css: `.abs-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`,
    preview: '<div class="demo-stage"><span class="abs-center demo-chip">居中</span></div>',
    demo: `.demo-stage { position: relative; height: 150px; border: 1px dashed var(--line); background: var(--panel); }
.demo-chip { padding: 10px 14px; }`
  },
  {
    id: 'aspect-ratio',
    title: '固定宽高比容器',
    cat: 'layout',
    desc: '不用 padding-top 黑魔法，直接锁定 16:9',
    tip: '把 16 / 9 换成 4 / 3、1 / 1 即可得到其它比例',
    css: `.aspect-16x9 {
  aspect-ratio: 16 / 9;
  width: 100%;
}`,
    preview: '<div class="aspect-16x9 demo-ratio">16 : 9</div>',
    demo: `.demo-ratio {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  font-size: 13px;
}`
  },
  {
    id: 'sticky-header',
    title: '吸顶表头 / 导航',
    cat: 'layout',
    desc: '滚动时表头固定在容器顶部',
    tip: '在预览区向下滚动，表头会一直吸在顶部',
    css: `.sticky-header {
  position: sticky;
  top: 0; /* 距离顶部 0 时吸顶 */
  z-index: 10;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
}`,
    preview: '<div class="demo-scroll"><div class="sticky-header demo-sticky">⬆ 吸顶表头（向下滚动看看）</div><p class="demo-line">数据行 1</p><p class="demo-line">数据行 2</p><p class="demo-line">数据行 3</p><p class="demo-line">数据行 4</p><p class="demo-line">数据行 5</p><p class="demo-line">数据行 6</p><p class="demo-line">数据行 7</p></div>',
    demo: `.demo-scroll { height: 180px; overflow-y: auto; border: 1px dashed var(--line); }
.demo-sticky { padding: 8px 10px; color: var(--green); font-size: 12px; }
.demo-line { margin: 0; padding: 8px 10px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 12px; }`
  },
  {
    id: 'auto-grid',
    title: '自适应卡片网格',
    cat: 'layout',
    desc: '容器宽度变化时自动增减列数，无需媒体查询',
    tip: 'minmax(110px, 1fr) 中的 110px 是卡片最小宽度',
    css: `.auto-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}`,
    preview: '<div class="auto-grid"><span class="demo-cell">1</span><span class="demo-cell">2</span><span class="demo-cell">3</span><span class="demo-cell">4</span><span class="demo-cell">5</span><span class="demo-cell">6</span></div>',
    demo: `.demo-cell {
  padding: 16px 0;
  text-align: center;
  background: var(--panel);
  border: 1px solid var(--green);
  color: var(--green);
  font-size: 12px;
}`
  },

  /* ---------------- 文本 ---------------- */
  {
    id: 'truncate',
    title: '单行文本截断',
    cat: 'text',
    desc: '超出一行时显示省略号',
    tip: '必须搭配 overflow: hidden 与 white-space: nowrap 才生效',
    css: `.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}`,
    preview: '<div class="truncate demo-truncate">这是一段很长很长的文本，宽度不够时会自动变成省略号…</div>',
    demo: `.demo-truncate {
  max-width: 280px;
  padding: 8px 10px;
  border: 1px dashed var(--line);
  color: var(--text);
  font-size: 13px;
}`
  },
  {
    id: 'line-clamp',
    title: '多行文本截断',
    cat: 'text',
    desc: '限制显示行数，超出部分自动省略',
    tip: '把 -webkit-line-clamp 改成 3 就是三行截断',
    css: `.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`,
    preview: '<div class="line-clamp-2 demo-clamp">层叠样式表（Cascading Style Sheets）是一种用来表现 HTML 或 XML 等文件样式的计算机语言，它能让结构与表现彻底分离，是现代网页设计的基石之一。</div>',
    demo: `.demo-clamp {
  padding: 8px 10px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.9;
}`
  },
  {
    id: 'vertical-text',
    title: '竖排文字',
    cat: 'text',
    desc: '让文字从上到下纵向排列',
    tip: 'text-orientation: upright 让拉丁字母也保持正立',
    css: `.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 2px;
}`,
    preview: '<div class="vertical-text demo-vtext">竖排文字 VERTICAL</div>',
    demo: `.demo-vtext { height: 150px; font-size: 14px; color: var(--text); }`
  },
  {
    id: 'drop-cap',
    title: '首字下沉',
    cat: 'text',
    desc: '段首字母放大占两行，杂志排版常用',
    tip: '::first-letter 只对块级元素生效',
    css: `.drop-cap::first-letter {
  float: left;
  font-size: 3em;
  line-height: 0.9;
  padding: 4px 8px 0 0;
  color: var(--green);
  font-weight: 700;
}`,
    preview: '<p class="drop-cap demo-cap">层叠样式表是一种用来表现 HTML 或 XML 等文件样式的计算机语言，它让结构与表现彻底分离。</p>',
    demo: `.demo-cap { margin: 0; font-size: 13px; line-height: 1.9; color: var(--muted); }`
  },
  {
    id: 'text-glow',
    title: '霓虹发光文字',
    cat: 'text',
    desc: '多层 text-shadow 叠加出终端发光效果',
    tip: '减小半径或降低透明度可以做得更含蓄',
    css: `.text-glow {
  color: var(--green);
  text-shadow:
    0 0 6px var(--green-soft),
    0 0 18px var(--green-soft),
    0 0 36px var(--green-glow);
}`,
    preview: '<div class="text-glow demo-glow">NEON 霓虹文字</div>',
    demo: `.demo-glow { padding: 28px 0; text-align: center; font-size: 20px; letter-spacing: 2px; }`
  },
  {
    id: 'gradient-text',
    title: '渐变文字',
    cat: 'text',
    desc: '用 background-clip: text 给文字上渐变',
    tip: 'color 必须设为 transparent，否则会盖住渐变',
    css: `.gradient-text {
  background: linear-gradient(90deg, var(--text), var(--green));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}`,
    preview: '<div class="gradient-text demo-grad">渐变文字效果</div>',
    demo: `.demo-grad { padding: 28px 0; text-align: center; font-size: 22px; font-weight: 700; letter-spacing: 1px; }`
  },
  {
    id: 'multi-col',
    title: '多栏文本（报纸排版）',
    cat: 'text',
    desc: '把长文本自动分栏，并带分隔线',
    tip: 'column-count: auto + column-width 可以做成响应式分栏',
    css: `.multi-col {
  column-count: 2;
  column-gap: 18px;
  column-rule: 1px solid var(--line);
}`,
    preview: '<div class="multi-col demo-coltext">层叠样式表可以精确控制文本的排版细节，包括分栏、行高与字距。多栏布局适合内容密集的阅读型页面，浏览器会自动把内容均衡分配到各栏，并保持文本在栏间自然流动。当一栏高度不够时，内容会自动流入下一栏。</div>',
    demo: `.demo-coltext { font-size: 12px; line-height: 1.9; color: var(--muted); }`
  },

  /* ---------------- 视觉 ---------------- */
  {
    id: 'custom-scrollbar',
    title: '自定义滚动条',
    cat: 'decor',
    desc: '同时兼容 WebKit 与 Firefox 的滚动条美化',
    tip: '在预览区滚动可以看到绿色滚动条',
    css: `.custom-scrollbar {
  overflow-y: auto;
  scrollbar-width: thin;                        /* Firefox */
  scrollbar-color: var(--green) var(--panel-2); /* Firefox */
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--panel-2);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--green);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}`,
    preview: '<div class="custom-scrollbar demo-scroll"><p class="demo-line">滚动条样式行 1</p><p class="demo-line">滚动条样式行 2</p><p class="demo-line">滚动条样式行 3</p><p class="demo-line">滚动条样式行 4</p><p class="demo-line">滚动条样式行 5</p><p class="demo-line">滚动条样式行 6</p><p class="demo-line">滚动条样式行 7</p></div>',
    demo: `.demo-scroll { height: 180px; border: 1px dashed var(--line); }
.demo-line { margin: 0; padding: 8px 10px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 12px; }`
  },
  {
    id: 'hide-scrollbar',
    title: '隐藏滚动条（保留滚动）',
    cat: 'decor',
    desc: '内容仍可滚动，但不显示滚动条',
    tip: '移动端横向滑动列表常用这个技巧',
    css: `.hide-scrollbar {
  overflow: auto;
  scrollbar-width: none;    /* Firefox */
  -ms-overflow-style: none; /* 旧版 IE / Edge */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome / Safari */
}`,
    preview: '<div class="hide-scrollbar demo-scroll"><p class="demo-line">看不到滚动条，但仍可滚动 1</p><p class="demo-line">看不到滚动条，但仍可滚动 2</p><p class="demo-line">看不到滚动条，但仍可滚动 3</p><p class="demo-line">看不到滚动条，但仍可滚动 4</p><p class="demo-line">看不到滚动条，但仍可滚动 5</p><p class="demo-line">看不到滚动条，但仍可滚动 6</p></div>',
    demo: `.demo-scroll { height: 180px; border: 1px dashed var(--line); }
.demo-line { margin: 0; padding: 8px 10px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 12px; }`
  },
  {
    id: 'glass',
    title: '毛玻璃效果',
    cat: 'decor',
    desc: 'backdrop-filter 模糊背景，做出磨砂玻璃卡片',
    tip: '必须有半透明背景 + 上层内容才看得出效果',
    css: `.glass {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.12);
}`,
    preview: '<div class="demo-glass-stage"><div class="glass demo-glass-card">毛玻璃卡片：背景被模糊并提亮</div></div>',
    demo: `.demo-glass-stage {
  padding: 18px;
  background:
    radial-gradient(circle at 25% 25%, rgba(var(--accent-rgb), 0.45), transparent 60%),
    radial-gradient(circle at 78% 72%, rgba(var(--accent-rgb), 0.3), transparent 55%),
    var(--panel-2);
  border: 1px dashed var(--line);
}
.demo-glass-card { padding: 18px; color: var(--text); font-size: 13px; }`
  },
  {
    id: 'skeleton',
    title: '骨架屏加载动画',
    cat: 'decor',
    desc: '流光扫过的高亮条，占位等待数据',
    tip: '给容器设置不同宽高就能搭出任意骨架结构',
    css: `.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.16) 37%,
    rgba(255, 255, 255, 0.06) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}`,
    preview: '<div class="demo-skel-row"><div class="skeleton demo-skel-avatar"></div><div class="demo-skel-lines"><div class="skeleton demo-skel-line" style="width: 92%"></div><div class="skeleton demo-skel-line" style="width: 70%"></div><div class="skeleton demo-skel-line" style="width: 45%"></div></div></div>',
    demo: `.demo-skel-row { display: flex; gap: 12px; align-items: flex-start; }
.skeleton { border: 1px solid var(--line); }
.demo-skel-avatar { width: 48px; height: 48px; flex-shrink: 0; }
.demo-skel-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.demo-skel-line { height: 12px; }`
  },
  {
    id: 'triangle',
    title: '纯 CSS 三角形',
    cat: 'decor',
    desc: '零图片，用 border 拼出三角形箭头',
    tip: '把 border-bottom 换成 border-top 就是向下箭头',
    css: `.triangle-up {
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 22px solid var(--green);
}`,
    preview: '<div class="demo-tri"><span class="triangle-up"></span></div>',
    demo: `.demo-tri { display: flex; align-items: center; justify-content: center; padding: 40px 0; }`
  },
  {
    id: 'gradient-border',
    title: '渐变描边卡片',
    cat: 'decor',
    desc: '两层 background 叠加，实现渐变边框',
    tip: 'padding-box 与 border-box 的组合是关键，边框必须透明',
    css: `.gradient-border {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--panel), var(--panel)) padding-box,
    linear-gradient(135deg, var(--green), transparent) border-box;
}`,
    preview: '<div class="gradient-border demo-gborder">渐变描边卡片</div>',
    demo: `.demo-gborder { padding: 20px; text-align: center; color: var(--text); font-size: 13px; }`
  },
  {
    id: 'checkerboard',
    title: '棋盘格透明背景',
    cat: 'decor',
    desc: '表示透明区域的经典棋盘底纹',
    tip: '拿它做透明 PNG / 透明色预览区的底衬很合适',
    css: `.checkerboard {
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.07) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.07) 75%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.07) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.07) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
}`,
    preview: '<div class="checkerboard demo-checker">棋盘格背景</div>',
    demo: `.demo-checker {
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 12px;
}`
  },
  {
    id: 'zebra-table',
    title: '斑马纹表格',
    cat: 'decor',
    desc: '隔行变色，长表格更易读',
    tip: 'nth-child(odd) 也可以换成 nth-child(even)',
    css: `.zebra-table {
  width: 100%;
  border-collapse: collapse;
}

.zebra-table th,
.zebra-table td {
  padding: 6px 10px;
  border: 1px solid var(--line);
  text-align: left;
  font-size: 12px;
}

.zebra-table tbody tr:nth-child(odd) {
  background: rgba(255, 255, 255, 0.04);
}`,
    preview: '<table class="zebra-table"><thead><tr><th>名称</th><th>类型</th><th>状态</th></tr></thead><tbody><tr><td>alpha</td><td>文本</td><td>正常</td></tr><tr><td>beta</td><td>数字</td><td>正常</td></tr><tr><td>gamma</td><td>布尔</td><td>停用</td></tr><tr><td>delta</td><td>日期</td><td>正常</td></tr></tbody></table>',
    demo: `.zebra-table { color: var(--text); }
.zebra-table th { color: var(--green); }`
  },

  /* ---------------- 动效 ---------------- */
  {
    id: 'pulse-ring',
    title: '呼吸灯脉冲动画',
    cat: 'effect',
    desc: 'box-shadow 扩散做呼吸/录制指示效果',
    tip: '点击下方「重播预览」可重新播放',
    css: `.pulse-ring {
  animation: pulse-ring 1.8s ease-out infinite;
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 var(--green-soft); }
  70%  { box-shadow: 0 0 0 14px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}`,
    preview: '<div class="pulse-ring demo-pulse"></div>',
    demo: `.demo-pulse { width: 28px; height: 28px; margin: 40px auto; background: var(--green); }`
  },
  {
    id: 'hover-lift',
    title: '悬停上浮 + 投影',
    cat: 'effect',
    desc: '鼠标移入时卡片轻微上浮，增加层次感',
    tip: '过渡只写 transform 与 box-shadow，性能更好',
    css: `.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}`,
    preview: '<div class="demo-lift-wrap"><div class="hover-lift demo-lift">鼠标悬停试试</div></div>',
    demo: `.demo-lift-wrap { display: flex; justify-content: center; padding: 24px 0; }
.demo-lift {
  padding: 16px 22px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 13px;
}`
  },
  {
    id: 'smooth-scroll',
    title: '平滑滚动',
    cat: 'effect',
    desc: '锚点跳转 / scrollIntoView 时平滑过渡',
    tip: '加到 html 上可让全站锚点平滑滚动',
    css: `.smooth-scroll {
  scroll-behavior: smooth; /* 也可以直接写在 html 选择器上 */
}`,
    preview: '<div class="smooth-scroll demo-smooth"><div class="demo-sec">第 1 节</div><div class="demo-sec">第 2 节</div><div class="demo-sec">第 3 节</div><div class="demo-sec">第 4 节</div><div class="demo-sec">第 5 节 · 终点</div></div>',
    demo: `.demo-smooth { height: 180px; overflow-y: auto; border: 1px dashed var(--line); }
.demo-sec { padding: 10px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 12px; }`
  },
  {
    id: 'fade-in-up',
    title: '入场淡入上移',
    cat: 'effect',
    desc: '列表 / 卡片出现时的轻量入场动画',
    tip: 'animation-fill-mode: both 让起始状态在动画前也生效',
    css: `.fade-in-up {
  animation: fade-in-up 0.5s ease both;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}`,
    preview: '<div class="fade-in-up demo-box demo-fade"><span class="demo-chip">淡入上移</span></div>',
    demo: `.demo-fade { height: 130px; display: flex; align-items: center; justify-content: center; }`
  },
  {
    id: 'underline-anim',
    title: '下划线滑入动画',
    cat: 'effect',
    desc: 'hover 时下划线从左向右展开',
    tip: '把 width 换成 transform: scaleX 会更顺滑',
    css: `.underline-anim {
  position: relative;
  text-decoration: none;
  color: var(--text);
}

.underline-anim::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 0;
  height: 2px;
  background: var(--green);
  transition: width 0.25s ease;
}

.underline-anim:hover::after {
  width: 100%;
}`,
    preview: '<div class="demo-note">鼠标悬停下方文字：</div><span class="underline-anim demo-under">悬停查看下划线动画</span>',
    demo: `.demo-under { display: inline-block; margin-top: 12px; cursor: pointer; font-size: 14px; }`
  },

  /* ---------------- 工具类 ---------------- */
  {
    id: 'object-cover',
    title: '图片填满容器',
    cat: 'utility',
    desc: 'object-fit: cover 让图片裁剪填满且不变形',
    tip: '替换成 contain 则完整显示图片并留白',
    css: `.object-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}`,
    preview: '<div class="demo-cover-box"><img class="object-cover" alt="cover 示例" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'200\'%3E%3Crect width=\'400\' height=\'200\' fill=\'%23161b22\'/%3E%3Ccircle cx=\'200\' cy=\'100\' r=\'70\' fill=\'none\' stroke=\'%239dff6b\' stroke-width=\'4\'/%3E%3Ctext x=\'200\' y=\'106\' font-size=\'18\' fill=\'%239dff6b\' text-anchor=\'middle\' font-family=\'monospace\'%3E400x200%3C/text%3E%3C/svg%3E" /></div>',
    demo: `.demo-cover-box { width: 100%; height: 150px; border: 1px dashed var(--line); overflow: hidden; }
.demo-cover-box img { display: block; }`
  },
  {
    id: 'visually-hidden',
    title: '无障碍隐藏',
    cat: 'utility',
    desc: '对视觉隐藏，但仍可被屏幕阅读器读出',
    tip: '不要用 display: none，那样读屏软件也读不到',
    css: `.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}`,
    preview: '<div class="demo-note">下方元素被 .visually-hidden 隐藏，页面上看不到：</div><span class="visually-hidden">只有屏幕阅读器能读到的说明文字</span><div class="demo-note demo-note-space">它依然存在于无障碍树中，供辅助技术朗读。</div>',
    demo: `.demo-note-space { margin-top: 10px; }`
  },
  {
    id: 'no-select',
    title: '禁止选中文本',
    cat: 'utility',
    desc: '按钮、图标等交互元素避免被拖选',
    tip: '整页禁用请写在 html/body 上，别用 user-select: none 大范围覆盖正文',
    css: `.no-select {
  user-select: none;
  -webkit-user-select: none;
}`,
    preview: '<div class="no-select demo-box">这段文字无法用鼠标选中（user-select: none）</div>',
    demo: `.demo-box { color: var(--text); font-size: 13px; text-align: center; padding: 20px 10px; }`
  },
  {
    id: 'focus-ring',
    title: '键盘聚焦轮廓',
    cat: 'utility',
    desc: '只在键盘操作时显示焦点框，兼顾美观与无障碍',
    tip: '按 Tab 键把焦点移进预览区即可看到轮廓',
    css: `.focus-ring:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}`,
    preview: '<div class="demo-focus-wrap"><button type="button" class="focus-ring demo-btn">按 Tab 键聚焦我</button></div>',
    demo: `.demo-focus-wrap { display: flex; justify-content: center; padding: 24px 0; }
.demo-btn {
  padding: 10px 16px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  background: var(--panel);
  border: 1px solid var(--line-strong);
  cursor: pointer;
}`
  }
]

const categories = [
  { key: 'all', label: '全部' },
  { key: 'layout', label: '布局' },
  { key: 'text', label: '文本' },
  { key: 'decor', label: '视觉' },
  { key: 'effect', label: '动效' },
  { key: 'utility', label: '工具类' }
]

const CAT_NAMES = {
  layout: '布局',
  text: '文本',
  decor: '视觉',
  effect: '动效',
  utility: '工具类'
}

const search = ref('')
const cat = ref('all')
const selectedId = ref(snippets[0].id)
const previewKey = ref(0)
const success = ref('')
const error = ref('')

let styleEl = null
let successTimer = null

function catName(key) {
  return CAT_NAMES[key] || key
}

function countOf(key) {
  return key === 'all' ? snippets.length : snippets.filter(s => s.cat === key).length
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return snippets.filter(s => {
    if (cat.value !== 'all' && s.cat !== cat.value) return false
    if (!q) return true
    const hay = `${s.title} ${s.desc} ${s.tip} ${s.css} ${catName(s.cat)}`.toLowerCase()
    return hay.includes(q)
  })
})

const current = computed(() => snippets.find(s => s.id === selectedId.value) || snippets[0])

watch(filtered, list => {
  if (list.length && !list.some(s => s.id === selectedId.value)) {
    selectedId.value = list[0].id
  }
})

/**
 * 去掉注释、把选择器统一加上作用域前缀，避免片段样式污染整页
 */
function scopeCss(css, scope) {
  const clean = String(css).replace(/\/\*[\s\S]*?\*\//g, '')

  function parseBlock(text) {
    let out = ''
    let i = 0
    while (i < text.length) {
      const brace = text.indexOf('{', i)
      if (brace === -1) break
      const selector = text.slice(i, brace).trim()
      let depth = 1
      let j = brace + 1
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      const body = text.slice(brace + 1, j - 1)
      if (selector.charAt(0) === '@') {
        out += /^@(media|supports|container|layer)/.test(selector)
          ? `${selector}{${parseBlock(body)}}`
          : `${selector}{${body}}`
      } else {
        const scoped = selector
          .split(',')
          .map(s => {
            const one = s.trim()
            if (!one) return one
            if (one.startsWith(scope)) return one
            return `${scope} ${one}`
          })
          .join(', ')
        out += `${scoped}{${body}}`
      }
      i = j
    }
    return out
  }

  return parseBlock(clean)
}

function applyPreviewStyle() {
  const s = current.value
  if (!s) return
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-tool', 'css-snippets-preview')
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = scopeCss(`${BASE_DEMO}\n${s.css}\n${s.demo}`, '.snp-live')
}

onMounted(applyPreviewStyle)
watch(current, applyPreviewStyle)
onBeforeUnmount(() => {
  if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
  styleEl = null
  clearTimeout(successTimer)
})

function flash(msg) {
  success.value = msg
  error.value = ''
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    success.value = ''
  }, 2000)
}

async function doCopy(text, msg) {
  if (!text) {
    error.value = '没有可复制的内容'
    return
  }
  const ok = await copyText(text)
  if (ok) flash(msg)
  else error.value = '复制失败，请手动选中内容后复制'
}

function select(id) {
  if (selectedId.value === id) {
    previewKey.value++
    return
  }
  selectedId.value = id
  previewKey.value++
}

function copyCss() {
  doCopy(current.value.css, `已复制「${current.value.title}」的 CSS`)
}

function copyHtml() {
  doCopy(current.value.preview, `已复制「${current.value.title}」的 HTML`)
}

function copyAll() {
  doCopy(`${current.value.css}\n\n${current.value.preview}`, `已复制「${current.value.title}」的 CSS + HTML`)
}

function copyOne(s) {
  selectedId.value = s.id
  doCopy(s.css, `已复制「${s.title}」的 CSS`)
}

function copyIndex() {
  const lines = filtered.value.map((s, i) => `${i + 1}. ${s.title}（${catName(s.cat)}）- ${s.desc}`)
  doCopy(`CSS 常用代码片段目录（${lines.length} 个）\n${lines.join('\n')}`, `已复制目录清单（${lines.length} 条）`)
}

function replay() {
  previewKey.value++
}

function loadSample() {
  const i = Math.floor(Math.random() * snippets.length)
  search.value = ''
  cat.value = 'all'
  selectedId.value = snippets[i].id
  previewKey.value++
  flash(`随机打开「${snippets[i].title}」`)
}

function reset() {
  search.value = ''
  cat.value = 'all'
  selectedId.value = snippets[0].id
  previewKey.value++
  error.value = ''
  success.value = ''
  clearTimeout(successTimer)
}
</script>

<style scoped>
/* 标签内联复制按钮 */
.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  vertical-align: middle;
  font-size: 14px;
}
.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 搜索 + 分类 */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0.5rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.snp-search {
  flex: 1;
  min-width: 220px;
  padding-right: 12px;
}

.filter-count {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
}

.cat-chip:hover {
  border-color: var(--line-strong);
  color: var(--text);
}

.cat-chip.active {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.cat-num {
  font-size: 11px;
  color: var(--dim);
}

.cat-chip.active .cat-num {
  color: var(--green);
}

/* 片段列表 */
.snp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

.snp-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.snp-item:hover {
  border-color: var(--line-strong);
}

.snp-item.active {
  border-color: var(--green);
  background: var(--green-soft);
}

.snp-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.snp-title {
  flex: 1;
  min-width: 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
}

.snp-tag {
  flex-shrink: 0;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 5px;
  white-space: nowrap;
}

.snp-copy {
  position: static;
  flex-shrink: 0;
  font-size: 13px;
  padding: 2px 4px;
}

.snp-desc {
  margin-top: 5px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* 预览与代码 */
.snp-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 220px;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  overflow: auto;
}

.snp-live {
  width: 100%;
}

.snp-tip {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.7;
}

.snp-code {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre;
  tab-size: 2;
}

/* 空状态 */
.output-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
  cursor: default;
}

.empty-sub {
  font-size: 12px;
  color: var(--dim);
}

@media (max-width: 640px) {
  .snp-list {
    max-height: 320px;
  }

  .snp-search {
    min-width: 100%;
  }

  .snp-code {
    max-height: 200px;
    font-size: 12px;
  }
}
</style>
