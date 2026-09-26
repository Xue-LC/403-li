<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📝 Markdown 预览器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：Markdown 输入 -->
          <div class="tool-col">
            <label class="tool-label">Markdown 输入：</label>
            <div class="md-toolbar">
              <button @click="insertMd('heading')" title="标题">H#</button>
              <button @click="insertMd('bold')" title="粗体"><b>B</b></button>
              <button @click="insertMd('italic')" title="斜体"><i>I</i></button>
              <button @click="insertMd('strikethrough')" title="删除线"><s>S</s></button>
              <button @click="insertMd('link')" title="链接">🔗</button>
              <button @click="insertMd('image')" title="图片">🖼</button>
              <button @click="insertMd('code')" title="行内代码">&lt;/&gt;</button>
              <button @click="insertMd('codeblock')" title="代码块">{ }</button>
              <button @click="insertMd('quote')" title="引用">❝</button>
              <button @click="insertMd('ul')" title="无序列表">• List</button>
              <button @click="insertMd('ol')" title="有序列表">1. List</button>
              <button @click="insertMd('table')" title="表格">▦</button>
              <button @click="insertMd('hr')" title="分割线">——</button>
            </div>
            <textarea
              ref="textareaRef"
              v-model="input"
              class="code-input"
              rows="18"
              placeholder="在此输入 Markdown 文本...

# 标题示例
**粗体** *斜体* ~~删除线~~
- 列表项
[链接](https://403.li)"
            ></textarea>
          </div>

          <!-- 右侧：渲染预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div
              class="markdown-preview"
              v-html="renderedHtml"
            ></div>
          </div>
        </div>

        <div class="button-group">
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">📋 复制输入</button>
          <button class="tool-button" @click="copyHtml" :disabled="!renderedHtml.trim()">📋 复制 HTML</button>
          <button class="tool-button primary" @click="exportHtml" :disabled="!input.trim()">📥 导出 HTML</button>
          <button class="tool-button danger" @click="clearAll" :disabled="!input.trim()">🗑 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyText } from '../../utils/clipboard'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const input = ref('')
const textareaRef = ref(null)
const error = ref('')
const success = ref('')

// 快捷插入 Markdown 语法
const insertSnippets = {
  heading: { before: '## ', after: '', placeholder: '标题' },
  bold: { before: '**', after: '**', placeholder: '粗体文本' },
  italic: { before: '*', after: '*', placeholder: '斜体文本' },
  strikethrough: { before: '~~', after: '~~', placeholder: '删除线文本' },
  link: { before: '[', after: '](https://)', placeholder: '链接文字' },
  image: { before: '![', after: '](https://)', placeholder: '图片描述' },
  code: { before: '`', after: '`', placeholder: 'code' },
  codeblock: { before: '```\n', after: '\n```', placeholder: 'code block' },
  quote: { before: '> ', after: '', placeholder: '引用内容' },
  ul: { before: '- ', after: '', placeholder: '列表项' },
  ol: { before: '1. ', after: '', placeholder: '列表项' },
  table: { before: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n', after: '', placeholder: '| 数据 | 数据 | 数据 |' },
  hr: { before: '\n---\n', after: '', placeholder: '' }
}

function insertMd(type) {
  const ta = textareaRef.value
  if (!ta) return
  const snippet = insertSnippets[type]
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = input.value.substring(start, end) || snippet.placeholder
  const before = input.value.substring(0, start)
  const after = input.value.substring(end)
  input.value = before + snippet.before + selected + snippet.after + after
  // 恢复光标选区
  nextTick(() => {
    const cursorStart = start + snippet.before.length
    const cursorEnd = cursorStart + selected.length
    ta.focus()
    ta.setSelectionRange(cursorStart, cursorEnd)
  })
}

// 计算渲染后的 HTML（实时预览）
const renderedHtml = computed(() => {
  if (!input.value.trim()) {
    return '<p style="color: #666; font-style: italic">等待输入 Markdown 文本…</p>'
  }
  try {
    return marked.parse(input.value)
  } catch (e) {
    return `<p style="color: #ff6b6b">渲染出错：${e.message}</p>`
  }
})

// 消毒后的预览 HTML（v-html 只用这个，导出保留原始 HTML）
const previewHtml = computed(() => DOMPurify.sanitize(renderedHtml.value))

// 生成完整 HTML 文档
function buildFullHtml() {
  const body = renderedHtml.value
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Preview</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.7;
      color: #333;
      background: #fff;
    }
    pre { background: #f5f5f5; padding: 16px; border-radius: 0; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 0; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
    blockquote {
      border-left: 4px solid #9dff6b;
      margin: 16px 0;
      padding: 8px 16px;
      background: #f8f8f8;
    }
    img { max-width: 100%; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

async function copyInput() {
  if (await copyText(input.value)) {
    success.value = '输入内容已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyHtml() {
  if (await copyText(renderedHtml.value)) {
    success.value = 'HTML 已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function exportHtml() {
  const fullHtml = buildFullHtml()
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'markdown-preview.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  success.value = 'HTML 文件已下载'
  setTimeout(() => { success.value = '' }, 2000)
}

function clearAll() {
  input.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.markdown-preview {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 16px 20px;
  min-height: 300px;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
  word-wrap: break-word;
}

/* 快捷工具栏 */
.md-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  margin-bottom: -1px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-bottom: none;
}
.md-toolbar button {
  background: var(--panel);
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.4;
  font-family: inherit;
}
.md-toolbar button:hover {
  background: var(--card);
  color: var(--green);
  border-color: var(--green);
}
/* 让 textarea 上边框与工具栏无缝衔接 */
.md-toolbar + textarea.code-input {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* 预览区 Markdown 元素样式 */
.markdown-preview :deep(h1) {
  font-size: 1.8em;
  margin: 0.6em 0 0.4em;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.3em;
  color: var(--green);
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  margin: 0.6em 0 0.3em;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.2em;
  color: var(--green);
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
  margin: 0.5em 0 0.3em;
  color: var(--accent);
}

.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 0.4em 0 0.2em;
  color: var(--accent);
}

.markdown-preview :deep(p) {
  margin: 0.5em 0;
}

.markdown-preview :deep(strong) {
  color: var(--text);
}

.markdown-preview :deep(a) {
  color: var(--green);
  text-decoration: underline;
}
.markdown-preview :deep(a:hover) {
  color: var(--accent);
}

.markdown-preview :deep(code) {
  background: var(--panel);
  color: var(--green);
  padding: 2px 6px;
  border-radius: 0;
  font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre) {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 14px 18px;
  overflow-x: auto;
  margin: 0.8em 0;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--text);
  font-size: 13px;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--green);
  margin: 0.8em 0;
  padding: 8px 16px;
  background: var(--green-soft);
  color: var(--muted);
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 24px;
  margin: 0.5em 0;
}

.markdown-preview :deep(li) {
  margin: 0.2em 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--line);
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--panel);
  color: var(--green);
  font-weight: 600;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1em 0;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 0;
}

.markdown-preview :deep(del) {
  color: var(--text-muted);
}

.markdown-preview :deep(input[type="checkbox"]) {
  margin-right: 8px;
  accent-color: var(--green);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .markdown-preview {
    min-height: 200px;
    padding: 12px 14px;
    font-size: 13px;
  }
}
</style>
